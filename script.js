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
    (
      link
    ) => {

      link.addEventListener(
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
    (
      event
    ) => {

      event.preventDefault();


      const email =
        newsletterEmail
          .value
          .trim()
          .toLowerCase();


      if (!email) {
        return;
      }


      /*
       * TEMPORÁRIO:
       *
       * Salva apenas no navegador.
       * Depois conectaremos a newsletter
       * a um serviço real de e-mail.
       */

      localStorage.setItem(
        "ojobosco-newsletter-email",
        email
      );


      newsletterForm.style.display =
        "none";


      newsletterSuccess
        .classList
        .add(
          "visible"
        );

    }
  );

}
