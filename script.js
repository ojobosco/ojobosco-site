/* =========================================
   ELEMENTOS GERAIS
========================================= */

const menuToggle =
  document.getElementById(
    "menuToggle"
  );

const closeMenu =
  document.getElementById(
    "closeMenu"
  );

const sideMenu =
  document.getElementById(
    "sideMenu"
  );

const newsletterForm =
  document.getElementById(
    "newsletterForm"
  );

const newsletterEmail =
  document.getElementById(
    "newsletterEmail"
  );

const newsletterSuccess =
  document.getElementById(
    "newsletterSuccess"
  );

const cartCount =
  document.getElementById(
    "cartCount"
  );


/* =========================================
   MENU
========================================= */

if (
  menuToggle &&
  sideMenu
) {

  menuToggle.addEventListener(
    "click",
    () => {

      sideMenu
        .classList
        .add(
          "open"
        );

      document
        .body
        .style
        .overflow = "hidden";

    }
  );

}


if (
  closeMenu &&
  sideMenu
) {

  closeMenu.addEventListener(
    "click",
    () => {

      sideMenu
        .classList
        .remove(
          "open"
        );

      document
        .body
        .style
        .overflow = "";

    }
  );

}


document
  .querySelectorAll(
    ".side-menu a"
  )
  .forEach(
    (link) => {

      link.addEventListener(
        "click",
        () => {

          if (!sideMenu) {
            return;
          }


          sideMenu
            .classList
            .remove(
              "open"
            );


          document
            .body
            .style
            .overflow = "";

        }
      );

    }
  );


/* =========================================
   NEWSLETTER
========================================= */

if (
  newsletterForm &&
  newsletterEmail &&
  newsletterSuccess
) {

  newsletterForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const email =
        newsletterEmail
          .value
          .trim()
          .toLowerCase();


      if (!email) {
        return;
      }


      localStorage.setItem(
        "ojobosco-newsletter-email",
        email
      );


      newsletterForm
        .style
        .display = "none";


      newsletterSuccess
        .classList
        .add(
          "visible"
        );

    }
  );

}


/* =========================================
   CARRINHO
========================================= */

function getCart() {

  try {

    const saved =
      localStorage.getItem(
        "ojobosco-cart"
      );


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(
        saved
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {

      return [];

    }


    return parsed;

  } catch (error) {

    return [];

  }

}


function saveCart(
  cart
) {

  localStorage.setItem(
    "ojobosco-cart",
    JSON.stringify(
      cart
    )
  );


  updateCartCount();

  renderCart();

}


/* =========================================
   CUPOM
   SOMENTE UM CUPOM POR VEZ
========================================= */

function getActiveCoupon() {

  try {

    const saved =
      localStorage.getItem(
        "ojobosco-coupon"
      );


    if (!saved) {
      return null;
    }


    const parsed =
      JSON.parse(
        saved
      );


    if (
      !parsed ||
      !parsed.code
    ) {

      return null;

    }


    return parsed;

  } catch (error) {

    return null;

  }

}


function saveActiveCoupon(
  coupon
) {

  if (!coupon) {

    localStorage.removeItem(
      "ojobosco-coupon"
    );

  } else {

    localStorage.setItem(
      "ojobosco-coupon",
      JSON.stringify(
        coupon
      )
    );

  }


  renderCart();

}


/* =========================================
   FORMATAÇÃO
========================================= */

function formatCurrency(
  value
) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(
    Number(
      value
    ) || 0
  );

}


