/* =========================================
   OJOBOSCO
   SCRIPT PRINCIPAL
========================================= */


/* =========================================
   CONFIGURAÇÕES
========================================= */

const CART_STORAGE_KEY =
  "ojobosco-cart";


const COUPON_STORAGE_KEY =
  "ojobosco-coupon";


const FREE_SHIPPING_THRESHOLD =
  500;


const VALID_COUPONS = {
  BEMVINDO: 10,
  CAMILAGUS: 10
};


/* =========================================
   MENU
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
        .overflow =
        "hidden";

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
        .overflow =
        "";

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
            .overflow =
            "";

        }
      );

    }
  );


/* =========================================
   NEWSLETTER
========================================= */

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
        .display =
        "none";


      newsletterSuccess
        .classList
        .add(
          "visible"
        );

    }
  );

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
      style:
        "currency",

      currency:
        "BRL"
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
   CARRINHO
========================================= */

function getCart() {

  try {

    const saved =
      localStorage.getItem(
        CART_STORAGE_KEY
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

  } catch (
    error
  ) {

    return [];

  }

}


function saveCart(
  cart
) {

  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(
      cart
    )
  );


  updateCartCount();

  renderCartPage();

}


/* =========================================
   CUPOM
========================================= */

function getActiveCoupon() {

  try {

    const saved =
      localStorage.getItem(
        COUPON_STORAGE_KEY
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

  } catch (
    error
  ) {

    return null;

  }

}


function saveActiveCoupon(
  coupon
) {

  if (!coupon) {

    localStorage.removeItem(
      COUPON_STORAGE_KEY
    );

  } else {

    localStorage.setItem(
      COUPON_STORAGE_KEY,
      JSON.stringify(
        coupon
      )
    );

  }


  renderCartPage();

}


/* =========================================
   CHAVE DO PRODUTO
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
   ADICIONAR PRODUTO
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
        item.key ===
        key
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

function getCartQuantity() {

  const cart =
    getCart();


  return cart.reduce(
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

}


function updateCartCount() {

  const quantity =
    getCartQuantity();


  document
    .querySelectorAll(
      "#cartCount"
    )
    .forEach(
      (counter) => {

        counter.textContent =
          String(
            quantity
          );

      }
    );

}


/* =========================================
   CARRINHO DO HEADER
========================================= */

function bindCartHeaderLinks() {

  document
    .querySelectorAll(
      "#cartButton, .cart-link"
    )
    .forEach(
      (button) => {

        if (
          button.dataset
            .cartNavigationBound ===
          "true"
        ) {

          return;

        }


        button.dataset
          .cartNavigationBound =
          "true";


        button.addEventListener(
          "click",
          (event) => {

            if (
              window
                .location
                .pathname
                .includes(
                  "carrinho.html"
                )
            ) {

              return;

            }


            event.preventDefault();


            window
              .location
              .href =
              "carrinho.html";

          }
        );

      }
    );

}


/* =========================================
   CÁLCULOS
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


function calculateDiscount(
  subtotal
) {

  const coupon =
    getActiveCoupon();


  if (!coupon) {
    return 0;
  }


  const percentage =
    VALID_COUPONS[
      coupon.code
    ];


  if (!percentage) {
    return 0;
  }


  return (
    subtotal *
    (
      percentage /
      100
    )
  );

}


/* =========================================
   RENDERIZAR CARRINHO
========================================= */

function renderCartPage() {

  const itemsContainer =
    document.getElementById(
      "cartPageItems"
    );


  /*
    SE NÃO ESTAMOS NA PÁGINA
    carrinho.html, NÃO FAZ NADA.
  */

  if (!itemsContainer) {
    return;
  }


  const cart =
    getCart();


  const quantity =
    getCartQuantity();


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


  const coupon =
    getActiveCoupon();


  const freeShipping =
    subtotal >=
    FREE_SHIPPING_THRESHOLD;


  const countElement =
    document.getElementById(
      "cartPageCount"
    );


  const emptyElement =
    document.getElementById(
      "cartPageEmpty"
    );


  const subtotalElement =
    document.getElementById(
      "cartSubtotal"
    );


  const totalElement =
    document.getElementById(
      "cartTotal"
    );


  const discountElement =
    document.getElementById(
      "cartDiscount"
    );


  const discountRow =
    document.getElementById(
      "cartDiscountRow"
    );


  const discountLabel =
    document.getElementById(
      "cartDiscountLabel"
    );


  const shippingMessage =
    document.getElementById(
      "shippingMessage"
    );


  const shippingMethod =
    document.getElementById(
      "cartShippingMethod"
    );


  const couponInput =
    document.getElementById(
      "couponInput"
    );


  const couponMessage =
    document.getElementById(
      "couponMessage"
    );


  const removeCouponButton =
    document.getElementById(
      "removeCouponButton"
    );


  if (countElement) {

    countElement.textContent =
      "[" +
      quantity +
      "]";

  }


  if (
    cart.length === 0
  ) {

    itemsContainer
      .innerHTML =
      "";


    if (emptyElement) {

      emptyElement
        .classList
        .add(
          "visible"
        );

    }

  } else {

    if (emptyElement) {

      emptyElement
        .classList
        .remove(
          "visible"
        );

    }


    itemsContainer.innerHTML =
      cart
        .map(
          (
            item,
            index
          ) => {

            const image =
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
                : `

                  <div
                    class="
                      cart-product-image-empty
                    "
                  ></div>

                `;


            const title =
              item.fragrance
                ? item.fragrance
                : item.product;


            return `

              <article
                class="cart-product"
              >


                <div
                  class="
                    cart-product-image
                  "
                >

                  ${image}

                </div>


                <div
                  class="
                    cart-product-content
                  "
                >


                  <div
                    class="
                      cart-product-top
                    "
                  >


                    <div>


                      <h2
                        class="
                          cart-product-title
                        "
                      >
                        ${escapeHtml(
                          title
                        )}
                      </h2>


                      ${
                        item.fragrance
                          ? `

                            <p
                              class="
                                cart-product-type
                              "
                            >
                              ${escapeHtml(
                                item.product
                              )}
                            </p>

                          `
                          : ""
                      }


                      ${
                        item.size
                          ? `

                            <p
                              class="
                                cart-product-variant
                              "
                            >
                              TAMANHO:
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
                      class="
                        cart-product-remove
                      "
                      data-cart-remove="${index}"
                      aria-label="Remover produto"
                    >
                      ×
                    </button>


                  </div>


                  <div
                    class="
                      cart-product-bottom
                    "
                  >


                    <div
                      class="
                        cart-product-quantity-area
                      "
                    >


                      <div
                        class="
                          cart-product-quantity
                        "
                      >

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


                      <p
                        class="
                          cart-product-unit-price
                        "
                      >
                        ${formatCurrency(
                          Number(
                            item.price
                          )
                        )}
                      </p>


                    </div>


                    <strong
                      class="
                        cart-product-total-price
                      "
                    >
                      ${formatCurrency(
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity
                        )
                      )}
                    </strong>


                  </div>


                </div>


              </article>

            `;

          }
        )
        .join(
          ""
        );

  }


  if (subtotalElement) {

    subtotalElement
      .textContent =
      formatCurrency(
        subtotal
      );

  }


  if (totalElement) {

    totalElement
      .textContent =
      formatCurrency(
        total
      );

  }


  if (
    discountRow &&
    discountElement &&
    discountLabel
  ) {

    if (
      discount >
      0
    ) {

      discountRow
        .classList
        .add(
          "visible"
        );


      discountLabel
        .textContent =
        coupon
          ? "DESCONTO " +
            coupon.code
          : "DESCONTO";


      discountElement
        .textContent =
        "- " +
        formatCurrency(
          discount
        );

    } else {

      discountRow
        .classList
        .remove(
          "visible"
        );

    }

  }


  if (
    shippingMessage &&
    shippingMethod
  ) {

    if (
      freeShipping
    ) {

      shippingMethod
        .textContent =
        "Frete grátis";


      shippingMessage
        .textContent =
        "FRETE GRÁTIS APLICADO AO PEDIDO.";


      shippingMessage
        .classList
        .add(
          "free"
        );

    } else {

      shippingMethod
        .textContent =
        "Padrão";


      shippingMessage
        .textContent =
        "Frete grátis em compras a partir de R$500.";


      shippingMessage
        .classList
        .remove(
          "free"
        );

    }

  }


  if (couponInput) {

    couponInput.value =
      coupon
        ? coupon.code
        : "";

  }


  if (couponMessage) {

    if (
      coupon &&
      VALID_COUPONS[
        coupon.code
      ]
    ) {

      couponMessage
        .textContent =
        coupon.code +
        " · 10% DE DESCONTO APLICADO";

    } else {

      couponMessage
        .textContent =
        "";

    }

  }


  if (
    removeCouponButton
  ) {

    if (
      coupon &&
      VALID_COUPONS[
        coupon.code
      ]
    ) {

      removeCouponButton
        .classList
        .add(
          "visible"
        );

    } else {

      removeCouponButton
        .classList
        .remove(
          "visible"
        );

    }

  }


  bindCartItemEvents();

}


/* =========================================
   CONTROLES DO CARRINHO
========================================= */

function bindCartItemEvents() {


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
                cart[index]
                  .quantity
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


            const quantity =
              Number(
                cart[index]
                  .quantity
              ) - 1;


            if (
              quantity <=
              0
            ) {

              cart.splice(
                index,
                1
              );

            } else {

              cart[index]
                .quantity =
                quantity;

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
   CUPOM
========================================= */

const cartCouponForm =
  document.getElementById(
    "cartCouponForm"
  );


const couponInput =
  document.getElementById(
    "couponInput"
  );


const couponMessage =
  document.getElementById(
    "couponMessage"
  );


const removeCouponButton =
  document.getElementById(
    "removeCouponButton"
  );


if (
  cartCouponForm &&
  couponInput
) {

  cartCouponForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const code =
        couponInput
          .value
          .trim()
          .toUpperCase();


      if (
        code ===
        "BEMVINDO" ||
        code ===
        "CAMILAGUS"
      ) {

        /*
          UM CUPOM POR VEZ.

          Como existe apenas uma
          chave no localStorage,
          o novo cupom substitui
          automaticamente o anterior.
        */

        saveActiveCoupon(
          {
            code:
              code,

            type:
              "percentage",

            value:
              10
          }
        );


        return;

      }


      if (couponMessage) {

        couponMessage
          .textContent =
          "CUPOM INVÁLIDO.";

      }

    }
  );

}


if (
  removeCouponButton
) {

  removeCouponButton
    .addEventListener(
      "click",
      () => {

        saveActiveCoupon(
          null
        );

      }
    );

}


/* =========================================
   CEP
========================================= */

const shippingCep =
  document.getElementById(
    "shippingCep"
  );


if (shippingCep) {

  shippingCep.addEventListener(
    "input",
    () => {

      let value =
        shippingCep
          .value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            8
          );


      if (
        value.length >
        5
      ) {

        value =
          value.slice(
            0,
            5
          ) +
          "-" +
          value.slice(
            5
          );

      }


      shippingCep.value =
        value;

    }
  );


  shippingCep.addEventListener(
    "blur",
    () => {

      const subtotal =
        calculateSubtotal(
          getCart()
        );


      const message =
        document.getElementById(
          "shippingMessage"
        );


      if (!message) {
        return;
      }


      if (
        subtotal >=
        FREE_SHIPPING_THRESHOLD
      ) {

        message
          .textContent =
          "FRETE GRÁTIS APLICADO AO PEDIDO.";


        return;

      }


      if (
        shippingCep
          .value
          .length ===
        9
      ) {

        message
          .textContent =
          "O VALOR DO FRETE SERÁ CALCULADO NA FINALIZAÇÃO DO PEDIDO.";

      }

    }
  );

}


/* =========================================
   LOJA
   TAMANHO + IMAGEM + PREÇO
========================================= */

document
  .querySelectorAll(
    ".produto-loja-card"
  )
  .forEach(
    (card) => {

      const sizeButtons =
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


      sizeButtons.forEach(
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


              sizeButtons
                .forEach(
                  (
                    currentButton
                  ) => {

                    currentButton
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


              /*
                IMPORTANTE:
                data-image-100
                data-image-250

                NÃO usar dataset aqui.
              */

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

                price
                  .textContent =
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

              buttons
                .forEach(
                  (
                    currentButton
                  ) => {

                    currentButton
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
   ADICIONAR PRODUTOS DA LOJA
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
                price,

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


  const addButton =
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

    fragranceButtons
      .forEach(
        (button) => {

          const active =
            button.getAttribute(
              "data-fragrance"
            ) ===
            currentFragrance;


          button
            .classList
            .toggle(
              "active",
              active
            );


          if (
            active &&
            fragranceName
          ) {

            fragranceName
              .textContent =
              button.getAttribute(
                "data-name"
              ) ||
              button
                .textContent
                .trim();

          }

        }
      );


    sizeButtons
      .forEach(
        (button) => {

          button
            .classList
            .toggle(
              "active",
              button.getAttribute(
                "data-size"
              ) ===
              currentSize
            );

        }
      );


    fragrancePanels
      .forEach(
        (panel) => {

          panel
            .classList
            .toggle(
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


      if (
        selectedPrice
      ) {

        detailPrice
          .textContent =
          formatCurrency(
            Number(
              selectedPrice
            )
          );

      }

    }

  }


  fragranceButtons
    .forEach(
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


  sizeButtons
    .forEach(
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


        const selectedButton =
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


        const fragrance =
          selectedButton
            ? (
                selectedButton
                  .getAttribute(
                    "data-name"
                  ) ||
                selectedButton
                  .textContent
                  .trim()
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


        addButton
          .textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            addButton
              .textContent =
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


  const activeButton =
    document.querySelector(
      ".produto-fragrancia-btn.active"
    );


  if (
    activeButton
  ) {

    selectedFragrance =
      activeButton.getAttribute(
        "data-name"
      ) ||
      activeButton
        .textContent
        .trim();

  }


  buttons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            (
              currentButton
            ) => {

              currentButton
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


          const slug =
            button.getAttribute(
              "data-fragrance"
            );


          panels.forEach(
            (panel) => {

              panel
                .classList
                .toggle(
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


  if (
    addButton
  ) {

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


        addButton
          .textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            addButton
              .textContent =
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


  if (
    button
  ) {

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


        button
          .textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            button
              .textContent =
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


  if (
    button
  ) {

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


        button
          .textContent =
          "ADICIONADO";


        window.setTimeout(
          () => {

            button
              .textContent =
              "ADICIONAR AO CARRINHO";

          },
          1000
        );

      }
    );

  }

}


/* =========================================
   FECHAR PEDIDO
========================================= */

function handleCheckout() {

  const cart =
    getCart();


  if (
    cart.length ===
    0
  ) {

    return;

  }


  const desktopButton =
    document.getElementById(
      "checkoutButtonDesktop"
    );


  const mobileButton =
    document.getElementById(
      "checkoutButtonMobile"
    );


  if (
    desktopButton
  ) {

    desktopButton
      .textContent =
      "PAGAMENTO EM CONFIGURAÇÃO";

  }


  if (
    mobileButton
  ) {

    mobileButton
      .textContent =
      "PAGAMENTO EM CONFIGURAÇÃO";

  }


  /*
    NA PRÓXIMA ETAPA
    ESTE PONTO SERÁ SUBSTITUÍDO
    PELA CHAMADA SEGURA AO
    CLOUDFLARE WORKER / MERCADO PAGO.
  */


  window.setTimeout(
    () => {

      if (
        desktopButton
      ) {

        desktopButton
          .innerHTML =
          `
            <span class="cart-lock">
              ♢
            </span>
            Fechar pedido
          `;

      }


      if (
        mobileButton
      ) {

        mobileButton
          .innerHTML =
          `
            <span class="cart-lock">
              ♢
            </span>
            Fechar pedido
          `;

      }

    },
    1500
  );

}


const checkoutButtonDesktop =
  document.getElementById(
    "checkoutButtonDesktop"
  );


const checkoutButtonMobile =
  document.getElementById(
    "checkoutButtonMobile"
  );


if (
  checkoutButtonDesktop
) {

  checkoutButtonDesktop
    .addEventListener(
      "click",
      handleCheckout
    );

}


if (
  checkoutButtonMobile
) {

  checkoutButtonMobile
    .addEventListener(
      "click",
      handleCheckout
    );

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

updateCartCount();

bindCartHeaderLinks();

renderCartPage();
