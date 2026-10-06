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
       CONFIGURAÇÃO PÚBLICA
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
              "Banco D1 não conectado."
          },
          500,
          corsHeaders
        );
      }

      try {
        const body =
          await request.json();

        const validation =
          validateCheckoutRequest(body);

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

        /*
         * Recalculamos tudo no servidor.
         * Não confiamos nos preços enviados pelo navegador.
         */

        const calculatedOrder =
          calculateServerOrder(body);

        if (!calculatedOrder.ok) {
          return json(
            {
              error:
                calculatedOrder.message
            },
            400,
            corsHeaders
          );
        }

        const payment =
          normalizePaymentData(body);

        const paymentValidation =
          validatePaymentData(
            payment,
            calculatedOrder.total
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

        const orderCode =
          createOrderCode();

        const mpPayload =
          buildMercadoPagoOrder({
            body,
            calculatedOrder,
            payment,
            orderCode
          });

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
                  mpPayload
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
            "Mercado Pago create order error:",
            JSON.stringify(mpData)
          );

          return json(
            {
              error:
                mpData?.message ||
                "O Mercado Pago não conseguiu criar o pagamento.",

              details:
                sanitizeMercadoPagoError(
                  mpData
                )
            },
            mpResponse.status,
            corsHeaders
          );
        }

        /*
         * Normaliza a resposta imediatamente recebida.
         */

        let normalizedMP =
          normalizeMercadoPagoResponse(
            mpData
          );

        /*
         * Em Pix, se o primeiro retorno não trouxer o QR,
         * consultamos a order novamente.
         */

        if (
          payment.isPix &&
          mpData?.id &&
          (
            !normalizedMP.qrCode ||
            !normalizedMP.qrCodeBase64
          )
        ) {
          const refreshed =
            await getMercadoPagoOrder(
              env.MERCADO_PAGO_ACCESS_TOKEN,
              mpData.id
            );

          if (refreshed) {
            const refreshedNormalized =
              normalizeMercadoPagoResponse(
                refreshed
              );

            normalizedMP = {
              ...normalizedMP,
              ...refreshedNormalized,

              qrCode:
                refreshedNormalized.qrCode ||
                normalizedMP.qrCode,

              qrCodeBase64:
                refreshedNormalized.qrCodeBase64 ||
                normalizedMP.qrCodeBase64,

              ticketUrl:
                refreshedNormalized.ticketUrl ||
                normalizedMP.ticketUrl
            };
          }
        }

        /*
         * Salva pedido e itens no D1.
         */

        const savedOrder =
          await saveOrderToDatabase(
            env.DB,
            {
              orderCode,
              body,
              calculatedOrder,
              payment,
              mercadoPago:
                normalizedMP
            }
          );

        return json(
          {
            success: true,

            internalOrderId:
              savedOrder.id,

            orderCode,

            orderId:
              normalizedMP.orderId,

            paymentId:
              normalizedMP.paymentId,

            status:
              normalizedMP.status,

            statusDetail:
              normalizedMP.statusDetail,

            paymentMethod:
              normalizedMP.paymentMethod ||
              (
                payment.isPix
                  ? "pix"
                  : payment.paymentMethodId
              ),

            paymentMethodType:
              normalizedMP.paymentMethodType,

            installments:
              payment.isPix
                ? 1
                : payment.installments,

            qrCode:
              normalizedMP.qrCode,

            qrCodeBase64:
              normalizedMP.qrCodeBase64,

            ticketUrl:
              normalizedMP.ticketUrl
          },
          200,
          corsHeaders
        );

      } catch (error) {
        console.error(
          "Process payment error:",
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
   CATÁLOGO OJOBOSCO
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


/* =========================================================
   CUPONS
========================================================= */

const VALID_COUPONS = {
  BEMVINDO: 0.10,
  CAMILAGUS: 0.10
};


/* =========================================================
   FRETE
========================================================= */

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
    Number(
      total ||
      0
    );

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 1;
  }

  /*
   * REGRA JÁ DEFINIDA:
   *
   * até 300 = 2x
   * até 400 = 3x
   * até 500 = 4x
   * depois +1 parcela a cada R$100
   * máximo 12x
   */

  if (value <= 300) {
    return 2;
  }

  if (value <= 400) {
    return 3;
  }

  if (value <= 500) {
    return 4;
  }

  const additional =
    Math.floor(
      (
        value -
        500
      ) / 100
    );

  return Math.min(
    12,
    4 +
    additional
  );
}


/* =========================================================
   VALIDAÇÃO DO CHECKOUT
========================================================= */

