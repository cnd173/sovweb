// Rules page — loads rules list from Google Sheets

(function () {
  const root = document.getElementById('rules-root');

  function load() {
    showLoading(root, 4, 'schedule');
    fetchCSVRaw(VOICECLUB_CONFIG.sheets.rules)
      .then(render)
      .catch(() => showError(root, null, load));
  }

  function render(allRows) {
    // Row 0 = headers ("No.", "rules"), Row 1+ = data
    const rules = allRows.slice(1).filter(r => (r[0] || '').trim() !== '' && (r[1] || '').trim() !== '');

    if (rules.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📋</div>
          <h3>No rules yet</h3>
          <p>Club rules will appear here once they've been added.</p>
        </div>`;
      return;
    }

    root.innerHTML = `
      <ol class="rules-list">
        ${rules.map(r => `
          <li class="rules-item">
            <span class="rules-num">${escHtml(r[0].trim())}</span>
            <span class="rules-text">${escHtml(r[1].trim())}</span>
          </li>`).join('')}
      </ol>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
