// MENU
const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

if (menuToggle && closeMenu && sideMenu && menuOverlay) {
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");
  });

  closeMenu.addEventListener("click", () => {
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });

  menuOverlay.addEventListener("click", () => {
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });
}

// VARIANTES DE PRODUTO
const productCards = document.querySelectorAll(".product-card");

productCards.forEach(card => {
  const buttons = card.querySelectorAll(".variant-btn");
  const image = card.querySelector(".product-image");
  const price = card.querySelector(".product-price");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const size = button.dataset.size;
      if (!size) return;

      buttons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const imageKey = `data-image-${size}`;
      const priceKey = `data-price-${size}`;

      const newImage = card.getAttribute(imageKey);
      const newPrice = card.getAttribute(priceKey);

      if (image && newImage) {
        image.src = newImage;
      }

      if (price && newPrice) {
        price.textContent = `R$${newPrice}`;
      }
    });
  });
});
