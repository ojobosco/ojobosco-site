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


/* =========================
   MENU
========================= */

if (
  menuToggle &&
  sideMenu
) {

  menuToggle.addEventListener(
    "click",
    () => {

      sideMenu
        .classList
        .add("open");

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
        .remove("open");

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
            .remove("open");

          document
            .body
            .style
            .overflow = "";

        }
      );

    }
  );


/* =========================
   NEWSLETTER
========================= */

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
        .add("visible");

    }
  );

}


/* =========================
   FAMÍLIAS OLFATIVAS
========================= */

const familyCards =
  document.querySelectorAll(
    ".familia-card"
  );


familyCards.forEach(
  (card) => {

    card.addEventListener(
      "click",
      () => {

        familyCards.forEach(
          (item) => {

            item.classList.remove(
              "active"
            );

          }
        );

        card.classList.add(
          "active"
        );

      }
    );

  }
);


/* =========================
   VARIAÇÕES
========================= */

document
  .querySelectorAll(
    ".objeto-card"
  )
  .forEach(
    (card) => {

      const variations =
        card.querySelectorAll(
          ".variacao"
        );


      variations.forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              variations.forEach(
                (item) => {

                  item.classList.remove(
                    "active"
                  );

                }
              );

              button.classList.add(
                "active"
              );

            }
          );

        }
      );

    }
  );


/* =========================
   CARRINHO LOCAL
========================= */

function getCart() {

  const storedCart =
    localStorage.getItem(
      "ojobosco-cart"
    );

  if (!storedCart) {
    return [];
  }

  try {

    return JSON.parse(
      storedCart
    );

  } catch {

    return [];

  }

}


function saveCart(cart) {

  localStorage.setItem(
    "ojobosco-cart",
    JSON.stringify(cart)
  );

}


function updateCartCount() {

  if (!cartCount) {
    return;
  }

  const cart =
    getCart();

  cartCount.textContent =
    cart.length;

}


document
  .querySelectorAll(
    ".adicionar-carrinho"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const card =
            button.closest(
              ".objeto-card"
            );

          if (!card) {
            return;
          }

          const product =
            card.dataset.product;

          const selectedVariant =
            card.querySelector(
              ".variacao.active"
            );

          const variant =
            selectedVariant
              ? selectedVariant.dataset.variant
              : "";

          const cart =
            getCart();

          cart.push({
            product,
            variant
          });

          saveCart(
            cart
          );

          updateCartCount();


          const originalText =
            button.textContent;

          button.textContent =
            "ADICIONADO";

          button.classList.add(
            "added"
          );


          setTimeout(
            () => {

              button.textContent =
                originalText;

              button.classList.remove(
                "added"
              );

            },
            1200
          );

        }
      );

    }
  );


/* CONTADOR AO ABRIR A PÁGINA */

updateCartCount();
