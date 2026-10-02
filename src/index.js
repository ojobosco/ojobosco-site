export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
     * =====================================================
     * CORS
     * =====================================================
     */

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


    /*
     * =====================================================
     * GET /api/config
     * =====================================================
     */

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


    /*
     * =====================================================
     * POST /api/process-payment
     * =====================================================
     */

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


        /*
         * IMPORTANTE:
         *
         * Recalculamos os valores no backend.
         * Não confiamos no total enviado pelo navegador.
         */

        const serverOrder =
          calculateServerOrder(body);


        if (!serverOrder.ok) {
          return json(
            {
              error:
                serverOrder.message
            },
            400,
            corsHeaders
          );
        }


        const selectedPaymentMethod =
          body.selectedPaymentMethod;


        const formData =
          body.formData || {};


        let mercadoPagoPayload;


        if (
          selectedPaymentMethod === "bank_transfer" ||
          formData.payment_method_id === "pix"
        ) {
          mercadoPagoPayload =
            buildPixOrder(
              body,
              serverOrder
            );
        } else {
          mercadoPagoPayload =
            buildCardOrder(
              body,
              serverOrder
            );
        }


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

                "X-Idempotency-Key":
                  idempotencyKey
              },

              body:
                JSON.stringify(
                  mercadoPagoPayload
                )
            }
          );


        const mpData =
          await mpResponse.json();


        if (!mpResponse.ok) {
          console.error(
            "Mercado Pago error:",
            mpData
          );

          return json(
            {
              error:
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


        return json(
          normalizeMercadoPagoResponse(
            mpData
          ),
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
              "Erro interno ao processar o pagamento."
          },
          500,
          corsHeaders
        );
      }
    }


    /*
     * =====================================================
     * SITE ESTÁTICO
     * =====================================================
     */

    return env.ASSETS.fetch(request);
  }
};


/*
 * =========================================================
 * CATÁLOGO OFICIAL
 * =========================================================
 *
 * O frontend envia só produto,
 * fragrância, tamanho e quantidade.
 *
 * O preço é definido aqui.
 */

const PRODUCT_CATALOG = {
  "AROMATIZADOR|100": 179,
  "AROMATIZADOR|250": 209,

  "DIFUSOR|100": 189,
  "DIFUSOR|250": 219,

  "BIBLIOTECA OLFATIVA|5": 239,
  "BIBLIOTECA|5": 239,

  "VELA|200": 289,

  "PERFUME|100": 429,
  "CEDRO SOLAR|100": 429
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


/*
 * =========================================================
 * VALIDAÇÃO
 * =========================================================
 */

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
    !body.customer.email
  ) {
    return {
      ok: false,
      message:
        "Dados do cliente incompletos."
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


/*
 * =========================================================
 * CALCULAR PEDIDO NO SERVIDOR
 * =========================================================
 */

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
      !quantity ||
      quantity < 1 ||
      !Number.isInteger(quantity)
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


    if (!unitPrice) {
      return {
        ok: false,
        message:
          `Produto não reconhecido: ${item.product} ${item.size}`
      };
    }


    subtotal +=
      unitPrice *
      quantity;


    normalizedItems.push({
      product:
        item.product,

      fragrance:
        item.fragrance || "",

      size:
        item.size || "",

      quantity,

      unitPrice
    });
  }


  const couponCode =
    normalizeText(
      body.coupon || ""
    );


  const couponRate =
    VALID_COUPONS[
      couponCode
    ] || 0;


  const discount =
    subtotal *
    couponRate;


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
   * REGRA:
   *
   * COM CUPOM:
   * desconto + frete normal.
   *
   * SEM CUPOM:
   * acima de R$500 = frete grátis.
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

    subtotal:
      roundMoney(
        subtotal
      ),

    discount:
      roundMoney(
        discount
      ),

    shipping:
      roundMoney(
        shipping
      ),

    total,

    coupon:
      couponRate > 0
        ? couponCode
        : null
  };
}


/*
 * =========================================================
 * ORDER PIX
 * =========================================================
 */

function buildPixOrder(
  body,
  order
) {
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
      createExternalReference(),

    payer: {
      email:
        body.customer.email,

      first_name:
        body.customer.firstName || "",

      last_name:
        body.customer.lastName || ""
    },

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


/*
 * =========================================================
 * ORDER CARTÃO
 * =========================================================
 */

function buildCardOrder(
  body,
  order
) {
  const form =
    body.formData || {};


  const token =
    form.token;


  const paymentMethodId =
    form.payment_method_id;


  const installments =
    Number(
      form.installments ||
      1
    );


  if (!token) {
    throw new Error(
      "Token do cartão não recebido."
    );
  }


  if (!paymentMethodId) {
    throw new Error(
      "Método de pagamento não recebido."
    );
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
      createExternalReference(),

    payer: {
      email:
        body.customer.email,

      first_name:
        body.customer.firstName || "",

      last_name:
        body.customer.lastName || ""
    },

    transactions: {
      payments: [
        {
          amount:
            formatAmount(
              order.total
            ),

          payment_method: {
            id:
              paymentMethodId,

            type:
              "credit_card",

            token
          },

          installments:
            installments
        }
      ]
    }
  };
}


/*
 * =========================================================
 * RESPOSTA DO MERCADO PAGO
 * =========================================================
 */

function normalizeMercadoPagoResponse(
  data
) {
  const payment =
    data?.transactions
      ?.payments?.[0] ||
    data?.payments?.[0] ||
    {};


  return {
    orderId:
      data.id || null,

    paymentId:
      payment.id || null,

    status:
      payment.status ||
      data.status ||
      "pending",

    statusDetail:
      payment.status_detail ||
      data.status_detail ||
      "",

    qrCode:
      payment.payment_method
        ?.qr_code ||
      payment.qr_code ||
      null,

    qrCodeBase64:
      payment.payment_method
        ?.qr_code_base64 ||
      payment.qr_code_base64 ||
      null,

    ticketUrl:
      payment.payment_method
        ?.ticket_url ||
      payment.ticket_url ||
      null
  };
}


/*
 * =========================================================
 * SEGURANÇA DE ERROS
 * =========================================================
 */

function sanitizeMercadoPagoError(
  data
) {
  return {
    message:
      data?.message || null,

    code:
      data?.error || null,

    status:
      data?.status || null
  };
}


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeText(value) {
  return String(
    value || ""
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
    value || ""
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

        ...corsHeaders
      }
    }
  );
}
