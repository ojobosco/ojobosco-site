(() => {
  "use strict";

  /* =========================================================
     OJOBOSCO — NAVEGAÇÃO GLOBAL
  ========================================================= */

  function normalizeNavigationLinks() {
    const links = document.querySelectorAll("a");

    links.forEach((link) => {
      const label = String(link.textContent || "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

      switch (label) {
        case "UNIVERSO":
          link.href = "index.html";
          break;

        case "LOJA":
          link.href = "loja.html";
          break;

        case "SOBRE":
          link.href = "universo.html";
          break;

        case "CONTATO":
          link.href = "contato.html";
          break;

        case "INSTAGRAM":
          link.href = "https://www.instagram.com/ojobosco/";
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          break;

        case "ENVIOS":
          link.href = "envios.html";
          break;

        case "TROCAS":
          link.href = "trocas.html";
          break;

        case "PRIVACIDADE":
          link.href = "privacidade.html";
          break;

        case "CARRINHO":
          link.href = "carrinho.html";
          break;
      }
    });
  }

  /* =========================================================
     CONSTANTES
  ========================================================= */

  const CART_STORAGE_KEY = "ojobosco-cart";
  const COUPON_STORAGE_KEY = "ojobosco-coupon";
  const SHIPPING_STORAGE_KEY = "ojobosco-shipping";

  const FREE_SHIPPING_THRESHOLD = 500;

  const VALID_COUPONS = {
    BEMVINDO: {
      code: "BEMVINDO",
      discount: 10
    },

    CAMILAGUS: {
      code: "CAMILAGUS",
      discount: 10
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatCEP(value) {
    const numbers = onlyNumbers(value).slice(0, 8);

    if (numbers.length <= 5) {
      return numbers;
    }

    return numbers.slice(0, 5) + "-" + numbers.slice(5);
  }

  function parseMoney(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
      return 0;
    }

    let text = String(value).replace(/[^\d,.-]/g, "");

    if (text.includes(",") && text.includes(".")) {
      text = text
        .replace(/\./g, "")
        .replace(",", ".");
    } else if (text.includes(",")) {
      text = text.replace(",", ".");
    }

    const number = Number(text);

    return Number.isFinite(number) ? number : 0;
  }

  function formatBRL(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function getCart() {
    try {
      const data = JSON.parse(
        localStorage.getItem(CART_STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );

    updateCartCount();
  }

  function getCoupon() {
    try {
      const raw = localStorage.getItem(
        COUPON_STORAGE_KEY
      );

      if (!raw) {
        return null;
      }

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }

      if (typeof data === "string") {
        const code = normalizeText(data);

        return VALID_COUPONS[code]
          ? {
              code,
              discount: VALID_COUPONS[code].discount
            }
          : null;
      }

      const code = normalizeText(
        data?.code ||
        data?.coupon ||
        ""
      );

      return VALID_COUPONS[code]
        ? {
            code,
            discount: VALID_COUPONS[code].discount
          }
        : null;
    } catch {
      return null;
    }
  }

  function saveCoupon(coupon) {
    if (!coupon) {
      localStorage.removeItem(
        COUPON_STORAGE_KEY
      );

      return;
    }

    localStorage.setItem(
      COUPON_STORAGE_KEY,
      JSON.stringify(coupon)
    );
  }

  function getShipping() {
    try {
      const data = JSON.parse(
        localStorage.getItem(
          SHIPPING_STORAGE_KEY
        ) || "null"
      );

      return data && data.cep
        ? data
        : null;
    } catch {
      return null;
    }
  }

  function saveShipping(shipping) {
    localStorage.setItem(
      SHIPPING_STORAGE_KEY,
      JSON.stringify(shipping)
    );
  }

  /* =========================================================
     CARRINHO
  ========================================================= */

  function getItemName(item) {
    return (
      item.name ||
      item.product ||
      item.productName ||
      "Produto OJOBOSCO"
    );
  }

  function getItemFragrance(item) {
    return (
      item.fragrance ||
      item.fragrancia ||
      ""
    );
  }

  function getItemSize(item) {
    return (
      item.size ||
      item.currentSize ||
      item.tamanho ||
      ""
    );
  }

  function getItemImage(item) {
    return (
      item.image ||
      item.imageUrl ||
      item.imagem ||
      item.currentImage ||
      ""
    );
  }

  function getItemPrice(item) {
    return parseMoney(
      item.price ??
      item.currentPrice ??
      0
    );
  }

  function getItemQuantity(item) {
    const quantity = Number(
      item.quantity ??
      item.qty ??
      1
    );

    return Number.isFinite(quantity) &&
      quantity > 0
      ? quantity
      : 1;
  }

  function createCartKey(item) {
    return [
      normalizeText(getItemName(item)),
      normalizeText(getItemFragrance(item)),
      normalizeText(getItemSize(item))
    ].join("|");
  }

  function addItemToCart(item) {
    const cart = getCart();

    const key = createCartKey(item);

    const existing = cart.find(
      (currentItem) =>
        createCartKey(currentItem) === key
    );

    if (existing) {
      existing.quantity =
        getItemQuantity(existing) +
        getItemQuantity(item);
    } else {
      cart.push({
        name: getItemName(item),
        product: getItemName(item),
        fragrance: getItemFragrance(item),
        size: getItemSize(item),
        price: getItemPrice(item),
        image: getItemImage(item),
        quantity: getItemQuantity(item)
      });
    }

    saveCart(cart);
  }

  function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(
      (total, item) =>
        total + getItemQuantity(item),
      0
    );

    document
      .querySelectorAll(
        "#cartCount, .cart-count, [data-cart-count]"
      )
      .forEach((counter) => {
        counter.textContent = String(count);
      });
  }

  /* =========================================================
     CARRINHO — LINKS
  ========================================================= */

  function initCartLinks() {
    document
      .querySelectorAll(
        "#cartButton, .cart-link, [data-cart-link]"
      )
      .forEach((link) => {
        link.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            window.location.href =
              "carrinho.html";
          }
        );
      });
  }

  /* =========================================================
     LOJA — VARIAÇÕES
  ========================================================= */

  function initStoreVariationButtons() {
    const cards = document.querySelectorAll(
      ".produto-card, .loja-card, [data-product-type]"
    );

    cards.forEach((card) => {
      const buttons = card.querySelectorAll(
        ".variacao-btn, .size-btn, [data-size]"
      );

      buttons.forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const size =
              button.getAttribute(
                "data-size"
              ) ||
              button.textContent.replace(
                /\D/g,
                ""
              );

            if (!size) {
              return;
            }

            const newImage =
              card.getAttribute(
                "data-image-" + size
              );

            const newPrice =
              card.getAttribute(
                "data-price-" + size
              );

            const image =
              card.querySelector("img");

            const price =
              card.querySelector(
                ".produto-preco, .price, [data-product-price]"
              );

            if (newImage && image) {
              image.src = newImage;
            }

            if (newPrice && price) {
              price.textContent = formatBRL(
                parseMoney(newPrice)
              );
            }

            card.setAttribute(
              "data-current-size",
              size
            );

            if (newPrice) {
              card.setAttribute(
                "data-current-price",
                parseMoney(newPrice)
              );
            }

            buttons.forEach((current) =>
              current.classList.remove(
                "active"
              )
            );

            button.classList.add("active");
          }
        );
      });
    });
  }

  /* =========================================================
     LOJA — ADICIONAR AO CARRINHO
  ========================================================= */

  function initStoreAddButtons() {
    document
      .querySelectorAll(
        ".adicionar-card-btn, [data-add-cart]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            const card = button.closest(
              ".produto-card, .loja-card, [data-product-type]"
            );

            if (!card) {
              return;
            }

            const image =
              card.querySelector("img");

            const product =
              card.getAttribute(
                "data-product-type"
              ) ||
              card.getAttribute(
                "data-product"
              ) ||
              card.querySelector("h3")
                ?.textContent ||
              "Produto OJOBOSCO";

            const fragrance =
              card.getAttribute(
                "data-fragrance"
              ) || "";

            const size =
              card.getAttribute(
                "data-current-size"
              ) || "";

            let price =
              card.getAttribute(
                "data-current-price"
              );

            if (!price) {
              const priceElement =
                card.querySelector(
                  ".produto-preco, .price, [data-product-price]"
                );

              price = priceElement
                ? parseMoney(
                    priceElement.textContent
                  )
                : 0;
            }

            addItemToCart({
              name: product,
              product,
              fragrance,
              size,
              price: parseMoney(price),
              image: image
                ? image.getAttribute("src")
                : "",
              quantity: 1
            });

            const originalText =
              button.textContent;

            button.textContent =
              "ADICIONADO";

            setTimeout(() => {
              button.textContent =
                originalText;
            }, 1200);
          }
        );
      });
  }

  /* =========================================================
     PÁGINA DO PRODUTO
  ========================================================= */

  function initProductPage() {
    const addButton =
      document.querySelector(
        "#adicionarCarrinho, #addToCart, .produto-adicionar, [data-product-add]"
      );

    if (!addButton) {
      return;
    }

    addButton.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        const productContainer =
          addButton.closest(
            "[data-product-page]"
          ) ||
          document.body;

        const product =
          productContainer.getAttribute(
            "data-product"
          ) ||
          productContainer.getAttribute(
            "data-product-type"
          ) ||
          document.querySelector(
            ".produto-detalhe-nome, h1"
          )?.textContent ||
          "Produto OJOBOSCO";

        const fragrance =
          productContainer.getAttribute(
            "data-fragrance"
          ) ||
          "";

        const selectedSize =
          document.querySelector(
            ".size-btn.active, .variacao-btn.active, [data-size].active"
          );

        const size =
          productContainer.getAttribute(
            "data-current-size"
          ) ||
          selectedSize?.getAttribute(
            "data-size"
          ) ||
          "";

        const priceElement =
          document.querySelector(
            ".produto-preco, .produto-detalhe-preco, [data-product-price]"
          );

        const price =
          productContainer.getAttribute(
            "data-current-price"
          ) ||
          (
            priceElement
              ? parseMoney(
                  priceElement.textContent
                )
              : 0
          );

        const image =
          document.querySelector(
            ".produto-detalhe-imagem img, .product-image img, main img"
          );

        addItemToCart({
          name: product,
          product,
          fragrance,
          size,
          price: parseMoney(price),
          image: image
            ? image.getAttribute("src")
            : "",
          quantity: 1
        });

        const originalText =
          addButton.textContent;

        addButton.textContent =
          "ADICIONADO AO CARRINHO";

        setTimeout(() => {
          addButton.textContent =
            originalText;
        }, 1200);
      }
    );
  }

  /* =========================================================
     FRETE
  ========================================================= */

  function getShippingRegionByState(
    state
  ) {
    const uf =
      normalizeText(state);

    if (uf === "PE") {
      return "RMR";
    }

    if (
      [
        "AL",
        "BA",
        "CE",
        "MA",
        "PB",
        "PI",
        "RN",
        "SE"
      ].includes(uf)
    ) {
      return "NORDESTE";
    }

    if (
      [
        "DF",
        "GO",
        "MT",
        "MS"
      ].includes(uf)
    ) {
      return "CENTRO_OESTE";
    }

    if (
      [
        "ES",
        "MG",
        "RJ",
        "SP"
      ].includes(uf)
    ) {
      return "SUDESTE";
    }

    return "NORTE_SUL";
  }

  function getShippingPriceByRegion(
    region
  ) {
    const prices = {
      RMR: 15,
      NORDESTE: 35,
      CENTRO_OESTE: 45,
      SUDESTE: 55,
      NORTE_SUL: 65
    };

    return prices[region] ?? 0;
  }

  async function lookupCEP(cep) {
    const normalizedCEP =
      onlyNumbers(cep);

    if (
      normalizedCEP.length !== 8
    ) {
      throw new Error(
        "CEP inválido."
      );
    }

    const response =
      await fetch(
        `https://viacep.com.br/ws/${normalizedCEP}/json/`
      );

    if (!response.ok) {
      throw new Error(
        "Não foi possível consultar o CEP."
      );
    }

    const data =
      await response.json();

    if (data.erro) {
      throw new Error(
        "CEP não encontrado."
      );
    }

    const region =
      getShippingRegionByState(
        data.uf
      );

    const price =
      getShippingPriceByRegion(
        region
      );

    return {
      cep: normalizedCEP,
      street: data.logradouro || "",
      district: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      region,
      price,
      originalPrice: price
    };
  }

  /* =========================================================
     CARRINHO — TOTAL
  ========================================================= */

  function calculateCartTotals(
    cart,
    coupon,
    shippingData
  ) {
    const subtotal =
      cart.reduce(
        (total, item) =>
          total +
          (
            getItemPrice(item) *
            getItemQuantity(item)
          ),
        0
      );

    const discount =
      coupon
        ? subtotal *
          (
            coupon.discount /
            100
          )
        : 0;

    let shipping = 0;

    if (shippingData) {
      const originalShipping =
        Number(
          shippingData.originalPrice ??
          shippingData.price ??
          0
        );

      if (coupon) {
        shipping = originalShipping;
      } else if (
        subtotal >=
        FREE_SHIPPING_THRESHOLD
      ) {
        shipping = 0;
      } else {
        shipping = originalShipping;
      }
    }

    const total =
      Math.max(
        0,
        subtotal -
        discount +
        shipping
      );

    return {
      subtotal,
      discount,
      shipping,
      total
    };
  }

  /* =========================================================
     PÁGINA DO CARRINHO
  ========================================================= */

  function getCartElements() {
    return {
      items:
        document.getElementById(
          "cartPageItems"
        ),

      empty:
        document.getElementById(
          "cartEmpty"
        ),

      title:
        document.getElementById(
          "cartPageTitle"
        ),

      subtotal:
        document.getElementById(
          "cartSubtotal"
        ),

      shipping:
        document.getElementById(
          "cartShipping"
        ),

      discount:
        document.getElementById(
          "cartDiscount"
        ),

      discountRow:
        document.getElementById(
          "cartDiscountRow"
        ),

      total:
        document.getElementById(
          "cartTotal"
        ),

      couponInput:
        document.getElementById(
          "cartCouponInput"
        ),

      couponButton:
        document.getElementById(
          "cartCouponButton"
        ),

      couponMessage:
        document.getElementById(
          "cartCouponMessage"
        ),

      cepInput:
        document.getElementById(
          "cartCepInput"
        ),

      shippingButton:
        document.getElementById(
          "cartShippingButton"
        ),

      shippingMessage:
        document.getElementById(
          "cartShippingMessage"
        ),

      checkoutButtons:
        document.querySelectorAll(
          "#cartCheckoutButton, #cartCheckoutMobile, .cart-checkout-button"
        )
    };
  }

  function renderCartPage() {
    const elements =
      getCartElements();

    if (!elements.items) {
      return;
    }

    const cart =
      getCart();

    const coupon =
      getCoupon();

    const shippingData =
      getShipping();

    const totals =
      calculateCartTotals(
        cart,
        coupon,
        shippingData
      );

    elements.items.innerHTML = "";

    if (elements.title) {
      const count =
        cart.reduce(
          (total, item) =>
            total +
            getItemQuantity(item),
          0
        );

      elements.title.textContent =
        `CARRINHO DE COMPRAS [${count}]`;
    }

    if (cart.length === 0) {
      if (elements.empty) {
        elements.empty.style.display =
          "block";
      }
    } else {
      if (elements.empty) {
        elements.empty.style.display =
          "none";
      }

      cart.forEach(
        (item, index) => {
          const row =
            document.createElement(
              "article"
            );

          row.className =
            "cart-item";

          const image =
            getItemImage(item);

          const name =
            getItemName(item);

          const fragrance =
            getItemFragrance(item);

          const size =
            getItemSize(item);

          const quantity =
            getItemQuantity(item);

          const unitPrice =
            getItemPrice(item);

          row.innerHTML = `
            <div class="cart-item-image-wrap">
              ${
                image
                  ? `
                    <img
                      src="${escapeHTML(image)}"
                      alt="${escapeHTML(name)}"
                      class="cart-item-image"
                    >
                  `
                  : ""
              }
            </div>

            <div class="cart-item-info">
              <h2 class="cart-item-name">
                ${escapeHTML(name)}
              </h2>

              ${
                fragrance
                  ? `
                    <p class="cart-item-meta">
                      ${escapeHTML(fragrance)}
                    </p>
                  `
                  : ""
              }

              ${
                size
                  ? `
                    <p class="cart-item-meta">
                      ${escapeHTML(size)}
                    </p>
                  `
                  : ""
              }

              <div class="cart-item-quantity">
                <button
                  type="button"
                  data-cart-minus="${index}"
                >
                  −
                </button>

                <span>
                  ${quantity}
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
                class="cart-remove"
                data-cart-remove="${index}"
              >
                REMOVER
              </button>
            </div>

            <div class="cart-item-price">
              ${formatBRL(
                unitPrice *
                quantity
              )}
            </div>
          `;

          elements.items.appendChild(
            row
          );
        }
      );
    }

    if (elements.subtotal) {
      elements.subtotal.textContent =
        formatBRL(
          totals.subtotal
        );
    }

    if (elements.discount) {
      elements.discount.textContent =
        totals.discount > 0
          ? "- " +
            formatBRL(
              totals.discount
            )
          : formatBRL(0);
    }

    if (elements.discountRow) {
      elements.discountRow.style.display =
        totals.discount > 0
          ? "flex"
          : "none";
    }

    if (elements.shipping) {
      if (!shippingData) {
        elements.shipping.textContent =
          "A CALCULAR";
      } else if (
        totals.shipping === 0
      ) {
        elements.shipping.textContent =
          "GRÁTIS";
      } else {
        elements.shipping.textContent =
          formatBRL(
            totals.shipping
          );
      }
    }

    if (elements.total) {
      elements.total.textContent =
        formatBRL(
          totals.total
        );
    }

    if (
      elements.cepInput &&
      shippingData?.cep
    ) {
      elements.cepInput.value =
        formatCEP(
          shippingData.cep
        );
    }

    if (elements.shippingMessage) {
      if (shippingData) {
        if (coupon) {
          elements.shippingMessage.textContent =
            `FRETE PARA ${shippingData.city || ""} / ${shippingData.state || ""}: ${formatBRL(totals.shipping)}. CUPOM NÃO É CUMULATIVO COM FRETE GRÁTIS.`;
        } else if (
          totals.shipping === 0
        ) {
          elements.shippingMessage.textContent =
            "FRETE GRÁTIS PARA ESTE PEDIDO.";
        } else {
          elements.shippingMessage.textContent =
            `FRETE PARA ${shippingData.city || ""} / ${shippingData.state || ""}: ${formatBRL(totals.shipping)}.`;
        }
      } else {
        elements.shippingMessage.textContent =
          "INFORME O CEP PARA CALCULAR O FRETE.";
      }
    }

    if (
      elements.couponInput &&
      coupon
    ) {
      elements.couponInput.value =
        coupon.code;
    }

    if (elements.couponMessage) {
      elements.couponMessage.textContent =
        coupon
          ? `CUPOM ${coupon.code} APLICADO — ${coupon.discount}% DE DESCONTO. CUPOM NÃO É CUMULATIVO COM FRETE GRÁTIS.`
          : "";
    }

    bindCartPageEvents();
  }

  function bindCartPageEvents() {
    document
      .querySelectorAll(
        "[data-cart-plus]"
      )
      .forEach((button) => {
        button.onclick = () => {
          const index = Number(
            button.getAttribute(
              "data-cart-plus"
            )
          );

          const cart = getCart();

          if (!cart[index]) {
            return;
          }

          cart[index].quantity =
            getItemQuantity(
              cart[index]
            ) + 1;

          saveCart(cart);
          renderCartPage();
        };
      });

    document
      .querySelectorAll(
        "[data-cart-minus]"
      )
      .forEach((button) => {
        button.onclick = () => {
          const index = Number(
            button.getAttribute(
              "data-cart-minus"
            )
          );

          const cart = getCart();

          if (!cart[index]) {
            return;
          }

          const quantity =
            getItemQuantity(
              cart[index]
            );

          if (quantity <= 1) {
            return;
          }

          cart[index].quantity =
            quantity - 1;

          saveCart(cart);
          renderCartPage();
        };
      });

    document
      .querySelectorAll(
        "[data-cart-remove]"
      )
      .forEach((button) => {
        button.onclick = () => {
          const index = Number(
            button.getAttribute(
              "data-cart-remove"
            )
          );

          const cart = getCart();

          cart.splice(index, 1);

          saveCart(cart);
          renderCartPage();
        };
      });

    const elements =
      getCartElements();

    if (elements.cepInput) {
      elements.cepInput.oninput =
        () => {
          elements.cepInput.value =
            formatCEP(
              elements.cepInput.value
            );
        };
    }

    if (elements.shippingButton) {
      elements.shippingButton.onclick =
        async () => {
          if (!elements.cepInput) {
            return;
          }

          const cep =
            onlyNumbers(
              elements.cepInput.value
            );

          if (cep.length !== 8) {
            if (
              elements.shippingMessage
            ) {
              elements.shippingMessage.textContent =
                "INFORME UM CEP VÁLIDO.";
            }

            return;
          }

          const originalText =
            elements.shippingButton.textContent;

          elements.shippingButton.disabled =
            true;

          elements.shippingButton.textContent =
            "CALCULANDO...";

          try {
            const shipping =
              await lookupCEP(cep);

            saveShipping(shipping);

            renderCartPage();
          } catch (error) {
            if (
              elements.shippingMessage
            ) {
              elements.shippingMessage.textContent =
                error.message ||
                "NÃO FOI POSSÍVEL CALCULAR O FRETE.";
            }
          } finally {
            elements.shippingButton.disabled =
              false;

            elements.shippingButton.textContent =
              originalText;
          }
        };
    }

    if (elements.couponButton) {
      elements.couponButton.onclick =
        () => {
          if (!elements.couponInput) {
            return;
          }

          const code =
            normalizeText(
              elements.couponInput.value
            );

          if (!code) {
            saveCoupon(null);
            renderCartPage();
            return;
          }

          const coupon =
            VALID_COUPONS[code];

          if (!coupon) {
            if (
              elements.couponMessage
            ) {
              elements.couponMessage.textContent =
                "CUPOM INVÁLIDO.";
            }

            return;
          }

          saveCoupon({
            code: coupon.code,
            discount: coupon.discount
          });

          renderCartPage();
        };
    }

    elements.checkoutButtons.forEach(
      (button) => {
        button.onclick = () => {
          const cart = getCart();

          if (!cart.length) {
            return;
          }

          const shipping =
            getShipping();

          if (!shipping) {
            if (
              elements.shippingMessage
            ) {
              elements.shippingMessage.textContent =
                "CALCULE O FRETE ANTES DE CONTINUAR.";
            }

            return;
          }

          window.location.href =
            "checkout.html";
        };
      }
    );
  }

  /* =========================================================
     MENU
  ========================================================= */

  function initMenu() {
    const menuButtons =
      document.querySelectorAll(
        "#menuButton, .menu-button, [data-menu-button]"
      );

    const menu =
      document.querySelector(
        "#mobileMenu, .mobile-menu, [data-mobile-menu]"
      );

    if (
      !menu ||
      !menuButtons.length
    ) {
      return;
    }

    menuButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          menu.classList.toggle(
            "active"
          );

          document.body.classList.toggle(
            "menu-open"
          );
        }
      );
    });

    menu
      .querySelectorAll(
        ".menu-close, [data-menu-close]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            menu.classList.remove(
              "active"
            );

            document.body.classList.remove(
              "menu-open"
            );
          }
        );
      });
  }

  /* =========================================================
     NEWSLETTER
  ========================================================= */

  function initNewsletter() {
    document
      .querySelectorAll(
        ".newsletter-form, [data-newsletter-form]"
      )
      .forEach((form) => {
        form.addEventListener(
          "submit",
          (event) => {
            event.preventDefault();

            const input =
              form.querySelector(
                'input[type="email"]'
              );

            const message =
              form.querySelector(
                ".newsletter-message, [data-newsletter-message]"
              );

            if (
              !input ||
              !input.value.trim()
            ) {
              return;
            }

            if (message) {
              message.textContent =
                "OBRIGADA. USE O CUPOM BEMVINDO NA SUA PRIMEIRA COMPRA.";
            }

            input.value = "";
          }
        );
      });
  }

  /* =========================================================
     ÂNCORAS LOJA
  ========================================================= */

  function scrollToStoreHash() {
    if (!window.location.hash) {
      return;
    }

    const target =
      document.querySelector(
        window.location.hash
      );

    if (!target) {
      return;
    }

    setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  }

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function init() {
    normalizeNavigationLinks();
    updateCartCount();
    initCartLinks();
    initMenu();
    initNewsletter();
    initStoreVariationButtons();
    initStoreAddButtons();
    initProductPage();
    renderCartPage();
    scrollToStoreHash();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
