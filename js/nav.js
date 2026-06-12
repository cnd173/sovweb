// Shared nav behavior — hamburger menu toggle (external file so pages can run
// under a strict Content-Security-Policy with no inline scripts)

document.addEventListener('DOMContentLoaded', function () {
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;
  hamburger.addEventListener('click', function () {
    var isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
});
