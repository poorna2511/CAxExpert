(function () {
  "use strict";

  // Theme toggle
  const html = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = html.getAttribute("data-theme") === "dark";
      if (isDark) {
        html.removeAttribute("data-theme");
        localStorage.setItem("CAx_theme", "light");
      } else {
        html.setAttribute("data-theme", "dark");
        localStorage.setItem("CAx_theme", "dark");
      }
    });
  }

  // Toast helper
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2800);
  }

  // Contact form submission
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      showToast("Message sent. We'll reply soon.");
      contactForm.reset();
    });
  }
})();