function escapeHtml(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================
   CHAVE DOS ITENS
========================================= */

function createCartKey(
  product,
  fragrance,
  size
) {

  return [
    product || "",
    fragrance || "",
    size || ""
  ]
    .join(
      "|"
    )
    .toLowerCase();

}


/* =========================================
   ADICIONAR ITEM AO CARRINHO
========================================= */

function addItemToCart(
  {
    product,
    fragrance = "",
    size = "",
    price,
    image = ""
  }
) {

  const cart =
    getCart();


  const key =
    createCartKey(
      product,
      fragrance,
      size
    );


  const existing =
    cart.find(
      (item) =>
        item.key === key
    );


  if (existing) {

    existing.quantity =
      Number(
        existing.quantity
      ) + 1;

  } else {

    cart.push(
      {
        key:
          key,

        product:
          product,

        fragrance:
          fragrance,

        size:
          size,

        price:
          Number(
            price
          ),

        image:
          image,

        quantity:
          1
      }
    );

  }


  saveCart(
    cart
  );

}


/* =========================================
   CONTADOR DO CARRINHO
========================================= */

function updateCartCount() {

  const counters =
    document.querySelectorAll(
      "#cartCount"
    );


  if (
    counters.length === 0
  ) {

    return;

  }


  const cart =
    getCart();


  const quantity =
    cart.reduce(
      (
        total,
        item
      ) => {

        return (
          total +
          (
            Number(
              item.quantity
            ) || 0
          )
        );

      },
      0
    );


  counters.forEach(
    (counter) => {

      counter.textContent =
        String(
          quantity
        );

    }
  );

}


/* =========================================
   CRIAR CARRINHO LATERAL
========================================= */

function createCartDrawer() {

  const existingDrawer =
    document.getElementById(
      "ojbCartDrawer"
    );


  if (existingDrawer) {
    return;
  }


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.id =
    "ojbCartRoot";


  wrapper.innerHTML = `

    <div
      class="carrinho-overlay"
      id="ojbCartOverlay"
      aria-hidden="true"
    ></div>


    <aside
      class="carrinho-drawer"
      id="ojbCartDrawer"
      aria-label="Carrinho de compras"
      aria-hidden="true"
    >

      <div class="carrinho-header">

        <h2>
          CARRINHO
        </h2>


        <button
          class="carrinho-fechar"
          id="ojbCartClose"
          type="button"
          aria-label="Fechar carrinho"
        >
          FECHAR
        </button>

      </div>


      <div
        class="carrinho-conteudo"
        id="ojbCartContent"
      ></div>

    </aside>
  `;


  document
    .body
    .appendChild(
      wrapper
    );


  const overlay =
    document.getElementById(
      "ojbCartOverlay"
    );


  const close =
    document.getElementById(
      "ojbCartClose"
    );


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeCart
    );

  }


  if (close) {

    close.addEventListener(
      "click",
      closeCart
    );

  }


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {

        closeCart();

      }

    }
  );

}


/* =========================================
   ABRIR CARRINHO
========================================= */

function openCart() {

  let drawer =
    document.getElementById(
      "ojbCartDrawer"
    );


  let overlay =
    document.getElementById(
      "ojbCartOverlay"
    );


  /*
    SEGURANÇA:

    Se por algum motivo o carrinho ainda
    não tiver sido criado, ele é criado
    no momento do clique.
  */

  if (
    !drawer ||
    !overlay
  ) {

    createCartDrawer();


    drawer =
      document.getElementById(
        "ojbCartDrawer"
      );


    overlay =
      document.getElementById(
        "ojbCartOverlay"
      );

  }


  if (
    !drawer ||
    !overlay
  ) {

    return;

  }


  renderCart();


  drawer
    .classList
    .add(
      "open"
    );


  overlay
    .classList
    .add(
      "open"
    );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );


  overlay.setAttribute(
    "aria-hidden",
    "false"
  );


  document
    .body
    .classList
    .add(
      "cart-open"
    );

}


/* =========================================
   FECHAR CARRINHO
========================================= */

