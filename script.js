const menuButton = document.getElementById("menuButton");
const menuPanel = document.getElementById("menuPanel");

if (menuButton && menuPanel) {
  menuButton.addEventListener("click", () => {
    menuPanel.classList.toggle("open");
  });

  const menuLinks = menuPanel.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuPanel.classList.remove("open");
    });
  });
}
