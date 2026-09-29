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
        .add("visible");

    }
  );

}


/* =========================================
   VARIAÇÕES DOS PRODUTOS
   MUDA IMAGEM + PREÇO
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

                  item.classList.remove(
                    "active"
                  );

                }
              );


              button.classList.add(
                "active"
              );


              /*
                IMPORTANTE:
                usa getAttribute diretamente.

                Exemplo:
                data-image-250
                data-price-250
              */

              const newImage =
                card.getAttribute(
                  "data-image-" + size
                );


              const newPrice =
                card.getAttribute(
                  "data-price-" + size
                );


              if (
                image &&
                newImage
              ) {

                image.src =
                  newImage;


                /*
                  Atualiza também
                  o texto alternativo.
                */

                const productName =
                  card.querySelector("h3");


                if (productName) {

                  image.alt =
                    productName.textContent.trim() +
                    " " +
                    size +
                    " ml";

                }

              }


              if (
                price &&
                newPrice
              ) {

                price.textContent =
                  "R$" +
                  newPrice;

              }

            }
          );

        }
      );

    }
  );
