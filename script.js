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


/* MENU */

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


/* NEWSLETTER */

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


/* VARIAÇÕES 100 ML / 250 ML */

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


      buttons.forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const size =
                button.dataset.size;

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


              const imageAttribute =
                "image" + size;


              const newImage =
                card.dataset[
                  imageAttribute
                ];


              if (
                image &&
                newImage
              ) {

                image.src =
                  newImage;

              }

            }
          );

        }
      );

    }
  );
