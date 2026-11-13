
document.addEventListener("DOMContentLoaded", () => {
  // Admin navigation
  const navLinks = document.querySelectorAll(".sidebar nav a[href^='#']");

  function updateActiveLink() {
    const currentHash = window.location.hash || "#dashboard";

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === currentHash;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      updateActiveLink();
    });
  });

  window.addEventListener("hashchange", updateActiveLink);
  updateActiveLink();

  // Current year
  const yearElement = document.getElementById("admin-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  console.log("The Grind Admin Panel loaded successfully.");
});