function closeCart() {

  const drawer =
    document.getElementById(
      "ojbCartDrawer"
    );


  const overlay =
    document.getElementById(
      "ojbCartOverlay"
    );


  if (drawer) {

    drawer
      .classList
      .remove(
        "open"
      );


    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  if (overlay) {

    overlay
      .classList
      .remove(
        "open"
      );


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  document
    .body
    .classList
    .remove(
      "cart-open"
    );

}


/* =========================================
   CONECTAR BOTÃO CARRINHO

   FUNCIONA COM:

   #cartButton
   .cart-link

========================================= */

function bindCartButtons() {

  const cartButtons =
    document.querySelectorAll(
      "#cartButton, .cart-link"
    );


  cartButtons.forEach(
    (button) => {

      if (
        button.dataset.cartBound ===
        "true"
      ) {

        return;

      }


      button.dataset.cartBound =
        "true";


      button.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          event.stopPropagation();

          openCart();

        }
      );

    }
  );

}


/* =========================================
   SUBTOTAL
========================================= */

function calculateSubtotal(
  cart
) {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        (
          Number(
            item.price
          ) *
          Number(
            item.quantity
          )
        )
      );

    },
    0
  );

}


/* =========================================
   DESCONTO

   BEMVINDO = 10%
   CAMILAGUS = 10%

   SOMENTE UM CUPOM POR VEZ
========================================= */

function calculateDiscount(
  subtotal
) {

  const coupon =
    getActiveCoupon();


  if (!coupon) {
    return 0;
  }


  const validCoupons = [
    "BEMVINDO",
    "CAMILAGUS"
  ];


  if (
    validCoupons.includes(
      coupon.code
    )
  ) {

    return (
      subtotal *
      0.10
    );

  }


  return 0;

}


/* =========================================
   TEXTO DO CUPOM
========================================= */

function getCouponMessage(
  coupon
) {

  if (!coupon) {
    return "";
  }


  if (
    coupon.code ===
    "BEMVINDO"
  ) {

    return (
      "BEMVINDO · 10% DE DESCONTO APLICADO"
    );

  }


  if (
    coupon.code ===
    "CAMILAGUS"
  ) {

    return (
      "CAMILAGUS · 10% DE DESCONTO APLICADO"
    );

  }


  return "";

}


/* =========================================
   RENDERIZAR CARRINHO
========================================= */

