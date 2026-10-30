// Light/dark theme toggle, shared by every page.
// Loaded in <head> so the saved theme is applied before the page is drawn.
(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;

  function readSaved() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null; // storage blocked (e.g. private browsing)
    }
  }

  function save(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore: the theme still changes, it just won't be remembered
    }
  }

  // Light is the default, whatever the device setting is.
  function apply(theme) {
    root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  apply(readSaved());

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme-toggle");
    if (!button) return;

    function updateButton() {
      var isDark = root.getAttribute("data-theme") === "dark";
      button.setAttribute("aria-pressed", String(isDark));
      button.textContent = isDark ? "Light theme" : "Dark theme";
    }

    button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      save(next);
      updateButton();
    });

    updateButton();
  });
})();
