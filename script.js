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

      sideMenu.classList.add(
        "open"
      );

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

      sideMenu.classList.remove(
        "open"
      );

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

          sideMenu.classList.remove(
            "open"
          );

        }
      );

    }
  );