function renderCart() {

  const content =
    document.getElementById(
      "ojbCartContent"
    );


  if (!content) {
    return;
  }


  const cart =
    getCart();


  if (
    cart.length === 0
  ) {

    content.innerHTML = `

      <div class="carrinho-vazio">

        <p>
          SEU CARRINHO ESTÁ VAZIO.
        </p>


        <button
          class="carrinho-continuar"
          id="ojbContinueShopping"
          type="button"
        >
          CONTINUAR COMPRANDO
        </button>

      </div>
    `;


    const continueButton =
      document.getElementById(
        "ojbContinueShopping"
      );


    if (continueButton) {

      continueButton.addEventListener(
        "click",
        closeCart
      );

    }


    return;

  }


  const subtotal =
    calculateSubtotal(
      cart
    );


  const discount =
    calculateDiscount(
      subtotal
    );


  const total =
    Math.max(
      0,
      subtotal -
      discount
    );


  /*
    FRETE GRÁTIS

    A regra considera o valor original
    dos produtos antes do cupom.
  */

  const freeShipping =
    subtotal >= 500;


  const coupon =
    getActiveCoupon();


  const itemsHtml =
    cart
      .map(
        (
          item,
          index
        ) => {

          const imageHtml =
            item.image
              ? `

                <div class="carrinho-item-imagem">

                  <img
                    src="${escapeHtml(
                      item.image
                    )}"
                    alt="${escapeHtml(
                      item.product
                    )}"
                  >

                </div>

              `
              : `

                <div
                  class="
                    carrinho-item-imagem
                    carrinho-item-imagem-vazia
                  "
                ></div>

              `;


          return `

            <article class="carrinho-item">

              ${imageHtml}


              <div class="carrinho-item-info">


                <div class="carrinho-item-topo">

                  <div>

                    <h3>
                      ${escapeHtml(
                        item.product
                      )}
                    </h3>


                    ${
                      item.fragrance
                        ? `

                          <p>
                            ${escapeHtml(
                              item.fragrance
                            )}
                          </p>

                        `
                        : ""
                    }


                    ${
                      item.size
                        ? `

                          <p>
                            ${escapeHtml(
                              item.size
                            )}
                          </p>

                        `
                        : ""
                    }

                  </div>


                  <button
                    type="button"
                    class="carrinho-remover"
                    data-cart-remove="${index}"
                  >
                    REMOVER
                  </button>

                </div>


                <div class="carrinho-item-baixo">


                  <div class="carrinho-quantidade">

                    <button
                      type="button"
                      data-cart-minus="${index}"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>


                    <span>
                      ${Number(
                        item.quantity
                      )}
                    </span>


                    <button
                      type="button"
                      data-cart-plus="${index}"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>

                  </div>


                  <p class="carrinho-item-preco">

                    ${formatCurrency(
                      Number(
                        item.price
                      ) *
                      Number(
                        item.quantity
                      )
                    )}

                  </p>

                </div>

              </div>

            </article>
          `;

        }
      )
      .join(
        ""
      );


  content.innerHTML = `

    <div class="carrinho-itens">

      ${itemsHtml}

    </div>


    <!-- =====================================
         CUPOM
    ====================================== -->

    <div class="carrinho-cupom">

      <p class="carrinho-label">
        CUPOM
      </p>


      <div class="carrinho-cupom-linha">

        <input
          type="text"
          id="ojbCouponInput"
          placeholder="DIGITE SEU CUPOM"
          autocomplete="off"
          value="${
            coupon
              ? escapeHtml(
                  coupon.code
                )
              : ""
          }"
        >


        <button
          type="button"
          id="ojbApplyCoupon"
        >
          APLICAR
        </button>

      </div>


      <p
        class="carrinho-cupom-mensagem"
        id="ojbCouponMessage"
      >
        ${getCouponMessage(
          coupon
        )}
      </p>


      ${
        coupon
          ? `

            <button
              type="button"
              class="carrinho-remover-cupom"
              id="ojbRemoveCoupon"
            >
              REMOVER CUPOM
            </button>

          `
          : ""
      }

    </div>


    <!-- =====================================
         FRETE
    ====================================== -->

    <div class="carrinho-frete">

      <div class="carrinho-linha">

        <span>
          FRETE
        </span>

        <span>

          ${
            freeShipping
              ? "GRÁTIS"
              : "CALCULADO NO CHECKOUT"
          }

        </span>

      </div>


      ${
        freeShipping
          ? `

            <p class="carrinho-frete-gratis">
              FRETE GRÁTIS APLICADO
            </p>

          `
          : `

            <p class="carrinho-frete-aviso">
              FRETE GRÁTIS EM COMPRAS A PARTIR DE R$500
            </p>

          `
      }

    </div>


    <!-- =====================================
         RESUMO
    ====================================== -->

    <div class="carrinho-resumo">


      <div class="carrinho-linha">

        <span>
          SUBTOTAL
        </span>

        <span>
          ${formatCurrency(
            subtotal
          )}
        </span>

      </div>


      ${
        discount > 0
          ? `

            <div class="carrinho-linha">

              <span>
                DESCONTO ${
                  coupon
                    ? escapeHtml(
                        coupon.code
                      )
                    : ""
                }
              </span>

              <span>
                − ${formatCurrency(
                  discount
                )}
              </span>

            </div>

          `
          : ""
      }


      <div
        class="
          carrinho-linha
          carrinho-total
        "
      >

        <span>
          TOTAL
        </span>

        <span>
          ${formatCurrency(
            total
          )}
        </span>

      </div>


      ${
        !freeShipping
          ? `

            <p class="carrinho-total-observacao">
              FRETE NÃO INCLUÍDO
            </p>

          `
          : ""
      }

    </div>


    <!-- =====================================
         CHECKOUT
    ====================================== -->

    <button
      type="button"
      class="carrinho-finalizar"
      id="ojbCheckoutButton"
    >
      FINALIZAR COMPRA
    </button>


    <button
      type="button"
      class="carrinho-continuar"
      id="ojbContinueShopping"
    >
      CONTINUAR COMPRANDO
    </button>
  `;


  bindCartEvents();

}


