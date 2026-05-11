// Finance page — loads fund summary + payment history from Google Sheets

(function () {
  const root    = document.getElementById('finance-root');
  const summary = document.getElementById('finance-summary');
  const sponsor = document.getElementById('finance-sponsor');

  // Column indices (0-based): A=0, B=1 … J=9, K=10, L=11, O=14, P=15
  const COL_J = 9,  COL_K = 10, COL_L = 11;
  const COL_O = 14, COL_P = 15;
  const COL_B = 1;
  // Row indices (0-based):
  //   Row 1 (index 0) = labels row
  //   Row 2 (index 1) = values row (total fund, spent, remaining, sponsor)
  //   Row 4 (index 3) = payment history column headers
  //   Row 5+ (index 4+) = payment records
  const ROW_VALUES  = 1;
  const ROW_HEADERS = 3;
  const ROW_DATA    = 4;

  function load() {
    showLoading(root, 4, 'schedule');
    summary.innerHTML = '';
    sponsor.innerHTML = '';
    fetchCSVRaw(VOICECLUB_CONFIG.sheets.finance)
      .then(render)
      .catch(() => showError(root, null, load));
  }

  function render(allRows) {
    if (!allRows || allRows.length < 1) {
      root.innerHTML = emptyState('💰', 'No financial data yet', 'Check back once fund records have been entered.');
      return;
    }

    const rv  = allRows[ROW_VALUES]  || [];
    const hdr = allRows[ROW_HEADERS] || [];

    const totalFund   = (rv[COL_J] || '').trim();
    const totalSpent  = (rv[COL_K] || '').trim();
    const remaining   = (rv[COL_L] || '').trim();
    const sponsorAmt  = (rv[COL_O] || '').trim();
    const sponsorNote = (rv[COL_P] || '').trim();

    // ── Summary cards ──────────────────────────────────────
    summary.innerHTML = `
      <div class="fin-summary">
        <div class="fin-stat fin-stat--fund">
          <div class="fin-stat__value">${fmtMoney(totalFund)}</div>
          <div class="fin-stat__label">Total Fund</div>
        </div>
        <div class="fin-stat fin-stat--spent">
          <div class="fin-stat__value">${fmtMoney(totalSpent)}</div>
          <div class="fin-stat__label">Total Spent</div>
        </div>
        <div class="fin-stat fin-stat--remaining">
          <div class="fin-stat__value">${fmtMoney(remaining)}</div>
          <div class="fin-stat__label">Remaining</div>
        </div>
        ${sponsorAmt ? `
        <div class="fin-stat fin-stat--sponsor">
          <div class="fin-stat__value">${fmtMoney(sponsorAmt)}</div>
          <div class="fin-stat__label">Sponsorship</div>
        </div>` : ''}
      </div>`;

    // ── Sponsorship details ─────────────────────────────────
    if (sponsorNote) {
      sponsor.innerHTML = `
        <div class="fin-sponsor-box">
          <div class="fin-sponsor-box__icon">🤝</div>
          <div class="fin-sponsor-box__body">
            <h3>Sponsorship Details</h3>
            <p>${escHtml(sponsorNote)}</p>
          </div>
        </div>`;
    }

    // ── Payment history table ───────────────────────────────
    const headers = hdr.slice(COL_B, COL_L + 1).map(h => (h || '').trim());
    const dataRows = allRows.slice(ROW_DATA).filter(row =>
      row.slice(COL_B, COL_L + 1).some(c => (c || '').trim() !== '')
    );

    if (dataRows.length === 0) {
      root.innerHTML = emptyState('📋', 'No payment records yet', 'Transactions will appear here once recorded.');
      return;
    }

    const hasHeaders = headers.some(h => h !== '');

    root.innerHTML = `
      <h2 class="fin-section-title">Payment History</h2>
      <div class="fin-table-wrap">
        <table class="fin-table">
          ${hasHeaders ? `<thead><tr>${headers.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>` : ''}
          <tbody>
            ${dataRows.map(row => `
              <tr>
                ${row.slice(COL_B, COL_L + 1).map((c, i) => `<td>${fmtCell(c, i)}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  /** Format a table cell — status column gets a chip, rest is plain text. */
  function fmtCell(val, colOffset) {
    const str = (val || '').trim();
    // Last column (index 10 within the B-L slice = COL_L) is the status column
    if (colOffset === 10) {
      if (str.toUpperCase() === 'TRUE')  return '<span class="chip chip-secondary" style="font-size:0.75rem">Paid</span>';
      if (str.toUpperCase() === 'FALSE') return '<span class="chip chip-error"     style="font-size:0.75rem">Pending</span>';
    }
    return escHtml(str);
  }

  /** Format a value as Vietnamese currency. Passes through already-formatted strings. */
  function fmtMoney(val) {
    if (!val || val === '—') return '—';
    const str = String(val).trim();
    if (str === '' || str === '#N/A' || str === '#REF!') return '—';
    // Strip thousand separators (commas or periods used as separators) and try to parse
    const stripped = str.replace(/[,\.]/g, '').replace(/[^\d\-]/g, '');
    const num = parseInt(stripped, 10);
    if (!isNaN(num) && stripped.length > 0) {
      return num.toLocaleString('vi-VN') + ' đ';
    }
    return escHtml(str);
  }

  function emptyState(icon, title, msg) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">${icon}</div>
        <h3>${title}</h3>
        <p>${msg}</p>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