function validateCheckoutRequest(body) {
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
        "E-mail do comprador não informado."
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
   CÁLCULO DO PEDIDO NO SERVIDOR
========================================================= */

function calculateServerOrder(body) {
  let subtotal = 0;

  const items = [];

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
          `Produto não reconhecido: ${item.product || ""} ${item.size || ""}`.trim()
      };
    }

    const totalPrice =
      roundMoney(
        unitPrice *
        quantity
      );

    subtotal +=
      totalPrice;

    items.push({
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

      totalPrice
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

  let shipping;

  /*
   * Cupom e frete grátis não acumulam.
   */

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

    items,

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
   NORMALIZAÇÃO PAYMENT BRICK
========================================================= */

function normalizePaymentData(body) {
  const form =
    body.formData ||
    {};

  const selectedPaymentMethod =
    String(
      body.selectedPaymentMethod ||
      ""
    )
      .trim()
      .toLowerCase();

  const paymentMethodId =
    String(
      form.payment_method_id ||
      form.paymentMethodId ||
      ""
    )
      .trim()
      .toLowerCase();

  const paymentMethodType =
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
    selectedPaymentMethod === "pix" ||
    selectedPaymentMethod === "bank_transfer" ||
    paymentMethodType === "bank_transfer";

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
            paymentMethodType ||
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


/* =========================================================
   VALIDAÇÃO DA FORMA DE PAGAMENTO
========================================================= */

function validatePaymentData(
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
        "Método do cartão não recebido."
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
        `Máximo de ${maxInstallments} parcelas para este pedido.`
    };
  }

  return {
    ok: true
  };
}


/* =========================================================
   CRIAR PAYLOAD MERCADO PAGO
========================================================= */

function buildMercadoPagoOrder({
  body,
  calculatedOrder,
  payment,
  orderCode
}) {
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

  /*
   * PIX
   */

  if (payment.isPix) {
    return {
      type:
        "online",

      processing_mode:
        "automatic",

      total_amount:
        formatAmount(
          calculatedOrder.total
        ),

      external_reference:
        orderCode,

      payer,

      transactions: {
        payments: [
          {
            amount:
              formatAmount(
                calculatedOrder.total
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

  /*
   * CARTÃO
   */

  return {
    type:
      "online",

    processing_mode:
      "automatic",

    total_amount:
      formatAmount(
        calculatedOrder.total
      ),

    external_reference:
      orderCode,

    payer,

    transactions: {
      payments: [
        {
          amount:
            formatAmount(
              calculatedOrder.total
            ),

          payment_method: {
            id:
              payment.paymentMethodId,

            type:
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
   CONSULTAR ORDER MERCADO PAGO
========================================================= */

async function getMercadoPagoOrder(
  accessToken,
  orderId
) {
  try {
    /*
     * Pequeno intervalo para permitir que os dados Pix
     * sejam disponibilizados pela API.
     */

    await sleep(350);

    const response =
      await fetch(
        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
        {
          method: "GET",

          headers: {
            "Authorization":
              `Bearer ${accessToken}`,

            "Accept":
              "application/json"
          }
        }
      );

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error(
      "Get Mercado Pago order error:",
      error
    );

    return null;
  }
}


/* =========================================================
   NORMALIZAR RESPOSTA MERCADO PAGO
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
    payment?.payment_method ||
    {};

  /*
   * Orders API Pix:
   *
   * payment_method.ticket_url
   * payment_method.qr_code
   * payment_method.qr_code_base64
   */

  const qrCode =
    paymentMethod?.qr_code ||
    payment?.qr_code ||
    "";

  const qrCodeBase64 =
    paymentMethod?.qr_code_base64 ||
    payment?.qr_code_base64 ||
    "";

  const ticketUrl =
    paymentMethod?.ticket_url ||
    payment?.ticket_url ||
    "";

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

    qrCode,

    qrCodeBase64,

    ticketUrl
  };
}


/* =========================================================
   SALVAR PEDIDO NO D1
========================================================= */

async function saveOrderToDatabase(
  DB,
  {
    orderCode,
    body,
    calculatedOrder,
    payment,
    mercadoPago
  }
) {
  const customer =
    body.customer ||
    {};

  const address =
    customer.address ||
    {};

  const insert =
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
          payment.isPix
            ? "pix"
            : payment.paymentMethodId
        ),

        payment.isPix
          ? 1
          : payment.installments,

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

        calculatedOrder.coupon,

        calculatedOrder.subtotal,

        calculatedOrder.discount,

        calculatedOrder.shipping,

        calculatedOrder.total
      )
      .run();

  const orderId =
    Number(
      insert?.meta
        ?.last_row_id
    );

  if (
    !orderId ||
    !Number.isFinite(orderId)
  ) {
    throw new Error(
      "Não foi possível registrar o pedido no inventário."
    );
  }

  const itemStatements =
    calculatedOrder.items.map(
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
    itemStatements.length > 0
  ) {
    await DB.batch(
      itemStatements
    );
  }

  return {
    id:
      orderId,

    orderCode
  };
}


/* =========================================================
   ERRO MERCADO PAGO
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
   UTILITÁRIOS
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


function createOrderCode() {
  return (
    "OJOBOSCO-" +
    Date.now() +
    "-" +
    crypto.randomUUID()
  );
}


function sleep(milliseconds) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
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