/* =========================================
   EVENTOS INTERNOS DO CARRINHO
========================================= */

function bindCartEvents() {


  /* =====================================
     AUMENTAR QUANTIDADE
  ====================================== */

  document
    .querySelectorAll(
      "[data-cart-plus]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.getAttribute(
                  "data-cart-plus"
                )
              );


            const cart =
              getCart();


            if (!cart[index]) {
              return;
            }


            cart[index].quantity =
              Number(
                cart[index].quantity
              ) + 1;


            saveCart(
              cart
            );

          }
        );

      }
    );


  /* =====================================
     DIMINUIR QUANTIDADE
  ====================================== */

  document
    .querySelectorAll(
      "[data-cart-minus]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.getAttribute(
                  "data-cart-minus"
                )
              );


            const cart =
              getCart();


            if (!cart[index]) {
              return;
            }


            const newQuantity =
              Number(
                cart[index].quantity
              ) - 1;


            if (
              newQuantity <= 0
            ) {

              cart.splice(
                index,
                1
              );

            } else {

              cart[index].quantity =
                newQuantity;

            }


            saveCart(
              cart
            );

          }
        );

      }
    );


  /* =====================================
     REMOVER ITEM
  ====================================== */

  document
    .querySelectorAll(
      "[data-cart-remove]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.getAttribute(
                  "data-cart-remove"
                )
              );


            const cart =
              getCart();


            if (!cart[index]) {
              return;
            }


            cart.splice(
              index,
              1
            );


            saveCart(
              cart
            );

          }
        );

      }
    );


  /* =====================================
     CUPOM
  ====================================== */

  const applyCoupon =
    document.getElementById(
      "ojbApplyCoupon"
    );


  const couponInput =
    document.getElementById(
      "ojbCouponInput"
    );


  const couponMessage =
    document.getElementById(
      "ojbCouponMessage"
    );


  function applyCouponCode() {

    if (!couponInput) {
      return;
    }


    const code =
      couponInput
        .value
        .trim()
        .toUpperCase();


    /*
      BEMVINDO = 10%
    */

    if (
      code ===
      "BEMVINDO"
    ) {

      saveActiveCoupon(
        {
          code:
            "BEMVINDO",

          type:
            "percentage",

          value:
            10
        }
      );


      return;

    }


    /*
      CAMILAGUS = 10%
    */

    if (
      code ===
      "CAMILAGUS"
    ) {

      saveActiveCoupon(
        {
          code:
            "CAMILAGUS",

          type:
            "percentage",

          value:
            10
        }
      );


      return;

    }


    /*
      CUPOM INVÁLIDO
    */

    localStorage.removeItem(
      "ojobosco-coupon"
    );


    if (couponMessage) {

      couponMessage.textContent =
        "CUPOM INVÁLIDO.";

    }

  }


  if (
    applyCoupon &&
    couponInput
  ) {

    applyCoupon.addEventListener(
      "click",
      applyCouponCode
    );


    couponInput.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          applyCouponCode();

        }

      }
    );

  }


  /* =====================================
     REMOVER CUPOM
  ====================================== */

  const removeCoupon =
    document.getElementById(
      "ojbRemoveCoupon"
    );


  if (removeCoupon) {

    removeCoupon.addEventListener(
      "click",
      () => {

        saveActiveCoupon(
          null
        );

      }
    );

  }


  /* =====================================
     CONTINUAR COMPRANDO
  ====================================== */

  const continueButton =
    document.getElementById(
      "ojbContinueShopping"
    );


  if (continueButton) {

    continueButton.addEventListener(
      "click",
      closeCart
    );

  }


  /* =====================================
     FINALIZAR COMPRA

     MERCADO PAGO SERÁ CONECTADO
     NA PRÓXIMA ETAPA
  ====================================== */

  const checkoutButton =
    document.getElementById(
      "ojbCheckoutButton"
    );


  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      () => {

        checkoutButton.textContent =
          "CONECTANDO AO PAGAMENTO";


        window.setTimeout(
          () => {

            checkoutButton.textContent =
              "FINALIZAR COMPRA";

          },
          1500
        );

      }
    );

  }

}


