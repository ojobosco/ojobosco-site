(() => {
  "use strict";

  /* =========================================================
     OJOBOSCO — CONFIGURAÇÕES GERAIS
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
     CATÁLOGO DOS PRODUTOS
  ========================================================= */

  const PRODUCT_PRICES = {
    aromatizador: {
      "100": 179,
      "250": 209
    },

    difusor: {
      "100": 189,
      "250": 219
    },

    vela: {
      "200": 289
    },

    biblioteca: {
      "5": 239
    },

    perfume: {
      "100": 429
    }
  };


  const FRAGRANCES = {
    "cha-floral": "CHÁ FLORAL",
    "figo-tirio": "FIGO TÍRIO",
    "lavanda-rosada": "LAVANDA ROSADA",
    "limoeira": "LIMOEIRA",
    "verde-quente": "VERDE QUENTE",
    "orbe-amazonico": "ORBE AMAZÔNICO"
  };


  /* =========================================================
     INVENTÁRIO — CLOUDFLARE D1
  ========================================================= */

  const INVENTORY_API_URL =
    "/api/inventory";

  const inventoryBySku =
    new Map();

  let inventoryLoaded =
    false;


  function getInventorySku(
    product,
    fragrance,
    size
  ) {
    const normalizedProduct =
      normalizeText(
        product
      );

    const fragranceSlug =
      normalizeSlug(
        fragrance
      );

    const numericSize =
      onlyNumbers(
        size
      );

    const fragranceCodes = {
      "cha-floral": "CHA",
      "figo-tirio": "FIGO",
      "lavanda-rosada": "LAV",
      "limoeira": "LIM",
      "verde-quente": "VERDE",
      "orbe-amazonico": "ORBE"
    };

    const fragranceCode =
      fragranceCodes[
        fragranceSlug
      ] || "";


    if (
      normalizedProduct.includes(
        "BIBLIOTECA"
      )
    ) {
      return "BIBLIOTECA-6X5";
    }


    if (
      normalizedProduct.includes(
        "AROMATIZADOR"
      ) &&
      fragranceCode &&
      (
        numericSize === "100" ||
        numericSize === "250"
      )
    ) {
      return (
        "AROM-" +
        fragranceCode +
        "-" +
        numericSize
      );
    }


    if (
      normalizedProduct.includes(
        "DIFUSOR"
      ) &&
      fragranceCode &&
      (
        numericSize === "100" ||
        numericSize === "250"
      )
    ) {
      return (
        "DIF-" +
        fragranceCode +
        "-" +
        numericSize
      );
    }


    if (
      normalizedProduct.includes(
        "VELA"
      ) &&
      fragranceCode
    ) {
      return (
        "VELA-" +
        fragranceCode +
        "-200"
      );
    }


    return "";
  }


  function getInventoryRecord(
    product,
    fragrance,
    size
  ) {
    const sku =
      getInventorySku(
        product,
        fragrance,
        size
      );

    if (!sku) {
      return null;
    }

    return (
      inventoryBySku.get(
        sku
      ) ||
      null
    );
  }


  function getCartQuantityForSku(
    sku
  ) {
    if (!sku) {
      return 0;
    }

    return getCart().reduce(
      (
        total,
        item
      ) => {
        const itemSku =
          getInventorySku(
            getItemName(item),
            getItemFragrance(item),
            getItemSize(item)
          );

        if (
          itemSku !==
          sku
        ) {
          return total;
        }

        return (
          total +
          getItemQuantity(
            item
          )
        );
      },
      0
    );
  }


  function validateCartAgainstInventory(
    cart
  ) {
    if (!inventoryLoaded) {
      return {
        ok: true
      };
    }

    const quantities =
      new Map();

    for (const item of cart) {
      const sku =
        getInventorySku(
          getItemName(item),
          getItemFragrance(item),
          getItemSize(item)
        );

      if (!sku) {
        continue;
      }

      quantities.set(
        sku,
        (
          quantities.get(
            sku
          ) ||
          0
        ) +
        getItemQuantity(
          item
        )
      );
    }

    for (
      const [
        sku,
        quantity
      ]
      of quantities.entries()
    ) {
      const record =
        inventoryBySku.get(
          sku
        );

      if (!record) {
        continue;
      }

      const stock =
        Number(
          record.stock ||
          0
        );

      const active =
        Number(
          record.active ||
          0
        ) === 1;

      if (
        !active ||
        stock <= 0
      ) {
        return {
          ok: false,
          message:
            "UM DOS ITENS DO CARRINHO ESTÁ ESGOTADO."
        };
      }

      if (
        quantity >
        stock
      ) {
        return {
          ok: false,
          message:
            `ESTOQUE DISPONÍVEL: ${stock} UNIDADE${stock === 1 ? "" : "S"}.`
        };
      }
    }

    return {
      ok: true
    };
  }


  async function loadInventory() {
    try {
      const response =
        await fetch(
          INVENTORY_API_URL,
          {
            method: "GET",
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível consultar o inventário."
        );
      }

      const data =
        await response.json();

      const items =
        Array.isArray(
          data?.items
        )
          ? data.items
          : [];

      inventoryBySku.clear();

      items.forEach(
        (item) => {
          if (!item?.sku) {
            return;
          }

          inventoryBySku.set(
            String(
              item.sku
            ),
            {
              ...item,

              stock:
                Number(
                  item.stock ||
                  0
                ),

              active:
                Number(
                  item.active ||
                  0
                )
            }
          );
        }
      );

      inventoryLoaded =
        true;

    } catch (error) {
      console.error(
        "Inventory load error:",
        error
      );

      inventoryLoaded =
        false;
    }
  }


  function getInventoryStatusText(
    record
  ) {
    if (!record) {
      return "";
    }

    const stock =
      Number(
        record.stock ||
        0
      );

    const active =
      Number(
        record.active ||
        0
      ) === 1;

    if (
      !active ||
      stock <= 0
    ) {
      return "ESGOTADO";
    }

    if (stock === 1) {
      return "ÚLTIMA UNIDADE";
    }

    return "DISPONÍVEL";
  }


  function ensureInventoryStatusElement(
    scope,
    addButton
  ) {
    if (!scope) {
      return null;
    }

    let status =
      scope.querySelector(
        ".inventory-status"
      );

    if (!status) {
      status =
        document.createElement(
          "p"
        );

      status.className =
        "inventory-status";

      status.style.margin =
        "14px 0";

      status.style.fontSize =
        "9px";

      status.style.lineHeight =
        "1.5";

      status.style.letterSpacing =
        "0.18em";

      status.style.textTransform =
        "uppercase";

      status.style.opacity =
        "0.72";

      if (
        addButton &&
        addButton.parentNode
      ) {
        addButton.parentNode.insertBefore(
          status,
          addButton
        );
      } else {
        scope.appendChild(
          status
        );
      }
    }

    return status;
  }


  function applyInventoryStatusToButton(
    addButton,
    record
  ) {
    if (!addButton) {
      return;
    }

    if (
      !addButton.dataset
        .inventoryDefaultLabel
    ) {
      addButton.dataset
        .inventoryDefaultLabel =
        addButton.textContent
          .trim();
    }

    if (!record) {
      addButton.disabled =
        false;

      addButton.textContent =
        addButton.dataset
          .inventoryDefaultLabel;

      return;
    }

    const stock =
      Number(
        record.stock ||
        0
      );

    const active =
      Number(
        record.active ||
        0
      ) === 1;

    const soldOut =
      !active ||
      stock <= 0;

    addButton.disabled =
      soldOut;

    addButton.setAttribute(
      "aria-disabled",
      soldOut
        ? "true"
        : "false"
    );

    addButton.textContent =
      soldOut
        ? "ESGOTADO"
        : addButton.dataset
            .inventoryDefaultLabel;
  }


  function updateProductDetailInventoryStatus(
    productType,
    fragrance,
    size
  ) {
    const scope =
      document.querySelector(
        ".produto-detalhe-info"
      ) ||
      document.querySelector(
        "[data-detail-product]"
      ) ||
      document.body;

    const addButton =
      document.querySelector(
        ".produto-adicionar, #adicionarCarrinho, #addToCart, [data-product-add]"
      );

    if (
      !scope ||
      !addButton
    ) {
      return;
    }

    let productName =
      productType;

    if (
      productType ===
      "aromatizador"
    ) {
      productName =
        "AROMATIZADOR";
    }

    if (
      productType ===
      "difusor"
    ) {
      productName =
        "DIFUSOR";
    }

    if (
      productType ===
      "vela"
    ) {
      productName =
        "VELA";
    }

    if (
      productType ===
      "biblioteca"
    ) {
      productName =
        "BIBLIOTECA OLFATIVA";
    }

    const fragranceName =
      FRAGRANCES[
        normalizeSlug(
          fragrance
        )
      ] ||
      fragrance ||
      "";

    let displaySize =
      size;

    if (
      productType ===
      "vela"
    ) {
      displaySize =
        "200 G";
    } else if (
      productType ===
      "biblioteca"
    ) {
      displaySize =
        "6 × 5 ML";
    } else if (size) {
      displaySize =
        size +
        " ML";
    }

    const record =
      getInventoryRecord(
        productName,
        fragranceName,
        displaySize
      );

    const status =
      ensureInventoryStatusElement(
        scope,
        addButton
      );

    if (status) {
      status.textContent =
        getInventoryStatusText(
          record
        );

      status.style.display =
        record
          ? "block"
          : "none";
    }

    applyInventoryStatusToButton(
      addButton,
      record
    );
  }


  function updateStoreCardInventoryStatus(
    card
  ) {
    if (!card) {
      return;
    }

    const addButton =
      card.querySelector(
        ".adicionar-card-btn, [data-add-cart]"
      );

    if (!addButton) {
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
      "";

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

    const record =
      getInventoryRecord(
        product,
        fragrance,
        size
      );

    const status =
      ensureInventoryStatusElement(
        card,
        addButton
      );

    if (status) {
      status.textContent =
        getInventoryStatusText(
          record
        );

      status.style.display =
        record
          ? "block"
          : "none";
    }

    applyInventoryStatusToButton(
      addButton,
      record
    );
  }


  function updateAllInventoryUI() {
    const productType =
      getCurrentDetailProductType();

    if (productType) {
      const detailContainer =
        document.querySelector(
          "[data-detail-product]"
        ) ||
        document.body;

      const fragrance =
        detailContainer.getAttribute(
          "data-current-fragrance"
        ) ||
        document
          .querySelector(
            ".produto-fragrancia-btn.active[data-fragrance]"
          )
          ?.getAttribute(
            "data-fragrance"
          ) ||
        "";

      const size =
        detailContainer.getAttribute(
          "data-current-size"
        ) ||
        document
          .querySelector(
            ".produto-tamanho-btn.active[data-size]"
          )
          ?.getAttribute(
            "data-size"
          ) ||
        "";

      updateProductDetailInventoryStatus(
        productType,
        fragrance,
        size
      );
    }

    document
      .querySelectorAll(
        ".produto-loja-card, .produto-card, .loja-card, [data-product-type]"
      )
      .forEach(
        updateStoreCardInventoryStatus
      );
  }


  function initInventoryDynamicControls() {
    document.addEventListener(
      "click",
      (event) => {
        if (
          !event.target.closest(
            ".produto-fragrancia-btn, .produto-tamanho-btn, .variacao-btn, .size-btn, .fragrancia-loja-btn"
          )
        ) {
          return;
        }

        setTimeout(
          updateAllInventoryUI,
          0
        );
      }
    );
  }


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


  function normalizeSlug(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }


  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }


  function formatCEP(value) {
    const numbers = onlyNumbers(value).slice(0, 8);

    if (numbers.length <= 5) {
      return numbers;
    }

    return (
      numbers.slice(0, 5) +
      "-" +
      numbers.slice(5)
    );
  }


  function parseMoney(value) {
    if (typeof value === "number") {
      return Number.isFinite(value)
        ? value
        : 0;
    }

    if (!value) {
      return 0;
    }

    let text = String(value)
      .replace(/[^\d,.-]/g, "");

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


  function formatBRL(value) {
    return Number(value || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );
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
     NAVEGAÇÃO GLOBAL
  ========================================================= */

  function normalizeNavigationLinks() {
    const links =
      document.querySelectorAll("a");

    links.forEach((link) => {
      const label = String(
        link.textContent || ""
      )
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
          link.href =
            "https://www.instagram.com/ojobosco/";

          link.target = "_blank";

          link.rel =
            "noopener noreferrer";
          break;

        case "ENVIOS":
          link.href = "envios.html";
          break;

        case "TROCAS":
          link.href = "trocas.html";
          break;

        case "PRIVACIDADE":
          link.href =
            "privacidade.html";
          break;

        case "CARRINHO":
          link.href =
            "carrinho.html";
          break;
      }
    });
  }


  /* =========================================================
     MENU LATERAL
  ========================================================= */

  function initMenu() {
    const menuToggle =
      document.getElementById(
        "menuToggle"
      );

    const sideMenu =
      document.getElementById(
        "sideMenu"
      );

    const closeMenu =
      document.getElementById(
        "closeMenu"
      );

    const menuOverlay =
      document.getElementById(
        "menuOverlay"
      );


    if (
      !menuToggle ||
      !sideMenu
    ) {
      return;
    }


    function openMenu() {
      sideMenu.classList.add(
        "active"
      );

      sideMenu.classList.add(
        "open"
      );

      if (menuOverlay) {
        menuOverlay.classList.add(
          "active"
        );
      }

      document.body.classList.add(
        "menu-open"
      );

      menuToggle.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    function closeSideMenu() {
      sideMenu.classList.remove(
        "active"
      );

      sideMenu.classList.remove(
        "open"
      );

      if (menuOverlay) {
        menuOverlay.classList.remove(
          "active"
        );
      }

      document.body.classList.remove(
        "menu-open"
      );

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }


    menuToggle.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (
          sideMenu.classList.contains(
            "active"
          ) ||
          sideMenu.classList.contains(
            "open"
          )
        ) {
          closeSideMenu();
        } else {
          openMenu();
        }
      }
    );


    if (closeMenu) {
      closeMenu.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          closeSideMenu();
        }
      );
    }


    if (menuOverlay) {
      menuOverlay.addEventListener(
        "click",
        closeSideMenu
      );
    }


    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeSideMenu();
        }
      }
    );
  }


  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function getCart() {
    try {
      const data =
        JSON.parse(
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
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );

    updateCartCount();

    updateAllInventoryUI();
  }


  function getCoupon() {
    try {
      const raw =
        localStorage.getItem(
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

      if (
        typeof data ===
        "string"
      ) {
        const code =
          normalizeText(data);

        return VALID_COUPONS[code]
          ? {
              code,
              discount:
                VALID_COUPONS[
                  code
                ].discount
            }
          : null;
      }

      const code =
        normalizeText(
          data?.code ||
          data?.coupon ||
          ""
        );

      return VALID_COUPONS[code]
        ? {
            code,
            discount:
              VALID_COUPONS[
                code
              ].discount
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
      const data =
        JSON.parse(
          localStorage.getItem(
            SHIPPING_STORAGE_KEY
          ) || "null"
        );

      return data &&
        data.cep
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
     CARRINHO — HELPERS
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
    const quantity =
      Number(
        item.quantity ??
        item.qty ??
        1
      );

    return (
      Number.isFinite(quantity) &&
      quantity > 0
    )
      ? quantity
      : 1;
  }


  function createCartKey(item) {
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


  function addItemToCart(item) {
    const cart =
      getCart();

    const key =
      createCartKey(item);

    const existing =
      cart.find(
        (currentItem) =>
          createCartKey(
            currentItem
          ) === key
      );

    const sku =
      getInventorySku(
        getItemName(item),
        getItemFragrance(item),
        getItemSize(item)
      );

    const inventoryRecord =
      sku
        ? inventoryBySku.get(
            sku
          )
        : null;

    const requestedQuantity =
      getItemQuantity(
        item
      );

    const existingQuantity =
      existing
        ? getItemQuantity(
            existing
          )
        : 0;


    if (inventoryRecord) {
      const stock =
        Number(
          inventoryRecord.stock ||
          0
        );

      const active =
        Number(
          inventoryRecord.active ||
          0
        ) === 1;

      if (
        !active ||
        stock <= 0
      ) {
        return {
          ok: false,
          reason:
            "sold_out",
          available:
            0
        };
      }

      if (
        existingQuantity +
        requestedQuantity >
        stock
      ) {
        return {
          ok: false,
          reason:
            "stock_limit",
          available:
            stock
        };
      }
    }


    if (existing) {
      existing.quantity =
        existingQuantity +
        requestedQuantity;

    } else {
      cart.push({
        name:
          getItemName(item),

        product:
          getItemName(item),

        fragrance:
          getItemFragrance(item),

        size:
          getItemSize(item),

        price:
          getItemPrice(item),

        image:
          getItemImage(item),

        quantity:
          requestedQuantity
      });
    }

    saveCart(cart);

    return {
      ok: true
    };
  }


  function updateCartCount() {
    const cart =
      getCart();

    const count =
      cart.reduce(
        (total, item) =>
          total +
          getItemQuantity(item),
        0
      );

    document
      .querySelectorAll(
        "#cartCount, .cart-count, [data-cart-count]"
      )
      .forEach(
        (counter) => {
          counter.textContent =
            String(count);
        }
      );
  }


  /* =========================================================
     LINK CARRINHO
  ========================================================= */

  function initCartLinks() {
    document
      .querySelectorAll(
        "#cartButton, .cart-link, [data-cart-link]"
      )
      .forEach(
        (link) => {
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


  /* =========================================================
     IDENTIFICAR PÁGINA DE PRODUTO
  ========================================================= */

  function getCurrentDetailProductType() {
    const body =
      document.body;

    const container =
      document.querySelector(
        "[data-detail-product]"
      );

    const explicit =
      container?.getAttribute(
        "data-detail-product"
      ) ||
      body.getAttribute(
        "data-detail-product"
      ) ||
      body.getAttribute(
        "data-product-type"
      );

    if (explicit) {
      return normalizeSlug(
        explicit
      );
    }

    const pathname =
      window.location.pathname
        .toLowerCase();

    if (
      pathname.includes(
        "produto-aromatizador"
      )
    ) {
      return "aromatizador";
    }

    if (
      pathname.includes(
        "produto-difusor"
      )
    ) {
      return "difusor";
    }

    if (
      pathname.includes(
        "produto-vela"
      )
    ) {
      return "vela";
    }

    if (
      pathname.includes(
        "produto-biblioteca"
      )
    ) {
      return "biblioteca";
    }

    if (
      pathname.includes(
        "produto-perfume"
      )
    ) {
      return "perfume";
    }

    return "";
  }


  /* =========================================================
     IMAGEM DO PRODUTO
  ========================================================= */

  function getDetailImageFile(
    productType,
    fragrance,
    size
  ) {
    if (
      productType ===
      "aromatizador"
    ) {
      return (
        "aromatizador-" +
        fragrance +
        "-" +
        size +
        ".jpg"
      );
    }

    if (
      productType ===
      "difusor"
    ) {
      return (
        "difusor-" +
        fragrance +
        "-" +
        size +
        ".jpg"
      );
    }

    if (
      productType ===
      "vela"
    ) {
      return "vela-produto.jpg";
    }

    if (
      productType ===
      "biblioteca"
    ) {
      return "biblioteca-still.jpg";
    }

    if (
      productType ===
      "perfume"
    ) {
      return "perfume-cedro-solar.jpg";
    }

    return "";
  }


  /* =========================================================
     PREÇO DO PRODUTO
  ========================================================= */

  function getDetailProductPrice(
    productType,
    size
  ) {
    const prices =
      PRODUCT_PRICES[
        productType
      ];

    if (!prices) {
      return 0;
    }

    if (
      prices[size] !==
      undefined
    ) {
      return prices[size];
    }

    const first =
      Object.values(
        prices
      )[0];

    return first || 0;
  }


  /* =========================================================
     PÁGINA DE PRODUTO — CONTROLES
  ========================================================= */

  function initProductDetailControls() {
    const productType =
      getCurrentDetailProductType();

    if (!productType) {
      return;
    }


    const image =
      document.getElementById(
        "productDetailImage"
      ) ||
      document.querySelector(
        ".produto-detalhe-foto img"
      );


    const price =
      document.getElementById(
        "productDetailPrice"
      ) ||
      document.querySelector(
        ".produto-detalhe-preco"
      );


    const fragranceName =
      document.getElementById(
        "productFragranceName"
      ) ||
      document.querySelector(
        ".produto-fragrancia-nome"
      );


    const fragranceButtons =
      document.querySelectorAll(
        ".produto-fragrancia-btn[data-fragrance]"
      );


    const sizeButtons =
      document.querySelectorAll(
        ".produto-tamanho-btn[data-size]"
      );


    const panels =
      document.querySelectorAll(
        "[data-fragrance-panel]"
      );


    let currentFragrance = "";

    let currentSize = "";


    const activeSizeButton =
      document.querySelector(
        ".produto-tamanho-btn.active[data-size]"
      );


    if (activeSizeButton) {
      currentSize =
        String(
          activeSizeButton.getAttribute(
            "data-size"
          ) || ""
        )
          .replace(/\D/g, "");
    }


    if (!currentSize) {
      if (
        productType ===
        "aromatizador" ||
        productType ===
        "difusor" ||
        productType ===
        "perfume"
      ) {
        currentSize = "100";

      } else if (
        productType ===
        "vela"
      ) {
        currentSize = "200";

      } else if (
        productType ===
        "biblioteca"
      ) {
        currentSize = "5";
      }
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const queryFragrance =
      normalizeSlug(
        params.get(
          "fragrancia"
        ) || ""
      );


    if (
      queryFragrance &&
      FRAGRANCES[
        queryFragrance
      ]
    ) {
      currentFragrance =
        queryFragrance;
    }


    if (!currentFragrance) {
      const activeFragranceButton =
        document.querySelector(
          ".produto-fragrancia-btn.active[data-fragrance]"
        );

      if (
        activeFragranceButton
      ) {
        currentFragrance =
          normalizeSlug(
            activeFragranceButton
              .getAttribute(
                "data-fragrance"
              )
          );
      }
    }


    if (
      !currentFragrance &&
      (
        productType ===
        "aromatizador" ||
        productType ===
        "difusor" ||
        productType ===
        "vela"
      )
    ) {
      currentFragrance =
        "cha-floral";
    }


    if (
      productType ===
      "perfume"
    ) {
      currentFragrance =
        "cedro-solar";
    }


    function updateDetailPage({
      updateUrl = true
    } = {}) {

      if (
        fragranceName &&
        FRAGRANCES[
          currentFragrance
        ]
      ) {
        fragranceName.textContent =
          FRAGRANCES[
            currentFragrance
          ];
      }


      fragranceButtons.forEach(
        (button) => {
          const slug =
            normalizeSlug(
              button.getAttribute(
                "data-fragrance"
              )
            );

          button.classList.toggle(
            "active",
            slug ===
              currentFragrance
          );
        }
      );


      sizeButtons.forEach(
        (button) => {
          const size =
            String(
              button.getAttribute(
                "data-size"
              ) || ""
            ).replace(
              /\D/g,
              ""
            );

          button.classList.toggle(
            "active",
            size ===
              currentSize
          );
        }
      );


      panels.forEach(
        (panel) => {
          const slug =
            normalizeSlug(
              panel.getAttribute(
                "data-fragrance-panel"
              )
            );

          panel.classList.toggle(
            "active",
            slug ===
              currentFragrance
          );
        }
      );


      const currentPrice =
        getDetailProductPrice(
          productType,
          currentSize
        );

      if (
        price &&
        currentPrice
      ) {
        price.textContent =
          formatBRL(
            currentPrice
          );
      }


      if (image) {
        let imageFile = "";

        const detailContainer =
          document.querySelector(
            "[data-detail-product]"
          ) ||
          document.body;


        const specificImage =
          detailContainer.getAttribute(
            "data-image-" +
            currentSize
          );


        if (specificImage) {
          imageFile =
            specificImage;
        } else {
          imageFile =
            getDetailImageFile(
              productType,
              currentFragrance,
              currentSize
            );
        }


        if (imageFile) {
          image.src =
            imageFile;
        }
      }


      const detailContainer =
        document.querySelector(
          "[data-detail-product]"
        ) ||
        document.body;


      detailContainer.setAttribute(
        "data-current-size",
        currentSize
      );


      detailContainer.setAttribute(
        "data-current-fragrance",
        currentFragrance
      );


      detailContainer.setAttribute(
        "data-current-price",
        String(
          currentPrice
        )
      );


      if (image) {
        detailContainer.setAttribute(
          "data-current-image",
          image.getAttribute(
            "src"
          ) || ""
        );
      }


      updateProductDetailInventoryStatus(
        productType,
        currentFragrance,
        currentSize
      );


      if (
        updateUrl &&
        currentFragrance &&
        (
          productType ===
          "aromatizador" ||
          productType ===
          "difusor"
        )
      ) {
        const newUrl =
          new URL(
            window.location.href
          );

        newUrl.searchParams.set(
          "fragrancia",
          currentFragrance
        );

        window.history.replaceState(
          {},
          "",
          newUrl
        );
      }
    }


    fragranceButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            const fragrance =
              normalizeSlug(
                button.getAttribute(
                  "data-fragrance"
                )
              );

            if (!fragrance) {
              return;
            }

            currentFragrance =
              fragrance;

            updateDetailPage();
          }
        );
      }
    );


    sizeButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            const size =
              String(
                button.getAttribute(
                  "data-size"
                ) || ""
              )
                .replace(
                  /\D/g,
                  ""
                );

            if (!size) {
              return;
            }

            currentSize = size;

            updateDetailPage({
              updateUrl:
                false
            });
          }
        );
      }
    );


    updateDetailPage({
      updateUrl:
        false
    });
  }


  /* =========================================================
     ADICIONAR PRODUTO DA PÁGINA AO CARRINHO
  ========================================================= */

  function initProductPageAddToCart() {
    const addButton =
      document.querySelector(
        ".produto-adicionar, #adicionarCarrinho, #addToCart, [data-product-add]"
      );

    if (!addButton) {
      return;
    }


    addButton.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        const productType =
          getCurrentDetailProductType();

        const detailContainer =
          document.querySelector(
            "[data-detail-product]"
          ) ||
          document.body;


        const size =
          detailContainer.getAttribute(
            "data-current-size"
          ) ||
          document
            .querySelector(
              ".produto-tamanho-btn.active[data-size]"
            )
            ?.getAttribute(
              "data-size"
            ) ||
          "";


        const fragranceSlug =
          detailContainer.getAttribute(
            "data-current-fragrance"
          ) ||
          document
            .querySelector(
              ".produto-fragrancia-btn.active[data-fragrance]"
            )
            ?.getAttribute(
              "data-fragrance"
            ) ||
          "";


        const price =
          parseMoney(
            detailContainer.getAttribute(
              "data-current-price"
            ) ||
            document.querySelector(
              ".produto-detalhe-preco"
            )?.textContent ||
            0
          );


        const image =
          detailContainer.getAttribute(
            "data-current-image"
          ) ||
          document.querySelector(
            ".produto-detalhe-foto img"
          )?.getAttribute(
            "src"
          ) ||
          "";


        let productName =
          productType;


        if (
          productType ===
          "aromatizador"
        ) {
          productName =
            "AROMATIZADOR";
        }


        if (
          productType ===
          "difusor"
        ) {
          productName =
            "DIFUSOR";
        }


        if (
          productType ===
          "vela"
        ) {
          productName =
            "VELA";
        }


        if (
          productType ===
          "biblioteca"
        ) {
          productName =
            "BIBLIOTECA OLFATIVA";
        }


        if (
          productType ===
          "perfume"
        ) {
          productName =
            "PERFUME";
        }


        let fragrance =
          FRAGRANCES[
            normalizeSlug(
              fragranceSlug
            )
          ] ||
          "";


        if (
          productType ===
          "perfume"
        ) {
          fragrance =
            "CEDRO SOLAR";
        }


        const cartSize =
          productType ===
          "vela"
            ? "200 G"
            : (
                productType ===
                "biblioteca"
                  ? "6 × 5 ML"
                  : (
                      size
                        ? size + " ML"
                        : ""
                    )
              );


        const addResult =
          addItemToCart({
            name:
              productName,

            product:
              productName,

            fragrance,

            size:
              cartSize,

            price,

            image,

            quantity: 1
          });


        const original =
          addButton.textContent;


        if (
          !addResult?.ok
        ) {
          addButton.textContent =
            addResult?.reason ===
            "sold_out"
              ? "ESGOTADO"
              : "LIMITE DE ESTOQUE";

          setTimeout(
            () => {
              updateAllInventoryUI();
            },
            1400
          );

          return;
        }


        addButton.textContent =
          "ADICIONADO AO CARRINHO";


        setTimeout(
          () => {
            addButton.textContent =
              original;
          },
          1400
        );
      }
    );
  }


  /* =========================================================
     LOJA — VARIAÇÕES 100 / 250
  ========================================================= */

  function initStoreVariationButtons() {
    const cards =
      document.querySelectorAll(
        ".produto-loja-card, .produto-card, .loja-card, [data-product-type]"
      );


    cards.forEach(
      (card) => {
        const buttons =
          card.querySelectorAll(
            ".variacao-btn[data-size], .size-btn[data-size]"
          );


        buttons.forEach(
          (button) => {
            button.addEventListener(
              "click",
              (event) => {
                event.preventDefault();
                event.stopPropagation();

                const size =
                  String(
                    button.getAttribute(
                      "data-size"
                    ) || ""
                  )
                    .replace(
                      /\D/g,
                      ""
                    );


                if (!size) {
                  return;
                }


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


                const image =
                  card.querySelector(
                    "img"
                  );


                const price =
                  card.querySelector(
                    ".produto-loja-preco, .produto-preco, .product-price, .price, .preco"
                  );


                if (
                  newImage &&
                  image
                ) {
                  image.src =
                    newImage;
                }


                if (
                  newPrice &&
                  price
                ) {
                  price.textContent =
                    formatBRL(
                      parseMoney(
                        newPrice
                      )
                    );
                }


                card.setAttribute(
                  "data-current-size",
                  size
                );


                if (newPrice) {
                  card.setAttribute(
                    "data-current-price",
                    String(
                      parseMoney(
                        newPrice
                      )
                    )
                  );
                }


                if (newImage) {
                  card.setAttribute(
                    "data-current-image",
                    newImage
                  );
                }


                buttons.forEach(
                  (current) => {
                    current.classList.remove(
                      "active"
                    );
                  }
                );


                button.classList.add(
                  "active"
                );

                updateStoreCardInventoryStatus(
                  card
                );
              }
            );
          }
        );
      }
    );
  }


  /* =========================================================
     LOJA — CARDS CLICÁVEIS
  ========================================================= */

  function initStoreProductLinks() {
    const cards =
      document.querySelectorAll(
        ".produto-loja-card, .produto-card, .product-card, .loja-card"
      );


    cards.forEach(
      (card) => {
        const mainLink =
          card.querySelector(
            "a.produto-link, a.product-link, a[href*='produto-']"
          );

        if (!mainLink) {
          return;
        }


        card.style.cursor =
          "pointer";


        card.addEventListener(
          "click",
          (event) => {
            const interactive =
              event.target.closest(
                "button, input, select, textarea, a"
              );


            if (interactive) {
              return;
            }


            window.location.href =
              mainLink.href;
          }
        );
      }
    );
  }


  /* =========================================================
     LOJA — ADICIONAR AO CARRINHO
  ========================================================= */

  function initStoreAddButtons() {
    document
      .querySelectorAll(
        ".adicionar-card-btn, [data-add-cart]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            (event) => {
              event.preventDefault();
              event.stopPropagation();

              const card =
                button.closest(
                  ".produto-loja-card, .produto-card, .loja-card, [data-product-type], [data-fragrance]"
                );


              if (!card) {
                return;
              }


              const image =
                card.querySelector(
                  "img"
                );


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
                "";


              let price =
                card.getAttribute(
                  "data-current-price"
                );


              if (!price) {
                const priceElement =
                  card.querySelector(
                    ".produto-loja-preco, .produto-preco, .product-price, .price, .preco"
                  );


                price =
                  priceElement
                    ? parseMoney(
                        priceElement.textContent
                      )
                    : 0;
              }


              const addResult =
                addItemToCart({
                  name: product,
                  product,
                  fragrance,
                  size,
                  price:
                    parseMoney(
                      price
                    ),
                  image:
                    image
                      ? image.getAttribute(
                          "src"
                        )
                      : "",
                  quantity: 1
                });


              const originalText =
                button.textContent;


              if (
                !addResult?.ok
              ) {
                button.textContent =
                  addResult?.reason ===
                  "sold_out"
                    ? "ESGOTADO"
                    : "LIMITE DE ESTOQUE";

                setTimeout(
                  () => {
                    updateStoreCardInventoryStatus(
                      card
                    );
                  },
                  1200
                );

                return;
              }


              button.textContent =
                "ADICIONADO";


              setTimeout(
                () => {
                  button.textContent =
                    originalText;
                },
                1200
              );
            }
          );
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


    return prices[
      region
    ] ?? 0;
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
      cep:
        normalizedCEP,

      street:
        data.logradouro ||
        "",

      district:
        data.bairro ||
        "",

      city:
        data.localidade ||
        "",

      state:
        data.uf ||
        "",

      region,

      price,

      originalPrice:
        price
    };
  }


  /* =========================================================
     CARRINHO — TOTAIS
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
            getItemPrice(
              item
            ) *
            getItemQuantity(
              item
            )
          ),
        0
      );


    const discount =
      coupon
        ? (
            subtotal *
            (
              coupon.discount /
              100
            )
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
        shipping =
          originalShipping;

      } else if (
        subtotal >=
        FREE_SHIPPING_THRESHOLD
      ) {
        shipping = 0;

      } else {
        shipping =
          originalShipping;
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
     ELEMENTOS DO CARRINHO
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


  /* =========================================================
     RENDERIZAR CARRINHO
  ========================================================= */

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


    elements.items.innerHTML =
      "";


    if (elements.title) {
      const count =
        cart.reduce(
          (total, item) =>
            total +
            getItemQuantity(
              item
            ),
          0
        );


      elements.title.textContent =
        `CARRINHO DE COMPRAS [${count}]`;
    }


    if (
      cart.length === 0
    ) {
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
            getItemImage(
              item
            );


          const name =
            getItemName(
              item
            );


          const fragrance =
            getItemFragrance(
              item
            );


          const size =
            getItemSize(
              item
            );


          const quantity =
            getItemQuantity(
              item
            );


          const unitPrice =
            getItemPrice(
              item
            );


          const inventoryRecord =
            getInventoryRecord(
              name,
              fragrance,
              size
            );


          const inventoryStock =
            inventoryRecord
              ? Number(
                  inventoryRecord.stock ||
                  0
                )
              : null;


          const plusDisabled =
            inventoryRecord &&
            quantity >=
              inventoryStock;


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
                  ${plusDisabled ? "disabled" : ""}
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
          ? (
              "- " +
              formatBRL(
                totals.discount
              )
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
          ? (
              `CUPOM ${coupon.code} APLICADO — ${coupon.discount}% DE DESCONTO. CUPOM NÃO É CUMULATIVO COM FRETE GRÁTIS.`
            )
          : "";
    }


    bindCartPageEvents();
  }


  /* =========================================================
     EVENTOS DO CARRINHO
  ========================================================= */

  function bindCartPageEvents() {
    document
      .querySelectorAll(
        "[data-cart-plus]"
      )
      .forEach(
        (button) => {
          button.onclick =
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


              const inventoryRecord =
                getInventoryRecord(
                  getItemName(
                    cart[index]
                  ),
                  getItemFragrance(
                    cart[index]
                  ),
                  getItemSize(
                    cart[index]
                  )
                );


              const currentQuantity =
                getItemQuantity(
                  cart[index]
                );


              if (
                inventoryRecord &&
                currentQuantity >=
                  Number(
                    inventoryRecord.stock ||
                    0
                  )
              ) {
                return;
              }


              cart[index].quantity =
                currentQuantity + 1;


              saveCart(cart);

              renderCartPage();
            };
        }
      );


    document
      .querySelectorAll(
        "[data-cart-minus]"
      )
      .forEach(
        (button) => {
          button.onclick =
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
                getItemQuantity(
                  cart[index]
                );


              if (
                quantity <= 1
              ) {
                return;
              }


              cart[index].quantity =
                quantity - 1;


              saveCart(cart);

              renderCartPage();
            };
        }
      );


    document
      .querySelectorAll(
        "[data-cart-remove]"
      )
      .forEach(
        (button) => {
          button.onclick =
            () => {
              const index =
                Number(
                  button.getAttribute(
                    "data-cart-remove"
                  )
                );


              const cart =
                getCart();


              cart.splice(
                index,
                1
              );


              saveCart(cart);

              renderCartPage();
            };
        }
      );


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


    if (
      elements.shippingButton
    ) {
      elements.shippingButton.onclick =
        async () => {
          if (!elements.cepInput) {
            return;
          }


          const cep =
            onlyNumbers(
              elements.cepInput.value
            );


          if (
            cep.length !== 8
          ) {
            if (
              elements.shippingMessage
            ) {
              elements.shippingMessage.textContent =
                "INFORME UM CEP VÁLIDO.";
            }

            return;
          }


          const originalText =
            elements.shippingButton
              .textContent;


          elements.shippingButton.disabled =
            true;


          elements.shippingButton.textContent =
            "CALCULANDO...";


          try {
            const shipping =
              await lookupCEP(
                cep
              );


            saveShipping(
              shipping
            );


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


    if (
      elements.couponButton
    ) {
      elements.couponButton.onclick =
        () => {
          if (
            !elements.couponInput
          ) {
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
            VALID_COUPONS[
              code
            ];


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
            code:
              coupon.code,

            discount:
              coupon.discount
          });


          renderCartPage();
        };
    }


    elements.checkoutButtons
      .forEach(
        (button) => {
          button.onclick =
            () => {
              const cart =
                getCart();


              if (!cart.length) {
                return;
              }


              const inventoryValidation =
                validateCartAgainstInventory(
                  cart
                );


              if (
                !inventoryValidation.ok
              ) {
                if (
                  elements.shippingMessage
                ) {
                  elements.shippingMessage.textContent =
                    inventoryValidation.message;
                }

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
     NEWSLETTER
  ========================================================= */

  function initNewsletter() {
    const form =
      document.getElementById(
        "newsletterForm"
      );


    const email =
      document.getElementById(
        "newsletterEmail"
      );


    const success =
      document.getElementById(
        "newsletterSuccess"
      );


    if (
      form &&
      email
    ) {
      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          if (
            !email.value.trim()
          ) {
            return;
          }


          if (success) {
            success.classList.add(
              "visible"
            );
          }


          email.value = "";
        }
      );
    }


    document
      .querySelectorAll(
        ".newsletter-form[data-newsletter-form]"
      )
      .forEach(
        (otherForm) => {
          otherForm.addEventListener(
            "submit",
            (event) => {
              event.preventDefault();
            }
          );
        }
      );
  }


  /* =========================================================
     ÂNCORAS DA LOJA
  ========================================================= */

  function scrollToStoreHash() {
    if (
      !window.location.hash
    ) {
      return;
    }


    const target =
      document.querySelector(
        window.location.hash
      );


    if (!target) {
      return;
    }


    setTimeout(
      () => {
        target.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });
      },
      100
    );
  }


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {
    normalizeNavigationLinks();

    initMenu();

    updateCartCount();

    initCartLinks();

    await loadInventory();

    initProductDetailControls();

    initProductPageAddToCart();

    initStoreVariationButtons();

    initStoreProductLinks();

    initStoreAddButtons();

    initInventoryDynamicControls();

    updateAllInventoryUI();

    initNewsletter();

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
