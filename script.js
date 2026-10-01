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

  renderCartPage();

}


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


  renderCartPage();

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
   CHAVE DO ITEM
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
   ADICIONAR ITEM
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
   CONTADOR
========================================= */

function updateCartCount() {

  const counters =
    document.querySelectorAll(
      "#cartCount"
    );


  const cart =
    getCart();


  const totalItems =
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
          totalItems
        );

    }
  );

}


/* =========================================
   CLIQUE NO CARRINHO
   ABRE PÁGINA PRÓPRIA
========================================= */

function bindCartLinks() {

  const links =
    document.querySelectorAll(
      "#cartButton, .cart-link"
    );


  links.forEach(
    (link) => {

      if (
        window.location.pathname.includes(
          "carrinho.html"
        )
      ) {

        return;

      }


      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          window.location.href =
            "carrinho.html";

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
   CUPONS

   BEMVINDO = 10%
   CAMILAGUS = 10%

   UM POR VEZ
========================================= */

function calculateDiscount(
  subtotal
) {

  const coupon =
    getActiveCoupon();


  if (!coupon) {
    return 0;
  }


  if (
    coupon.code ===
    "BEMVINDO" ||
    coupon.code ===
    "CAMILAGUS"
  ) {

    return (
      subtotal *
      0.10
    );

  }


  return 0;

}


/* =========================================
   RENDERIZAR PÁGINA DO CARRINHO
========================================= */

function renderCartPage() {

  const productsContainer =
    document.getElementById(
      "cartPageProducts"
    );


  const summaryContainer =
    document.getElementById(
      "cartPageSummary"
    );


  const couponInput =
    document.getElementById(
      "cartPageCouponInput"
    );


  const couponMessage =
    document.getElementById(
      "cartPageCouponMessage"
    );


  const removeCouponButton =
    document.getElementById(
      "cartPageRemoveCoupon"
    );


  if (
    !productsContainer ||
    !summaryContainer
  ) {

    return;

  }


  const cart =
    getCart();


  const coupon =
    getActiveCoupon();


  if (couponInput) {

    couponInput.value =
      coupon
        ? coupon.code
        : "";

  }


  if (couponMessage) {

    if (coupon) {

      couponMessage.textContent =
        coupon.code +
        " · 10% DE DESCONTO APLICADO";

    } else {

      couponMessage.textContent =
        "";

    }

  }


  if (removeCouponButton) {

    removeCouponButton.style.display =
      coupon
        ? "inline-block"
        : "none";

  }


  if (
    cart.length === 0
  ) {

    productsContainer.innerHTML = `

      <div class="cart-page-empty">

        <p>
          SEU CARRINHO ESTÁ VAZIO.
        </p>

        <a href="loja.html">
          VOLTAR À LOJA
        </a>

      </div>
    `;


    summaryContainer.innerHTML = "";


    return;

  }


  productsContainer.innerHTML =
    cart
      .map(
        (
          item,
          index
        ) => {

          return `

            <article class="cart-page-item">


              <div class="cart-page-item-image">

                ${
                  item.image
                    ? `

                      <img
                        src="${escapeHtml(
                          item.image
                        )}"
                        alt="${escapeHtml(
                          item.product
                        )}"
                      >

                    `
                    : ""
                }

              </div>


              <div class="cart-page-item-info">


                <h2>
                  ${escapeHtml(
                    item.product
                  )}
                </h2>


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


                <p>
                  QTD:
                  ${Number(
                    item.quantity
                  )}
                </p>


                <p class="cart-page-item-price">

                  ${formatCurrency(
                    Number(
                      item.price
                    ) *
                    Number(
                      item.quantity
                    )
                  )}

                </p>


                <div class="cart-page-item-controls">

                  <button
                    type="button"
                    data-cart-minus="${index}"
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
                  >
                    +
                  </button>

                </div>


                <button
                  type="button"
                  class="cart-page-remove"
                  data-cart-remove="${index}"
                >
                  REMOVER
                </button>


              </div>


            </article>
          `;

        }
      )
      .join(
        ""
      );


  const subtotal =
    calculateSubtotal(
      cart
    );


  const discount =
    calculateDiscount(
      subtotal
    );


  const total =
    subtotal -
    discount;


  const freeShipping =
    subtotal >= 500;


  summaryContainer.innerHTML = `

    <div class="cart-page-summary-line">

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

          <div class="cart-page-summary-line">

            <span>
              DESCONTO ${escapeHtml(
                coupon.code
              )}
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


    <div class="cart-page-summary-line">

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

          <p class="cart-page-shipping-message">
            FRETE GRÁTIS APLICADO
          </p>

        `
        : `

          <p class="cart-page-shipping-message">
            FRETE GRÁTIS EM COMPRAS A PARTIR DE R$500
          </p>

        `
    }


    <div
      class="
        cart-page-summary-line
        cart-page-total
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
  `;


  bindCartPageItemEvents();

}


/* =========================================
   EVENTOS DOS PRODUTOS DO CARRINHO
========================================= */

function bindCartPageItemEvents() {

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

}


/* =========================================
   CUPOM NA PÁGINA
========================================= */

function bindCartPageCoupon() {

  const button =
    document.getElementById(
      "cartPageCouponButton"
    );


  const input =
    document.getElementById(
      "cartPageCouponInput"
    );


  const message =
    document.getElementById(
      "cartPageCouponMessage"
    );


  const removeButton =
    document.getElementById(
      "cartPageRemoveCoupon"
    );


  if (
    button &&
    input
  ) {

    const applyCoupon =
      () => {

        const code =
          input
            .value
            .trim()
            .toUpperCase();


        if (
          code ===
          "BEMVINDO"
        ) {

          saveActiveCoupon(
            {
              code:
                "BEMVINDO",

              value:
                10
            }
          );


          return;

        }


        if (
          code ===
          "CAMILAGUS"
        ) {

          saveActiveCoupon(
            {
              code:
                "CAMILAGUS",

              value:
                10
            }
          );


          return;

        }


        localStorage.removeItem(
          "ojobosco-coupon"
        );


        if (message) {

          message.textContent =
            "CUPOM INVÁLIDO.";

        }


        renderCartPage();

      };


    button.addEventListener(
      "click",
      applyCoupon
    );


    input.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          applyCoupon();

        }

      }
    );

  }


  if (removeButton) {

    removeButton.addEventListener(
      "click",
      () => {

        saveActiveCoupon(
          null
        );

      }
    );

  }

}


/* =========================================
   CHECKOUT
========================================= */

function bindCheckoutButton() {

  const button =
    document.getElementById(
      "cartPageCheckout"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      const cart =
        getCart();


      if (
        cart.length === 0
      ) {

        return;

      }


      button.textContent =
        "CONECTANDO AO PAGAMENTO";


      /*
        NA PRÓXIMA ETAPA
        ESTE BOTÃO SERÁ CONECTADO
        AO MERCADO PAGO.
      */


      window.setTimeout(
        () => {

          button.textContent =
            "FINALIZAR COMPRA";

        },
        1500
      );

    }
  );

}


/* =========================================
   LOJA
   TAMANHOS
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


              card.setAttribute(
                "data-current-price",
                newPrice
              );

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


              if (card) {

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
   ADICIONAR NA LOJA
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
            Number(
              card.getAttribute(
                "data-current-price"
              )
            );


          addItemToCart(
            {
              product:
                product,

              fragrance:
                fragrance,

              size:
                size,

              price:
                price,

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
  );


/* =========================================
   AROMATIZADOR / DIFUSOR
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


  const addButton =
    detailPage.querySelector(
      ".produto-adicionar"
    );


  const allowed = [
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


  const params =
    new URLSearchParams(
      window.location.search
    );


  const requested =
    params.get(
      "fragrancia"
    );


  if (
    requested &&
    allowed.includes(
      requested
    )
  ) {

    currentFragrance =
      requested;

  }


  function updateDetail() {

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
            button.textContent.trim();

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


      detailPrice.textContent =
        formatCurrency(
          Number(
            selectedPrice
          )
        );

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


          updateDetail();

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


          updateDetail();

        }
      );

    }
  );


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        const selectedPrice =
          Number(
            detailPage.getAttribute(
              "data-price-" +
              currentSize
            )
          );


        const activeFragrance =
          Array.from(
            fragranceButtons
          ).find(
            (button) =>
              button.getAttribute(
                "data-fragrance"
              ) ===
              currentFragrance
          );


        const fragrance =
          activeFragrance
            ? (
                activeFragrance.getAttribute(
                  "data-name"
                ) ||
                activeFragrance.textContent.trim()
              )
            : currentFragrance;


        addItemToCart(
          {
            product:
              String(
                productType
              ).toUpperCase(),

            fragrance:
              fragrance,

            size:
              currentSize +
              " ML",

            price:
              selectedPrice,

            image:
              detailImage
                ? detailImage.src
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


  updateDetail();

}


/* =========================================
   VELA DETALHE
========================================= */

if (
  window.location.pathname.includes(
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


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            (item) =>
              item.classList.remove(
                "active"
              )
          );


          button.classList.add(
            "active"
          );


          selectedFragrance =
            button.getAttribute(
              "data-name"
            ) ||
            button.textContent.trim();


          const slug =
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
                slug
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
   BIBLIOTECA
========================================= */

if (
  window.location.pathname.includes(
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
========================================= */

if (
  window.location.pathname.includes(
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

updateCartCount();

bindCartLinks();

renderCartPage();

bindCartPageCoupon();

bindCheckoutButton();