/* =========================================
   LOJA
   TAMANHO + FOTO + PREÇO
========================================= */

document
  .querySelectorAll(
    ".produto-loja-card"
  )
  .forEach(
    (card) => {

      const buttons =
        card.querySelectorAll(
          ".variacao-btn[data-size]"
        );


      const image =
        card.querySelector(
          ".produto-loja-image img"
        );


      const price =
        card.querySelector(
          ".produto-loja-preco"
        );


      buttons.forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const size =
                button.getAttribute(
                  "data-size"
                );


              if (!size) {
                return;
              }


              buttons.forEach(
                (item) => {

                  item
                    .classList
                    .remove(
                      "active"
                    );

                }
              );


              button
                .classList
                .add(
                  "active"
                );


              const newImage =
                card.getAttribute(
                  "data-image-" +
                  size
                );


              const newPrice =
                card.getAttribute(
                  "data-price-" +
                  size
                );


              if (
                image &&
                newImage
              ) {

                image.src =
                  newImage;

              }


              if (
                price &&
                newPrice
              ) {

                price.textContent =
                  formatCurrency(
                    Number(
                      newPrice
                    )
                  );

              }


              card.setAttribute(
                "data-current-size",
                size +
                " ML"
              );


              if (newPrice) {

                card.setAttribute(
                  "data-current-price",
                  newPrice
                );

              }

            }
          );

        }
      );

    }
  );


/* =========================================
   VELA NA LOJA
========================================= */

document
  .querySelectorAll(
    ".fragrancias-loja"
  )
  .forEach(
    (container) => {

      const buttons =
        container.querySelectorAll(
          ".fragrancia-loja-btn"
        );


      const card =
        container.closest(
          ".produto-loja-card"
        );


      buttons.forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              buttons.forEach(
                (item) => {

                  item
                    .classList
                    .remove(
                      "active"
                    );

                }
              );


              button
                .classList
                .add(
                  "active"
                );


              const fragrance =
                button.getAttribute(
                  "data-fragrance"
                ) ||
                button
                  .textContent
                  .trim();


              if (
                card &&
                fragrance
              ) {

                card.setAttribute(
                  "data-fragrance",
                  fragrance
                );

              }

            }
          );

        }
      );

    }
  );


/* =========================================
   ADICIONAR PRODUTO NA LOJA
========================================= */

document
  .querySelectorAll(
    ".adicionar-card-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const card =
            button.closest(
              ".produto-loja-card"
            );


          if (!card) {
            return;
          }


          const image =
            card.querySelector(
              ".produto-loja-image img"
            );


          const product =
            card.getAttribute(
              "data-product-type"
            ) || "";


          const fragrance =
            card.getAttribute(
              "data-fragrance"
            ) || "";


          const size =
            card.getAttribute(
              "data-current-size"
            ) || "";


          const price =
            card.getAttribute(
              "data-current-price"
            );


          if (
            !product ||
            !price
          ) {

            return;

          }


          addItemToCart(
            {
              product:
                product,

              fragrance:
                fragrance,

              size:
                size,

              price:
                Number(
                  price
                ),

              image:
                image
                  ? image.src
                  : ""
            }
          );


          button.textContent =
            "ADICIONADO";


          button
            .classList
            .add(
              "adicionado"
            );


          window.setTimeout(
            () => {

              button.textContent =
                "ADICIONAR AO CARRINHO";


              button
                .classList
                .remove(
                  "adicionado"
                );

            },
            1000
          );

        }
      );

    }
  );


