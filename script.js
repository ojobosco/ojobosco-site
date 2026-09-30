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
   VARIAÇÕES NA LOJA
   TROCA IMAGEM + PREÇO
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


/* =========================================
   FRAGRÂNCIAS DA VELA NA LOJA
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


      buttons.forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

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

            }
          );

        }
      );

    }
  );


/* =========================================
   AROMATIZADOR E DIFUSOR
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

        const isActive =
          button.getAttribute(
            "data-fragrance"
          ) === currentFragrance;


        button.classList.toggle(
          "active",
          isActive
        );


        if (
          isActive &&
          fragranceName
        ) {

          fragranceName.textContent =
            button.getAttribute(
              "data-name"
            );

        }

      }
    );


    sizeButtons.forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.getAttribute(
            "data-size"
          ) === currentSize
        );

      }
    );


    fragrancePanels.forEach(
      (panel) => {

        panel.classList.toggle(
          "active",
          panel.getAttribute(
            "data-fragrance-panel"
          ) === currentFragrance
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


    if (
      detailPrice
    ) {

      const price =
        detailPage.getAttribute(
          "data-price-" +
          currentSize
        );


      if (price) {

        detailPrice.textContent =
          "R$" +
          price;

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


  updateDetailProduct();

}


/* =========================================
   PÁGINA DA VELA
========================================= */

if (!detailPage) {

  const fragranceButtons =
    document.querySelectorAll(
      ".produto-fragrancia-btn"
    );


  const fragrancePanels =
    document.querySelectorAll(
      ".fragrancia-detalhe"
    );


  fragranceButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const fragrance =
            button.getAttribute(
              "data-fragrance"
            );


          fragranceButtons.forEach(
            (item) => {

              item.classList.remove(
                "active"
              );

            }
          );


          button.classList.add(
            "active"
          );


          fragrancePanels.forEach(
            (panel) => {

              panel.classList.toggle(
                "active",
                panel.getAttribute(
                  "data-fragrance-panel"
                ) === fragrance
              );

            }
          );

        }
      );

    }
  );

}
