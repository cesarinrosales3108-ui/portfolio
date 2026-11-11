(function () {
  var toggle = document.getElementById("nav-toggle");
  if (!toggle) return;
  document.querySelectorAll(".nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggle.checked = false;
    });
  });
})();