/* =========================================
   AROMATIZADOR / DIFUSOR
   PÁGINAS INDIVIDUAIS
========================================= */

const detailPage =
  document.querySelector(
    "[data-detail-product]"
  );


if (detailPage) {

  const productType =
    detailPage.getAttribute(
      "data-detail-product"
    );


  const fragranceButtons =
    detailPage.querySelectorAll(
      ".produto-fragrancia-btn"
    );


  const sizeButtons =
    detailPage.querySelectorAll(
      ".produto-tamanho-btn"
    );


  const fragrancePanels =
    detailPage.querySelectorAll(
      ".fragrancia-detalhe"
    );


  const detailImage =
    document.getElementById(
      "productDetailImage"
    );


  const detailPrice =
    document.getElementById(
      "productDetailPrice"
    );


  const fragranceName =
    document.getElementById(
      "productFragranceName"
    );


  const detailAddButton =
    detailPage.querySelector(
      ".produto-adicionar"
    );


  const allowedFragrances = [
    "cha-floral",
    "figo-tirio",
    "lavanda-rosada",
    "limoeira",
    "verde-quente",
    "orbe-amazonico"
  ];


  let currentFragrance =
    "cha-floral";


  let currentSize =
    "100";


  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const requestedFragrance =
    urlParams.get(
      "fragrancia"
    );


  if (
    requestedFragrance &&
    allowedFragrances.includes(
      requestedFragrance
    )
  ) {

    currentFragrance =
      requestedFragrance;

  }


  function updateDetailProduct() {

    fragranceButtons.forEach(
      (button) => {

        const active =
          button.getAttribute(
            "data-fragrance"
          ) ===
          currentFragrance;


        button.classList.toggle(
          "active",
          active
        );


        if (
          active &&
          fragranceName
        ) {

          fragranceName.textContent =
            button.getAttribute(
              "data-name"
            ) ||
            button
              .textContent
              .trim();

        }

      }
    );


    sizeButtons.forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.getAttribute(
            "data-size"
          ) ===
          currentSize
        );

      }
    );


    fragrancePanels.forEach(
      (panel) => {

        panel.classList.toggle(
          "active",
          panel.getAttribute(
            "data-fragrance-panel"
          ) ===
          currentFragrance
        );

      }
    );


    if (
      detailImage &&
      productType
    ) {

      detailImage.src =
        productType +
        "-" +
        currentFragrance +
        "-" +
        currentSize +
        ".jpg";

    }


    if (detailPrice) {

      const selectedPrice =
        detailPage.getAttribute(
          "data-price-" +
          currentSize
        );


      if (selectedPrice) {

        detailPrice.textContent =
          formatCurrency(
            Number(
              selectedPrice
            )
          );

      }

    }

  }


  fragranceButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentFragrance =
            button.getAttribute(
              "data-fragrance"
            );


          updateDetailProduct();

        }
      );

    }
  );


  sizeButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentSize =
            button.getAttribute(
              "data-size"
            );


          updateDetailProduct();

        }
      );

    }
  );


  if (detailAddButton) {

    detailAddButton.addEventListener(
      "click",
      () => {

        const selectedPrice =
          detailPage.getAttribute(
            "data-price-" +
            currentSize
          );


        const selectedFragranceButton =
          Array
            .from(
              fragranceButtons
            )
            .find(
              (button) =>

                button.getAttribute(
                  "data-fragrance"
                ) ===
                currentFragrance

            );


        const fragranceDisplay =
          selectedFragranceButton
            ? (
                selectedFragranceButton.getAttribute(
                  "data-name"
                ) ||
                selectedFragranceButton
                  .textContent
                  .trim()
              )
            : currentFragrance;


        addItemToCart(
          {
            product:
              String(
                productType
              )
                .toUpperCase(),

            fragrance:
              fragranceDisplay,

            size:
              currentSize +
              " ML",

            price:
              Number(
                selectedPrice
              ),

            image:
              detailImage
                ? detailImage.src
                : ""
          }
        );


        detailAddButton.textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            detailAddButton.textContent =
              "ADICIONAR AO CARRINHO";

          },
          1000
        );

      }
    );

  }


  updateDetailProduct();

}


