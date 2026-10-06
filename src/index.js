export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const allowedOrigins = new Set([
      "https://www.ojobosco.com",
      "https://ojobosco.com",
      "https://ojobosco-site.contato-ojobosco.workers.dev"
    ]);

    const origin = request.headers.get("Origin");

    const corsHeaders = {
      "Access-Control-Allow-Origin":
        origin && allowedOrigins.has(origin)
          ? origin
          : "https://www.ojobosco.com",

      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type",

      "Access-Control-Max-Age":
        "86400"
    };


    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    /* =====================================================
       CONFIG
    ===================================================== */

    if (
      url.pathname === "/api/config" &&
      request.method === "GET"
    ) {
      if (!env.MERCADO_PAGO_PUBLIC_KEY) {
        return json(
          {
            error:
              "MERCADO_PAGO_PUBLIC_KEY não configurada."
          },
          500,
          corsHeaders
        );
      }

      return json(
        {
          publicKey:
            env.MERCADO_PAGO_PUBLIC_KEY
        },
        200,
        corsHeaders
      );
    }


    /* =====================================================
       PROCESSAR PAGAMENTO
    ===================================================== */

    if (
      url.pathname === "/api/process-payment" &&
      request.method === "POST"
    ) {
      if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
        return json(
          {
            error:
              "MERCADO_PAGO_ACCESS_TOKEN não configurado."
          },
          500,
          corsHeaders
        );
      }


      if (!env.DB) {
        return json(
          {
            error:
              "Banco de pedidos não conectado."
          },
          500,
          corsHeaders
        );
      }


      try {
        const body =
          await request.json();


        const validation =
          validateRequest(body);


        if (!validation.ok) {
          return json(
            {
              error:
                validation.message
            },
            400,
            corsHeaders
          );
        }


        const order =
          calculateServerOrder(body);


        if (!order.ok) {
          return json(
            {
              error:
                order.message
            },
            400,
            corsHeaders
          );
        }


        const paymentData =
          normalizeBrickPaymentData(
            body
          );


        const paymentValidation =
          validatePaymentSelection(
            paymentData,
            order.total
          );


        if (!paymentValidation.ok) {
          return json(
            {
              error:
                paymentValidation.message
            },
            400,
            corsHeaders
          );
        }


        const externalReference =
          createExternalReference();


        const mercadoPagoPayload =
          buildMercadoPagoOrder(
            body,
            order,
            paymentData,
            externalReference
          );


        const idempotencyKey =
          crypto.randomUUID();


        const mpResponse =
          await fetch(
            "https://api.mercadopago.com/v1/orders",
            {
              method: "POST",

              headers: {
                "Authorization":
                  `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,

                "Content-Type":
                  "application/json",

                "Accept":
                  "application/json",

                "X-Idempotency-Key":
                  idempotencyKey
              },

              body:
                JSON.stringify(
                  mercadoPagoPayload
                )
            }
          );


        let mpData = {};


        try {
          mpData =
            await mpResponse.json();
        } catch {
          mpData = {};
        }


        if (!mpResponse.ok) {
          console.error(
            "Mercado Pago error:",
            JSON.stringify(mpData)
          );


          return json(
            {
              error:
                mpData?.message ||
                "O Mercado Pago não conseguiu processar o pagamento.",

              details:
                sanitizeMercadoPagoError(
                  mpData
                )
            },
            mpResponse.status,
            corsHeaders
          );
        }


        const normalizedMP =
          normalizeMercadoPagoResponse(
            mpData
          );


        const savedOrder =
          await saveOrderToDatabase(
            env.DB,
            {
              externalReference,
              body,
              order,
              paymentData,
              mercadoPago:
                normalizedMP
            }
          );


        return json(
          {
            ...normalizedMP,

            internalOrderId:
              savedOrder.id,

            orderCode:
              savedOrder.orderCode
          },
          200,
          corsHeaders
        );

      } catch (error) {
        console.error(
          "Payment processing error:",
          error
        );


        return json(
          {
            error:
              error?.message ||
              "Erro interno ao processar o pagamento."
          },
          500,
          corsHeaders
        );
      }
    }


    /* =====================================================
       SITE ESTÁTICO
    ===================================================== */

    return env.ASSETS.fetch(request);
  }
};


/* =========================================================
   CATÁLOGO OFICIAL

   O PREÇO É RECALCULADO NO SERVIDOR.
========================================================= */

const PRODUCT_CATALOG = {
  "AROMATIZADOR|100": 179,
  "AROMATIZADOR|250": 209,

  "DIFUSOR|100": 189,
  "DIFUSOR|250": 219,

  "BIBLIOTECA OLFATIVA|5": 239,
  "BIBLIOTECA|5": 239,
  "BIBLIOTECA OLFATIVA|": 239,
  "BIBLIOTECA|": 239,

  "VELA|200": 289,
  "VELA|": 289,

  "PERFUME|100": 429,
  "CEDRO SOLAR|100": 429,
  "PERFUME|": 429,
  "CEDRO SOLAR|": 429
};


const VALID_COUPONS = {
  BEMVINDO: 0.10,
  CAMILAGUS: 0.10
};


const FREE_SHIPPING_THRESHOLD =
  500;


const SHIPPING_PRICES = {
  RMR: 15,
  NORDESTE: 35,
  CENTRO_OESTE: 45,
  SUDESTE: 55,
  NORTE_SUL: 65
};


/* =========================================================
   PARCELAMENTO
========================================================= */

function getMaximumInstallments(total) {
  const value =
    Number(total || 0);


  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 1;
  }


  if (value <= 300) {
    return 2;
  }


  if (value <= 400) {
    return 3;
  }


  if (value <= 500) {
    return 4;
  }


  const installments =
    4 +
    Math.floor(
      (
        value -
        500
      ) / 100
    );


  return Math.min(
    12,
    Math.max(
      1,
      installments
    )
  );
}


/* =========================================================
   VALIDAÇÃO
========================================================= */

function validateRequest(body) {
  if (
    !body ||
    typeof body !== "object"
  ) {
    return {
      ok: false,
      message:
        "Pedido inválido."
    };
  }


  if (
    !Array.isArray(body.cart) ||
    body.cart.length === 0
  ) {
    return {
      ok: false,
      message:
        "Carrinho vazio."
    };
  }


  if (
    !body.customer ||
    !String(
      body.customer.email ||
      ""
    ).trim()
  ) {
    return {
      ok: false,
      message:
        "E-mail do cliente não informado."
    };
  }


  if (
    !body.shipping ||
    !body.shipping.region
  ) {
    return {
      ok: false,
      message:
        "Frete não calculado."
    };
  }


  return {
    ok: true
  };
}


/* =========================================================
   CÁLCULO DO PEDIDO
========================================================= */

function calculateServerOrder(body) {
  let subtotal = 0;

  const normalizedItems = [];


  for (
    const item
    of body.cart
  ) {
    const product =
      normalizeText(
        item.product
      );


    const size =
      onlyNumbers(
        item.size
      );


    const quantity =
      Number(
        item.quantity
      );


    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 50
    ) {
      return {
        ok: false,
        message:
          "Quantidade inválida."
      };
    }


    const catalogKey =
      `${product}|${size}`;


    const unitPrice =
      PRODUCT_CATALOG[
        catalogKey
      ];


    if (
      unitPrice === undefined
    ) {
      return {
        ok: false,

        message:
          `Produto não reconhecido: ${item.product} ${item.size || ""}`.trim()
      };
    }


    subtotal +=
      unitPrice *
      quantity;


    normalizedItems.push({
      product:
        String(
          item.product ||
          ""
        ).trim(),

      fragrance:
        String(
          item.fragrance ||
          ""
        ).trim(),

      size:
        String(
          item.size ||
          ""
        ).trim(),

      quantity,

      unitPrice,

      totalPrice:
        roundMoney(
          unitPrice *
          quantity
        )
    });
  }


  subtotal =
    roundMoney(
      subtotal
    );


  const couponCode =
    normalizeText(
      body.coupon ||
      ""
    );


  const couponRate =
    VALID_COUPONS[
      couponCode
    ] || 0;


  const discount =
    roundMoney(
      subtotal *
      couponRate
    );


  const region =
    normalizeText(
      body.shipping.region
    );


  const normalShipping =
    SHIPPING_PRICES[
      region
    ];


  if (
    normalShipping ===
    undefined
  ) {
    return {
      ok: false,
      message:
        "Região de frete inválida."
    };
  }


  /*
    REGRA OJOBOSCO:

    COM CUPOM:
    desconto + frete normal.

    SEM CUPOM:
    subtotal >= 500
    = frete grátis.
  */

  let shipping;


  if (couponRate > 0) {
    shipping =
      normalShipping;
  } else if (
    subtotal >=
    FREE_SHIPPING_THRESHOLD
  ) {
    shipping = 0;
  } else {
    shipping =
      normalShipping;
  }


  shipping =
    roundMoney(
      shipping
    );


  const total =
    roundMoney(
      subtotal -
      discount +
      shipping
    );


  return {
    ok: true,

    items:
      normalizedItems,

    subtotal,

    discount,

    shipping,

    total,

    coupon:
      couponRate > 0
        ? couponCode
        : null
  };
}


/* =========================================================
   DADOS DO PAYMENT BRICK
========================================================= */

function normalizeBrickPaymentData(
  body
) {
  const form =
    body.formData ||
    {};


  const selected =
    normalizeText(
      body.selectedPaymentMethod ||
      ""
    );


  const paymentMethodId =
    String(
      form.payment_method_id ||
      form.paymentMethodId ||
      ""
    )
      .trim()
      .toLowerCase();


  const type =
    String(
      form.payment_method_type ||
      form.paymentMethodType ||
      ""
    )
      .trim()
      .toLowerCase();


  const token =
    String(
      form.token ||
      ""
    ).trim();


  const installments =
    Number(
      form.installments ||
      1
    );


  const isPix =
    paymentMethodId === "pix" ||
    selected === "PIX" ||
    selected === "BANK_TRANSFER" ||
    type === "bank_transfer";


  return {
    isPix,

    paymentMethodId:
      isPix
        ? "pix"
        : paymentMethodId,

    paymentMethodType:
      isPix
        ? "bank_transfer"
        : (
            type ||
            "credit_card"
          ),

    token,

    installments:
      Number.isInteger(
        installments
      )
        ? installments
        : 1
  };
}


function validatePaymentSelection(
  payment,
  total
) {
  if (payment.isPix) {
    return {
      ok: true
    };
  }


  if (!payment.token) {
    return {
      ok: false,
      message:
        "Token do cartão não recebido."
    };
  }


  if (
    !payment.paymentMethodId
  ) {
    return {
      ok: false,
      message:
        "Bandeira do cartão não recebida."
    };
  }


  const maxInstallments =
    getMaximumInstallments(
      total
    );


  if (
    payment.installments < 1 ||
    payment.installments >
      maxInstallments
  ) {
    return {
      ok: false,
      message:
        `Número de parcelas inválido. Máximo permitido: ${maxInstallments}x.`
    };
  }


  return {
    ok: true
  };
}


/* =========================================================
   MERCADO PAGO ORDER
========================================================= */

function buildMercadoPagoOrder(
  body,
  order,
  payment,
  externalReference
) {
  const customer =
    body.customer ||
    {};


  const payer = {
    email:
      String(
        customer.email ||
        ""
      ).trim()
  };


  if (customer.firstName) {
    payer.first_name =
      String(
        customer.firstName
      ).trim();
  }


  if (customer.lastName) {
    payer.last_name =
      String(
        customer.lastName
      ).trim();
  }


  if (payment.isPix) {
    return {
      type:
        "online",

      processing_mode:
        "automatic",

      total_amount:
        formatAmount(
          order.total
        ),

      external_reference:
        externalReference,

      payer,

      transactions: {
        payments: [
          {
            amount:
              formatAmount(
                order.total
              ),

            payment_method: {
              id:
                "pix",

              type:
                "bank_transfer"
            }
          }
        ]
      }
    };
  }


  return {
    type:
      "online",

    processing_mode:
      "automatic",

    total_amount:
      formatAmount(
        order.total
      ),

    external_reference:
      externalReference,

    payer,

    transactions: {
      payments: [
        {
          amount:
            formatAmount(
              order.total
            ),

          payment_method: {
            id:
              payment
                .paymentMethodId,

            type:
              payment
                .paymentMethodType ||
              "credit_card",

            token:
              payment.token,

            installments:
              payment.installments
          }
        }
      ]
    }
  };
}


/* =========================================================
   RESPOSTA DO MERCADO PAGO
========================================================= */

function normalizeMercadoPagoResponse(
  data
) {
  const payment =
    data?.transactions
      ?.payments?.[0] ||
    data?.payments?.[0] ||
    {};


  const paymentMethod =
    payment
      ?.payment_method ||
    {};


  const transactionData =
    payment
      ?.transaction_data ||
    paymentMethod
      ?.transaction_data ||
    {};


  return {
    orderId:
      data?.id ||
      null,

    paymentId:
      payment?.id ||
      null,

    status:
      payment?.status ||
      data?.status ||
      "pending",

    statusDetail:
      payment?.status_detail ||
      data?.status_detail ||
      "",

    paymentMethod:
      paymentMethod?.id ||
      "",

    paymentMethodType:
      paymentMethod?.type ||
      "",

    installments:
      Number(
        paymentMethod?.installments ||
        1
      ),

    qrCode:
      transactionData?.qr_code ||
      paymentMethod?.qr_code ||
      payment?.qr_code ||
      null,

    qrCodeBase64:
      transactionData
        ?.qr_code_base64 ||
      paymentMethod
        ?.qr_code_base64 ||
      payment
        ?.qr_code_base64 ||
      null,

    ticketUrl:
      transactionData
        ?.ticket_url ||
      paymentMethod
        ?.ticket_url ||
      payment?.ticket_url ||
      null
  };
}


/* =========================================================
   SALVAR NO D1
========================================================= */

async function saveOrderToDatabase(
  DB,
  {
    externalReference,
    body,
    order,
    paymentData,
    mercadoPago
  }
) {
  const customer =
    body.customer ||
    {};


  const address =
    customer.address ||
    {};


  const orderCode =
    externalReference;


  const insertOrder =
    await DB
      .prepare(
        `
        INSERT INTO orders (
          order_code,
          mercado_pago_order_id,
          mercado_pago_payment_id,
          status,
          status_detail,
          payment_method,
          installments,
          customer_first_name,
          customer_last_name,
          customer_email,
          customer_phone,
          shipping_cep,
          shipping_state,
          shipping_city,
          shipping_district,
          shipping_street,
          shipping_number,
          shipping_complement,
          coupon_code,
          subtotal,
          discount,
          shipping_amount,
          total,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          CURRENT_TIMESTAMP
        )
        `
      )
      .bind(
        orderCode,

        mercadoPago.orderId,

        mercadoPago.paymentId,

        mercadoPago.status,

        mercadoPago.statusDetail,

        mercadoPago.paymentMethod ||
        (
          paymentData.isPix
            ? "pix"
            : paymentData.paymentMethodId
        ),

        paymentData.isPix
          ? 1
          : paymentData.installments,

        String(
          customer.firstName ||
          ""
        ).trim(),

        String(
          customer.lastName ||
          ""
        ).trim(),

        String(
          customer.email ||
          ""
        ).trim(),

        String(
          customer.phone ||
          ""
        ).trim(),

        String(
          address.cep ||
          body.shipping?.cep ||
          ""
        ).trim(),

        String(
          address.state ||
          body.shipping?.state ||
          ""
        ).trim(),

        String(
          address.city ||
          body.shipping?.city ||
          ""
        ).trim(),

        String(
          address.district ||
          ""
        ).trim(),

        String(
          address.street ||
          ""
        ).trim(),

        String(
          address.number ||
          ""
        ).trim(),

        String(
          address.complement ||
          ""
        ).trim(),

        order.coupon,

        order.subtotal,

        order.discount,

        order.shipping,

        order.total
      )
      .run();


  const orderId =
    Number(
      insertOrder?.meta
        ?.last_row_id
    );


  if (
    !orderId ||
    !Number.isFinite(orderId)
  ) {
    throw new Error(
      "Não foi possível salvar o pedido no banco."
    );
  }


  const statements =
    order.items.map(
      item =>
        DB
          .prepare(
            `
            INSERT INTO order_items (
              order_id,
              product_name,
              fragrance,
              size,
              quantity,
              unit_price,
              total_price
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `
          )
          .bind(
            orderId,

            item.product,

            item.fragrance,

            item.size,

            item.quantity,

            item.unitPrice,

            item.totalPrice
          )
    );


  if (
    statements.length
  ) {
    await DB.batch(
      statements
    );
  }


  return {
    id:
      orderId,

    orderCode
  };
}


/* =========================================================
   ERROS
========================================================= */

function sanitizeMercadoPagoError(
  data
) {
  return {
    message:
      data?.message ||
      null,

    error:
      data?.error ||
      null,

    status:
      data?.status ||
      null,

    cause:
      Array.isArray(
        data?.cause
      )
        ? data.cause.map(
            item => ({
              code:
                item?.code ||
                null,

              description:
                item?.description ||
                null
            })
          )
        : []
  };
}


/* =========================================================
   HELPERS
========================================================= */

function normalizeText(value) {
  return String(
    value ||
    ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toUpperCase();
}


function onlyNumbers(value) {
  return String(
    value ||
    ""
  ).replace(
    /\D/g,
    ""
  );
}


function roundMoney(value) {
  return Math.round(
    (
      Number(value) +
      Number.EPSILON
    ) *
    100
  ) / 100;
}


function formatAmount(value) {
  return roundMoney(
    value
  ).toFixed(2);
}


function createExternalReference() {
  return (
    "OJOBOSCO-" +
    Date.now() +
    "-" +
    crypto.randomUUID()
  );
}


function json(
  data,
  status,
  corsHeaders
) {
  return new Response(
    JSON.stringify(
      data
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",

        ...corsHeaders
      }
    }
  );
}
