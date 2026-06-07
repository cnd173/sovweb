// ─────────────────────────────────────────────────────────────────────────────
//  i18n — Vietnamese ↔ English language toggle
//  Usage: add data-vi="..." data-en="..." to any element for text content,
//         or data-vi-html="..." data-en-html="..." for innerHTML.
//  The user's choice is saved in localStorage as 'sovc-lang'.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  var lang = localStorage.getItem('sovc-lang') || 'vi';

  function applyLang(l) {
    lang = l;
    localStorage.setItem('sovc-lang', l);

    // Set <html lang> attribute
    document.documentElement.setAttribute('lang', l === 'vi' ? 'vi' : 'en');

    // Text content nodes
    document.querySelectorAll('[data-vi]').forEach(function (el) {
      el.textContent = l === 'vi'
        ? el.getAttribute('data-vi')
        : (el.getAttribute('data-en') || el.getAttribute('data-vi'));
    });

    // HTML content nodes (titles, descriptions with <em>/<strong>)
    document.querySelectorAll('[data-vi-html]').forEach(function (el) {
      el.innerHTML = l === 'vi'
        ? el.getAttribute('data-vi-html')
        : (el.getAttribute('data-en-html') || el.getAttribute('data-vi-html'));
    });

    // Toggle button label: shows the language you can switch TO
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = l === 'vi' ? 'EN' : 'VI';
      btn.setAttribute('title',
        l === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt');
      btn.setAttribute('aria-pressed', l === 'en' ? 'true' : 'false');
    });
  }

  // Public API (e.g. used by dynamic JS to check current language)
  window.SOVC_i18n = {
    current: function () { return lang; },
    apply:   applyLang,
    t: function (viStr, enStr) {
      return lang === 'vi' ? viStr : enStr;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyLang(lang);

    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(lang === 'vi' ? 'en' : 'vi');
      });
    });
  });
})();