/* =========================================
   VELA
   PÁGINA INDIVIDUAL
========================================= */

if (
  window
    .location
    .pathname
    .includes(
      "produto-vela"
    )
) {

  const buttons =
    document.querySelectorAll(
      ".produto-fragrancia-btn"
    );


  const panels =
    document.querySelectorAll(
      ".fragrancia-detalhe"
    );


  const addButton =
    document.querySelector(
      ".produto-adicionar"
    );


  const image =
    document.querySelector(
      ".produto-detalhe-foto img"
    );


  let selectedFragrance =
    "CHÁ FLORAL";


  const initialActive =
    document.querySelector(
      ".produto-fragrancia-btn.active"
    );


  if (initialActive) {

    selectedFragrance =
      initialActive.getAttribute(
        "data-name"
      ) ||
      initialActive
        .textContent
        .trim();

  }


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            (item) => {

              item
                .classList
                .remove(
                  "active"
                );

            }
          );


          button
            .classList
            .add(
              "active"
            );


          selectedFragrance =
            button.getAttribute(
              "data-name"
            ) ||
            button
              .textContent
              .trim();


          const fragranceSlug =
            button.getAttribute(
              "data-fragrance"
            );


          panels.forEach(
            (panel) => {

              panel.classList.toggle(
                "active",
                panel.getAttribute(
                  "data-fragrance-panel"
                ) ===
                fragranceSlug
              );

            }
          );

        }
      );

    }
  );


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        addItemToCart(
          {
            product:
              "VELA",

            fragrance:
              selectedFragrance,

            size:
              "200 G",

            price:
              289,

            image:
              image
                ? image.src
                : ""
          }
        );


        addButton.textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            addButton.textContent =
              "ADICIONAR AO CARRINHO";

          },
          1000
        );

      }
    );

  }

}


/* =========================================
   BIBLIOTECA OLFATIVA
========================================= */

if (
  window
    .location
    .pathname
    .includes(
      "produto-biblioteca"
    )
) {

  const button =
    document.querySelector(
      ".produto-adicionar"
    );


  const image =
    document.querySelector(
      ".produto-detalhe-foto img"
    );


  if (button) {

    button.addEventListener(
      "click",
      () => {

        addItemToCart(
          {
            product:
              "BIBLIOTECA OLFATIVA",

            fragrance:
              "",

            size:
              "6 × 5 ML",

            price:
              239,

            image:
              image
                ? image.src
                : ""
          }
        );


        button.textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            button.textContent =
              "ADICIONAR AO CARRINHO";

          },
          1000
        );

      }
    );

  }

}


/* =========================================
   PERFUME
   CEDRO SOLAR
========================================= */

if (
  window
    .location
    .pathname
    .includes(
      "produto-perfume"
    )
) {

  const button =
    document.querySelector(
      ".produto-adicionar"
    );


  const image =
    document.querySelector(
      ".produto-detalhe-foto img"
    );


  if (button) {

    button.addEventListener(
      "click",
      () => {

        addItemToCart(
          {
            product:
              "PERFUME",

            fragrance:
              "CEDRO SOLAR",

            size:
              "100 ML",

            price:
              429,

            image:
              image
                ? image.src
                : ""
          }
        );


        button.textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            button.textContent =
              "ADICIONAR AO CARRINHO";

          },
          1000
        );

      }
    );

  }

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

/*
  1. CRIA O CARRINHO
*/

createCartDrawer();


/*
  2. CONECTA TODOS OS BOTÕES
     "CARRINHO" DO SITE
*/

bindCartButtons();


/*
  3. ATUALIZA CONTADOR
*/

updateCartCount();


/*
  4. PREPARA O CONTEÚDO
*/

renderCart();
