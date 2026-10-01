(() => {
  "use strict";


  /* =========================================================
     CONFIGURAÇÃO
  ========================================================= */

  const CART_STORAGE_KEY = "ojobosco-cart";
  const COUPON_STORAGE_KEY = "ojobosco-coupon";
  const SHIPPING_STORAGE_KEY = "ojobosco-shipping";

  const FREE_SHIPPING_THRESHOLD = 500;

  const VALID_COUPONS = {
    BEMVINDO: 0.10,
    CAMILAGUS: 0.10
  };


  const SHIPPING_PRICES = {
    RMR: 15,
    NORDESTE: 35,
    CENTRO_OESTE: 45,
    SUDESTE: 55,
    NORTE_SUL: 65
  };


  const RMR_CITIES = [
    "ABREU E LIMA",
    "ARACOIABA",
    "CABO DE SANTO AGOSTINHO",
    "CAMARAGIBE",
    "IGARASSU",
    "ILHA DE ITAMARACA",
    "IPOJUCA",
    "ITAPISSUMA",
    "JABOATAO DOS GUARARAPES",
    "MORENO",
    "OLINDA",
    "PAULISTA",
    "RECIFE",
    "SAO LOURENCO DA MATA"
  ];


  const NORTHEAST_STATES = [
    "AL",
    "BA",
    "CE",
    "MA",
    "PB",
    "PE",
    "PI",
    "RN",
    "SE"
  ];


  const CENTER_WEST_STATES = [
    "DF",
    "GO",
    "MT",
    "MS"
  ];


  const SOUTHEAST_STATES = [
    "ES",
    "MG",
    "RJ",
    "SP"
  ];


  const NORTH_SOUTH_STATES = [
    "AC",
    "AP",
    "AM",
    "PA",
    "RO",
    "RR",
    "TO",
    "PR",
    "RS",
    "SC"
  ];


  /* =========================================================
     UTILITÁRIOS
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
    return String(value || "")
      .replace(/\D/g, "");
  }


  function formatCEP(value) {
    const numbers = onlyNumbers(value)
      .slice(0, 8);

    if (numbers.length <= 5) {
      return numbers;
    }

    return (
      numbers.slice(0, 5) +
      "-" +
      numbers.slice(5)
    );
  }


  function formatBRL(value) {
    const number = Number(value || 0);

    return number.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
  }


  function parseMoney(value) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (!value) {
      return 0;
    }

    let text = String(value)
      .replace(/[^\d,.-]/g, "")
      .trim();

    if (
      text.includes(",") &&
      text.includes(".")
    ) {
      text = text
        .replace(/\./g, "")
        .replace(",", ".");
    } else if (text.includes(",")) {
      text = text.replace(",", ".");
    }

    const number = Number(text);

    return Number.isFinite(number)
      ? number
      : 0;
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
     CARRINHO
  ========================================================= */

  function getCart() {
    try {
      const data = JSON.parse(
        localStorage.getItem(
          CART_STORAGE_KEY
        ) || "[]"
      );

      return Array.isArray(data)
        ? data
        : [];
    } catch {
      return [];
    }
  }


  function saveCart(cart) {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch {}

    updateCartCount();

    if (isCartPage()) {
      renderCartPage();
    }
  }


  function getItemQuantity(item) {
    const value = Number(
      item.quantity ??
      item.qty ??
      item.quantidade ??
      1
    );

    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      return 1;
    }

    return value;
  }


  function getItemPrice(item) {
    return parseMoney(
      item.price ??
      item.currentPrice ??
      item.preco ??
      item.valor ??
      0
    );
  }


  function getItemName(item) {
    return (
      item.name ||
      item.productName ||
      item.product ||
      item.nome ||
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
      ""
    );
  }


  function getItemKey(item) {
    return [
      normalizeText(
        getItemName(item)
      ),
      normalizeText(
        getItemFragrance(item)
      ),
      normalizeText(
        getItemSize(item)
      )
    ].join("|");
  }


  function cartQuantity() {
    return getCart().reduce(
      (total, item) =>
        total +
        getItemQuantity(item),
      0
    );
  }


  function cartSubtotal() {
    return getCart().reduce(
      (total, item) =>
        total +
        (
          getItemPrice(item) *
          getItemQuantity(item)
        ),
      0
    );
  }


  function addItemToCart(item) {
    const cart = getCart();

    const key = getItemKey(item);

    const existingIndex =
      cart.findIndex(
        current =>
          getItemKey(current) === key
      );

    if (existingIndex >= 0) {
      const currentQuantity =
        getItemQuantity(
          cart[existingIndex]
        );

      cart[existingIndex].quantity =
        currentQuantity +
        getItemQuantity(item);
    } else {
      cart.push({
        ...item,
        quantity:
          getItemQuantity(item)
      });
    }

    saveCart(cart);
  }


  function updateItemQuantity(
    index,
    quantity
  ) {
    const cart = getCart();

    if (!cart[index]) {
      return;
    }

    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity =
        quantity;
    }

    saveCart(cart);
  }


  function removeItem(index) {
    const cart = getCart();

    if (!cart[index]) {
      return;
    }

    cart.splice(index, 1);

    saveCart(cart);
  }


  function updateCartCount() {
    const count =
      cartQuantity();

    const elements = [
      document.getElementById(
        "cartCount"
      ),
      document.querySelector(
        ".cart-count"
      )
    ];

    elements.forEach(element => {
      if (!element) {
        return;
      }

      element.textContent =
        count > 0
          ? `[${count}]`
          : "";
    });
  }


  /* =========================================================
     CUPOM
  ========================================================= */

  function getCoupon() {
    try {
      const raw =
        localStorage.getItem(
          COUPON_STORAGE_KEY
        );

      if (!raw) {
        return null;
      }

      let value;

      try {
        value = JSON.parse(raw);
      } catch {
        value = raw;
      }

      let code = "";

      if (
        typeof value === "string"
      ) {
        code = value;
      } else if (
        value &&
        typeof value === "object"
      ) {
        code =
          value.code ||
          value.coupon ||
          value.codigo ||
          "";
      }

      code =
        normalizeText(code);

      if (!VALID_COUPONS[code]) {
        return null;
      }

      return {
        code,
        percentage:
          VALID_COUPONS[code]
      };

    } catch {
      return null;
    }
  }


  function saveCoupon(code) {
    const normalized =
      normalizeText(code);

    if (
      !VALID_COUPONS[
        normalized
      ]
    ) {
      return false;
    }

    localStorage.setItem(
      COUPON_STORAGE_KEY,
      JSON.stringify({
        code: normalized
      })
    );

    return true;
  }


  function removeCoupon() {
    localStorage.removeItem(
      COUPON_STORAGE_KEY
    );
  }


  function calculateDiscount(
    subtotal
  ) {
    const coupon =
      getCoupon();

    if (!coupon) {
      return 0;
    }

    return (
      subtotal *
      coupon.percentage
    );
  }


  /* =========================================================
     FRETE
  ========================================================= */

  function getSavedShipping() {
    try {
      const data = JSON.parse(
        localStorage.getItem(
          SHIPPING_STORAGE_KEY
        ) || "null"
      );

      if (
        !data ||
        !data.cep
      ) {
        return null;
      }

      return data;

    } catch {
      return null;
    }
  }


  function saveShipping(data) {
    try {
      localStorage.setItem(
        SHIPPING_STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch {}
  }


  function clearShipping() {
    localStorage.removeItem(
      SHIPPING_STORAGE_KEY
    );
  }


  function shippingRegion(
    city,
    state
  ) {
    const normalizedCity =
      normalizeText(city);

    const uf =
      normalizeText(state);


    if (
      uf === "PE" &&
      RMR_CITIES.includes(
        normalizedCity
      )
    ) {
      return {
        code: "RMR",
        name:
          "RECIFE / REGIÃO METROPOLITANA",
        price:
          SHIPPING_PRICES.RMR
      };
    }


    if (
      NORTHEAST_STATES.includes(
        uf
      )
    ) {
      return {
        code: "NORDESTE",
        name: "NORDESTE",
        price:
          SHIPPING_PRICES
            .NORDESTE
      };
    }


    if (
      CENTER_WEST_STATES.includes(
        uf
      )
    ) {
      return {
        code: "CENTRO_OESTE",
        name: "CENTRO-OESTE",
        price:
          SHIPPING_PRICES
            .CENTRO_OESTE
      };
    }


    if (
      SOUTHEAST_STATES.includes(
        uf
      )
    ) {
      return {
        code: "SUDESTE",
        name: "SUDESTE",
        price:
          SHIPPING_PRICES
            .SUDESTE
      };
    }


    if (
      NORTH_SOUTH_STATES.includes(
        uf
      )
    ) {
      return {
        code: "NORTE_SUL",
        name: "NORTE / SUL",
        price:
          SHIPPING_PRICES
            .NORTE_SUL
      };
    }


    return null;
  }


  async function fetchCEP(cep) {
    const cleanCEP =
      onlyNumbers(cep);

    if (cleanCEP.length !== 8) {
      throw new Error(
        "CEP inválido."
      );
    }

    const response =
      await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );

    if (!response.ok) {
      throw new Error(
        "Não foi possível consultar o CEP."
      );
    }

    const data =
      await response.json();

    if (
      !data ||
      data.erro
    ) {
      throw new Error(
        "CEP não encontrado."
      );
    }

    return data;
  }


  async function calculateShippingFromCEP(
    cep
  ) {
    const subtotal =
      cartSubtotal();

    const address =
      await fetchCEP(cep);

    const region =
      shippingRegion(
        address.localidade,
        address.uf
      );

    if (!region) {
      throw new Error(
        "Não foi possível calcular o frete para este CEP."
      );
    }


    const shippingPrice =
      subtotal >=
      FREE_SHIPPING_THRESHOLD
        ? 0
        : region.price;


    const shipping = {
      cep:
        onlyNumbers(cep),

      street:
        address.logradouro || "",

      district:
        address.bairro || "",

      city:
        address.localidade || "",

      state:
        address.uf || "",

      region:
        region.code,

      regionName:
        region.name,

      price:
        shippingPrice,

      originalPrice:
        region.price,

      freeShipping:
        subtotal >=
        FREE_SHIPPING_THRESHOLD
    };


    saveShipping(
      shipping
    );

    return shipping;
  }


  /* =========================================================
     PÁGINA CARRINHO
  ========================================================= */

  function isCartPage() {
    return Boolean(
      document.getElementById(
        "cartPageItems"
      )
    );
  }


  function renderCartPage() {
    if (!isCartPage()) {
      return;
    }


    const cart =
      getCart();

    const itemsElement =
      document.getElementById(
        "cartPageItems"
      );

    const emptyElement =
      document.getElementById(
        "cartEmpty"
      );

    const titleCount =
      document.getElementById(
        "cartTitleCount"
      );


    if (titleCount) {
      titleCount.textContent =
        `[${cartQuantity()}]`;
    }


    itemsElement.innerHTML = "";


    if (!cart.length) {
      emptyElement.hidden =
        false;

      itemsElement.hidden =
        true;

      updateCartSummary();

      return;
    }


    emptyElement.hidden =
      true;

    itemsElement.hidden =
      false;


    cart.forEach(
      (item, index) => {

        const row =
          document.createElement(
            "article"
          );

        row.className =
          "cart-item";


        const name =
          getItemName(item);

        const fragrance =
          getItemFragrance(item);

        const size =
          getItemSize(item);

        const image =
          getItemImage(item);

        const quantity =
          getItemQuantity(item);

        const price =
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
                : `
                  <div
                    class="cart-item-image cart-item-image-empty"
                  ></div>
                `
            }

          </div>


          <div class="cart-item-info">

            <h2 class="cart-item-name">
              ${escapeHTML(name)}
            </h2>


            ${
              fragrance
                ? `
                  <p class="cart-item-variant">
                    ${escapeHTML(fragrance)}
                  </p>
                `
                : ""
            }


            ${
              size
                ? `
                  <p class="cart-item-variant">
                    ${escapeHTML(size)}
                  </p>
                `
                : ""
            }


            <p class="cart-item-unit-price">
              ${formatBRL(price)}
            </p>


            <div class="cart-item-actions">

              <div class="cart-quantity">

                <button
                  type="button"
                  class="cart-quantity-minus"
                  data-cart-index="${index}"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>


                <span>
                  ${quantity}
                </span>


                <button
                  type="button"
                  class="cart-quantity-plus"
                  data-cart-index="${index}"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>

              </div>


              <button
                type="button"
                class="cart-remove"
                data-cart-index="${index}"
              >
                REMOVER
              </button>

            </div>

          </div>


          <div class="cart-item-total">
            ${formatBRL(
              price *
              quantity
            )}
          </div>

        `;


        itemsElement.appendChild(
          row
        );
      }
    );


    bindCartItemEvents();

    updateCartSummary();
  }


  function bindCartItemEvents() {

    document
      .querySelectorAll(
        ".cart-quantity-minus"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset
                  .cartIndex
              );

            const cart =
              getCart();

            if (!cart[index]) {
              return;
            }

            updateItemQuantity(
              index,
              getItemQuantity(
                cart[index]
              ) - 1
            );

          }
        );

      });


    document
      .querySelectorAll(
        ".cart-quantity-plus"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset
                  .cartIndex
              );

            const cart =
              getCart();

            if (!cart[index]) {
              return;
            }

            updateItemQuantity(
              index,
              getItemQuantity(
                cart[index]
              ) + 1
            );

          }
        );

      });


    document
      .querySelectorAll(
        ".cart-remove"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            removeItem(
              Number(
                button.dataset
                  .cartIndex
              )
            );

          }
        );

      });

  }


  function updateCartSummary() {

    const subtotal =
      cartSubtotal();

    const discount =
      calculateDiscount(
        subtotal
      );

    let shipping =
      getSavedShipping();


    /*
     * Se o carrinho atingir R$500,
     * o frete passa a ser grátis,
     * independentemente de cupom.
     */

    if (
      shipping &&
      subtotal >=
        FREE_SHIPPING_THRESHOLD
    ) {
      shipping.price = 0;
      shipping.freeShipping =
        true;

      saveShipping(
        shipping
      );
    }


    /*
     * Se o carrinho cair novamente
     * abaixo de R$500, restauramos
     * o valor normal da região.
     */

    if (
      shipping &&
      subtotal <
        FREE_SHIPPING_THRESHOLD &&
      shipping.freeShipping
    ) {

      shipping.price =
        Number(
          shipping.originalPrice ||
          0
        );

      shipping.freeShipping =
        false;

      saveShipping(
        shipping
      );

    }


    const shippingPrice =
      shipping
        ? Number(
            shipping.price || 0
          )
        : 0;


    const total =
      Math.max(
        0,
        subtotal -
        discount +
        shippingPrice
      );


    const subtotalElement =
      document.getElementById(
        "cartSubtotal"
      );

    const discountRow =
      document.getElementById(
        "cartDiscountRow"
      );

    const discountElement =
      document.getElementById(
        "cartDiscount"
      );

    const discountLabel =
      document.getElementById(
        "cartDiscountLabel"
      );

    const shippingRow =
      document.getElementById(
        "cartShippingRow"
      );

    const shippingElement =
      document.getElementById(
        "cartShipping"
      );

    const totalElement =
      document.getElementById(
        "cartTotal"
      );

    const methodElement =
      document.getElementById(
        "cartShippingMethod"
      );

    const methodPriceElement =
      document.getElementById(
        "cartShippingMethodPrice"
      );

    const messageElement =
      document.getElementById(
        "cartShippingMessage"
      );

    const cepInput =
      document.getElementById(
        "cartShippingCep"
      );


    if (subtotalElement) {
      subtotalElement.textContent =
        formatBRL(subtotal);
    }


    const coupon =
      getCoupon();


    if (
      discount > 0 &&
      coupon
    ) {

      discountRow.hidden =
        false;

      discountElement.textContent =
        "- " +
        formatBRL(
          discount
        );

      discountLabel.textContent =
        `DESCONTO ${coupon.code}`;

    } else {

      discountRow.hidden =
        true;

    }


    if (
      shipping &&
      shipping.cep
    ) {

      shippingRow.hidden =
        false;


      shippingElement.textContent =
        shippingPrice === 0
          ? "GRÁTIS"
          : formatBRL(
              shippingPrice
            );


      methodElement.textContent =
        "PADRÃO";


      methodPriceElement.textContent =
        shippingPrice === 0
          ? "GRÁTIS"
          : formatBRL(
              shippingPrice
            );


      if (
        subtotal >=
        FREE_SHIPPING_THRESHOLD
      ) {

        messageElement.textContent =
          `${shipping.city} / ${shipping.state} — FRETE GRÁTIS`;

      } else {

        messageElement.textContent =
          `${shipping.city} / ${shipping.state} — ${shipping.regionName}`;

      }


      if (
        cepInput &&
        !cepInput.value
      ) {

        cepInput.value =
          formatCEP(
            shipping.cep
          );

      }

    } else {

      shippingRow.hidden =
        true;

      methodElement.textContent =
        "PADRÃO";

      methodPriceElement.textContent =
        "";

      messageElement.textContent =
        "DIGITE SEU CEP PARA CALCULAR O FRETE.";

    }


    if (totalElement) {
      totalElement.textContent =
        formatBRL(total);
    }

  }


  /* =========================================================
     CALCULAR FRETE NO CARRINHO
  ========================================================= */

  function initCartShipping() {

    const input =
      document.getElementById(
        "cartShippingCep"
      );

    const button =
      document.getElementById(
        "cartShippingButton"
      );

    const message =
      document.getElementById(
        "cartShippingMessage"
      );


    if (
      !input ||
      !button
    ) {
      return;
    }


    const saved =
      getSavedShipping();


    if (
      saved &&
      saved.cep
    ) {
      input.value =
        formatCEP(
          saved.cep
        );
    }


    input.addEventListener(
      "input",
      () => {

        input.value =
          formatCEP(
            input.value
          );

      }
    );


    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          button.click();
        }

      }
    );


    button.addEventListener(
      "click",
      async () => {

        const cep =
          onlyNumbers(
            input.value
          );


        if (
          cep.length !== 8
        ) {

          message.textContent =
            "DIGITE UM CEP VÁLIDO.";

          return;
        }


        const previousText =
          button.textContent;


        button.disabled =
          true;

        button.textContent =
          "CALCULANDO...";

        message.textContent =
          "CALCULANDO FRETE...";


        try {

          const shipping =
            await calculateShippingFromCEP(
              cep
            );


          input.value =
            formatCEP(
              shipping.cep
            );


          updateCartSummary();


        } catch (error) {

          clearShipping();

          message.textContent =
            error.message ||
            "NÃO FOI POSSÍVEL CALCULAR O FRETE.";


          updateCartSummary();

        } finally {

          button.disabled =
            false;

          button.textContent =
            previousText;

        }

      }
    );

  }


  /* =========================================================
     CUPOM NO CARRINHO
  ========================================================= */

  function initCouponForm() {

    const form =
      document.getElementById(
        "couponForm"
      );

    const input =
      document.getElementById(
        "couponInput"
      );

    const message =
      document.getElementById(
        "couponMessage"
      );


    if (
      !form ||
      !input
    ) {
      return;
    }


    const existingCoupon =
      getCoupon();


    if (existingCoupon) {

      input.value =
        existingCoupon.code;

      message.textContent =
        `${existingCoupon.code} APLICADO — 10% DE DESCONTO`;

    }


    form.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const code =
          normalizeText(
            input.value
          );


        if (!code) {

          removeCoupon();

          message.textContent =
            "";

          renderCartPage();

          return;
        }


        if (
          !VALID_COUPONS[code]
        ) {

          message.textContent =
            "CUPOM INVÁLIDO.";

          return;
        }


        saveCoupon(
          code
        );


        input.value =
          code;


        message.textContent =
          `${code} APLICADO — 10% DE DESCONTO`;


        renderCartPage();

      }
    );

  }


  /* =========================================================
     FECHAR PEDIDO
  ========================================================= */

  function goToCheckout() {

    const cart =
      getCart();


    if (!cart.length) {
      return;
    }


    const shipping =
      getSavedShipping();


    if (
      !shipping ||
      !shipping.cep
    ) {

      const input =
        document.getElementById(
          "cartShippingCep"
        );

      const message =
        document.getElementById(
          "cartShippingMessage"
        );


      if (message) {

        message.textContent =
          "CALCULE O FRETE INFORMANDO SEU CEP ANTES DE CONTINUAR.";

      }


      if (input) {

        input.focus();

        input.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      }

      return;
    }


    window.location.href =
      "checkout.html";

  }


  function initCheckoutButtons() {

    [
      document.getElementById(
        "checkoutButtonDesktop"
      ),

      document.getElementById(
        "checkoutButtonMobile"
      )
    ]
      .filter(Boolean)
      .forEach(button => {

        button.addEventListener(
          "click",
          goToCheckout
        );

      });

  }


  /* =========================================================
     LINKS DO CARRINHO
  ========================================================= */

  function initCartLinks() {

    document
      .querySelectorAll(
        "#cartButton, .cart-link"
      )
      .forEach(element => {

        element.addEventListener(
          "click",
          event => {

            const href =
              element.getAttribute(
                "href"
              );

            if (
              href ===
              "carrinho.html"
            ) {
              return;
            }

            event.preventDefault();

            window.location.href =
              "carrinho.html";

          }
        );

      });

  }


  /* =========================================================
     LOJA — TAMANHOS
  ========================================================= */

  function initStoreSizeButtons() {

    document
      .querySelectorAll(
        ".categoria-loja"
      )
      .forEach(() => {});


    document
      .querySelectorAll(
        ".produto-card"
      )
      .forEach(card => {

        const buttons =
          card.querySelectorAll(
            "[data-size]"
          );


        buttons.forEach(
          button => {

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


                const image =
                  card.getAttribute(
                    "data-image-" +
                    size
                  );


                const price =
                  card.getAttribute(
                    "data-price-" +
                    size
                  );


                const cardImage =
                  card.querySelector(
                    "img"
                  );


                const priceElement =
                  card.querySelector(
                    ".produto-preco, .product-price, .preco"
                  );


                if (
                  image &&
                  cardImage
                ) {

                  cardImage.src =
                    image;

                }


                if (
                  price &&
                  priceElement
                ) {

                  const numericPrice =
                    parseMoney(
                      price
                    );


                  priceElement.textContent =
                    numericPrice
                      ? formatBRL(
                          numericPrice
                        )
                      : price;

                }


                card.setAttribute(
                  "data-current-size",
                  size
                );


                if (price) {

                  card.setAttribute(
                    "data-current-price",
                    String(
                      parseMoney(
                        price
                      )
                    )
                  );

                }


                buttons.forEach(
                  other =>
                    other.classList.remove(
                      "active"
                    )
                );


                button.classList.add(
                  "active"
                );

              }
            );

          }
        );

      });

  }


  /* =========================================================
     LOJA — ADICIONAR AO CARRINHO
  ========================================================= */

  function initStoreAddButtons() {

    document
      .querySelectorAll(
        ".adicionar-card-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();


            const card =
              button.closest(
                ".produto-card"
              );


            if (!card) {
              return;
            }


            const product =
              card.getAttribute(
                "data-product-type"
              ) ||
              card.getAttribute(
                "data-product"
              ) ||
              card.querySelector(
                "h3"
              )?.textContent ||
              "Produto OJOBOSCO";


            const fragrance =
              card.getAttribute(
                "data-fragrance"
              ) ||
              "";


            const size =
              card.getAttribute(
                "data-current-size"
              ) ||
              card.getAttribute(
                "data-size"
              ) ||
              "";


            const price =
              parseMoney(
                card.getAttribute(
                  "data-current-price"
                ) ||
                card.getAttribute(
                  "data-price"
                ) ||
                ""
              );


            const image =
              card.querySelector(
                "img"
              )?.getAttribute(
                "src"
              ) ||
              "";


            if (!price) {
              return;
            }


            addItemToCart({
              name:
                product,

              fragrance,

              size,

              price,

              image,

              quantity: 1
            });


            const originalText =
              button.textContent;


            button.textContent =
              "ADICIONADO";


            setTimeout(
              () => {

                button.textContent =
                  originalText;

              },
              1000
            );

          }
        );

      });

  }


  /* =========================================================
     PÁGINAS DE PRODUTO
  ========================================================= */

  function initProductDetailAddButton() {

    const button =
      document.querySelector(
        "#adicionarCarrinho, #addToCart, .produto-adicionar"
      );


    if (!button) {
      return;
    }


    button.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const productName =
          document.querySelector(
            ".produto-detalhe-nome, h1"
          )?.textContent
            ?.trim() ||
          "Produto OJOBOSCO";


        const fragrance =
          document.querySelector(
            "[data-selected-fragrance].active"
          )?.getAttribute(
            "data-selected-fragrance"
          ) ||
          document.querySelector(
            ".fragrancia-opcao.active"
          )?.textContent
            ?.trim() ||
          "";


        const activeSizeButton =
          document.querySelector(
            "[data-size].active"
          );


        const size =
          activeSizeButton
            ?.getAttribute(
              "data-size"
            ) ||
          "";


        let price =
          parseMoney(
            activeSizeButton
              ?.getAttribute(
                "data-price"
              )
          );


        if (!price) {

          price =
            parseMoney(
              document.querySelector(
                ".produto-detalhe-preco, .produto-preco, .product-price"
              )?.textContent
            );

        }


        const image =
          document.querySelector(
            ".produto-detalhe-imagem img, main img"
          )?.getAttribute(
            "src"
          ) ||
          "";


        if (!price) {
          return;
        }


        addItemToCart({
          name:
            productName,

          fragrance,

          size,

          price,

          image,

          quantity: 1
        });


        const originalText =
          button.textContent;


        button.textContent =
          "ADICIONADO AO CARRINHO";


        setTimeout(
          () => {

            button.textContent =
              originalText;

          },
          1000
        );

      }
    );

  }


  /* =========================================================
     MENU
  ========================================================= */

  function initMenu() {

    const button =
      document.querySelector(
        ".menu-button, #menuButton"
      );

    const menu =
      document.querySelector(
        ".menu-overlay, #menuOverlay"
      );


    if (
      !button ||
      !menu
    ) {
      return;
    }


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


    menu
      .querySelectorAll(
        "a"
      )
      .forEach(link => {

        link.addEventListener(
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

    const forms =
      document.querySelectorAll(
        ".newsletter-form"
      );


    forms.forEach(
      form => {

        form.addEventListener(
          "submit",
          event => {

            if (
              !form.getAttribute(
                "action"
              )
            ) {

              event.preventDefault();


              const message =
                form.querySelector(
                  ".newsletter-message"
                );


              if (message) {

                message.textContent =
                  "OBRIGADA POR ENTRAR NO UNIVERSO OJOBOSCO.";

              }

            }

          }
        );

      });

  }


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function init() {

    updateCartCount();

    initCartLinks();

    initMenu();

    initNewsletter();

    initStoreSizeButtons();

    initStoreAddButtons();

    initProductDetailAddButton();


    if (isCartPage()) {

      renderCartPage();

      initCartShipping();

      initCouponForm();

      initCheckoutButtons();

    }

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
