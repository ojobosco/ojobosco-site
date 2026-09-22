document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
     * MENU
     */

    const menuOverlay =
      document.getElementById(
        "menuOverlay"
      );

    const abrirMenu =
      document.getElementById(
        "abrirMenu"
      );

    const fecharMenu =
      document.getElementById(
        "fecharMenu"
      );

    if (
      menuOverlay &&
      abrirMenu &&
      fecharMenu
    ) {

      abrirMenu.addEventListener(
        "click",
        () => {
          menuOverlay.classList.add(
            "aberto"
          );

          document.body.style.overflow =
            "hidden";
        }
      );


      fecharMenu.addEventListener(
        "click",
        () => {
          menuOverlay.classList.remove(
            "aberto"
          );

          document.body.style.overflow =
            "";
        }
      );


      const linksMenu =
        menuOverlay.querySelectorAll(
          "a"
        );

      linksMenu.forEach(
        (link) => {

          link.addEventListener(
            "click",
            () => {

              menuOverlay
                .classList
                .remove(
                  "aberto"
                );

              document.body
                .style
                .overflow =
                "";

            }
          );

        }
      );

    }


    /*
     * CARRINHO
     */

    const carrinho =
      document.getElementById(
        "carrinho"
      );

    const abrirCarrinho =
      document.getElementById(
        "abrirCarrinho"
      );

    const fecharCarrinho =
      document.getElementById(
        "fecharCarrinho"
      );

    const contadorCarrinho =
      document.getElementById(
        "contadorCarrinho"
      );

    const carrinhoConteudo =
      document.getElementById(
        "carrinhoConteudo"
      );


    let itensCarrinho = [];


    function atualizarCarrinho() {

      if (
        !contadorCarrinho ||
        !carrinhoConteudo
      ) {
        return;
      }


      contadorCarrinho.textContent =
        itensCarrinho.length;


      if (
        itensCarrinho.length === 0
      ) {

        carrinhoConteudo.innerHTML =
          `
            <p class="carrinho-vazio">
              SEU CARRINHO ESTÁ VAZIO.
            </p>
          `;

        return;
      }


      carrinhoConteudo.innerHTML =
        itensCarrinho
          .map(
            (
              item,
              indice
            ) => {

              return `
                <div class="carrinho-item">

                  <span>
                    ${item}
                  </span>

                  <button
                    class="botao-texto remover-item"
                    data-indice="${indice}"
                  >
                    REMOVER
                  </button>

                </div>
              `;

            }
          )
          .join("");


      const botoesRemover =
        carrinhoConteudo
          .querySelectorAll(
            ".remover-item"
          );


      botoesRemover.forEach(
        (botao) => {

          botao.addEventListener(
            "click",
            () => {

              const indice =
                Number(
                  botao.dataset.indice
                );


              itensCarrinho.splice(
                indice,
                1
              );


              atualizarCarrinho();

            }
          );

        }
      );

    }


    if (
      abrirCarrinho &&
      carrinho
    ) {

      abrirCarrinho.addEventListener(
        "click",
        () => {

          carrinho.classList.add(
            "aberto"
          );

        }
      );

    }


    if (
      fecharCarrinho &&
      carrinho
    ) {

      fecharCarrinho.addEventListener(
        "click",
        () => {

          carrinho.classList.remove(
            "aberto"
          );

        }
      );

    }


    const botoesAdicionar =
      document.querySelectorAll(
        ".adicionar-carrinho"
      );


    botoesAdicionar.forEach(
      (botao) => {

        botao.addEventListener(
          "click",
          () => {

            const produto =
              botao.dataset.produto ||
              "Produto OJOBOSCO";


            itensCarrinho.push(
              produto
            );


            atualizarCarrinho();


            if (carrinho) {

              carrinho.classList.add(
                "aberto"
              );

            }

          }
        );

      }
    );


    atualizarCarrinho();


    /*
     * ANIMAÇÕES AO ROLAR
     */

    const elementosReveal =
      document.querySelectorAll(
        ".reveal"
      );


    const observador =
      new IntersectionObserver(
        (
          entradas
        ) => {

          entradas.forEach(
            (
              entrada
            ) => {

              if (
                entrada.isIntersecting
              ) {

                entrada
                  .target
                  .classList
                  .add(
                    "visivel"
                  );

              }

            }
          );

        },
        {
          threshold:
            0.12,
        }
      );


    elementosReveal.forEach(
      (
        elemento
      ) => {

        observador.observe(
          elemento
        );

      }
    );


    /*
     * MOVIMENTO SUAVE DO HERO
     */

    const forma1 =
      document.querySelector(
        ".hero-forma-1"
      );

    const forma2 =
      document.querySelector(
        ".hero-forma-2"
      );


    window.addEventListener(
      "scroll",
      () => {

        const y =
          window.scrollY;


        if (forma1) {

          forma1.style.transform =
            `translateY(${y * 0.06}px) rotate(-9deg)`;

        }


        if (forma2) {

          forma2.style.transform =
            `translateY(${y * -0.035}px) rotate(13deg)`;

        }

      }
    );

  }
);
