// Shared utilities — loaded before all page scripts

/**
 * Parse a date string in either YYYY-MM-DD or D/M/YYYY (Vietnamese) format.
 * Returns a Date at midnight local time, or null if unparseable.
 */
function parseDate(str) {
  if (!str) return null;
  str = str.trim();
  if (str.includes('/')) {
    // D/M/YYYY or DD/MM/YYYY — day comes first (Vietnamese convention)
    const parts = str.split('/');
    if (parts.length === 3) {
      const day   = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year  = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return new Date(year, month, day);
      }
    }
  }
  if (str.includes('-')) {
    // YYYY-MM-DD ISO format
    const d = new Date(str + 'T00:00:00');
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Fetch a published Google Sheets CSV URL and return an array of row objects.
 * options.headerRow: 0-based index of the row to use as column headers (default 0).
 *   Use headerRow: 2 for sheets that have 2 summary rows before the real headers.
 */
async function fetchCSV(url, options = {}) {
  const { headerRow = 0 } = options;
  // Append a timestamp so the browser never serves a stale cached copy of the CSV
  const bustUrl = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
  const res = await fetch(bustUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  if (headerRow === 0) {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const serious = (result.errors || []).filter(e => e.type !== 'Quotes');
    if (serious.length) throw new Error('CSV parse error');
    return result.data.map(trimRow);
  }

  // Non-zero headerRow: parse raw rows, treat headerRow-th as the header
  const result = Papa.parse(text, { header: false, skipEmptyLines: false });
  const allRows = result.data;
  if (allRows.length <= headerRow) return [];
  const headers = allRows[headerRow].map(h => (h || '').trim());
  return allRows
    .slice(headerRow + 1)
    .filter(row => row.some(cell => (cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = (row[i] || '').trim(); });
      return obj;
    });
}

function trimRow(row) {
  const clean = {};
  for (const k in row) clean[k.trim()] = (row[k] || '').trim();
  return clean;
}

/** Fetch a CSV and return raw 2D array (no header parsing). */
async function fetchCSVRaw(url) {
  const bustUrl = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
  const res = await fetch(bustUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const result = Papa.parse(text, { header: false, skipEmptyLines: false });
  return result.data;
}

/** Inject a skeleton loading state into a container element. */
function showLoading(el, count = 6, type = 'card') {
  if (type === 'schedule') {
    el.innerHTML = Array.from({ length: 3 }, () => `
      <div class="skeleton-card">
        <div class="skeleton sk-line-lg"></div>
        <div class="skeleton sk-line-md"></div>
        <div class="skeleton sk-line-sm"></div>
        <div class="skeleton sk-line-full"></div>
      </div>`).join('');
    return;
  }
  el.innerHTML = `<div class="card-grid">${Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton sk-avatar"></div>
      <div class="skeleton sk-line-lg"></div>
      <div class="skeleton sk-line-md"></div>
      <div class="skeleton sk-line-sm"></div>
      <div class="skeleton sk-line-full"></div>
    </div>`).join('')}</div>`;
}

/**
 * Render an error state with an optional retry button.
 */
function showError(el, msg, retryFn = null) {
  el.innerHTML = `
    <div class="error-state">
      <div class="error-state__icon">🎙️</div>
      <h3>Couldn't load content</h3>
      <p>${msg || "We couldn't reach our data source. Please check your connection and try again."}</p>
      ${retryFn ? '<button class="btn btn-outline btn-sm" id="retry-btn">Try Again</button>' : ''}
    </div>`;
  if (retryFn) el.querySelector('#retry-btn').addEventListener('click', retryFn);
}

/** Format a date string to "May 10, 2026". Returns raw string if unparseable. */
function formatDate(str) {
  const d = parseDate(str);
  if (!d) return str || '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Return short month abbreviation ("MAY") from a date string. */
function monthAbbr(str) {
  const d = parseDate(str);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

/** Return day-of-month number from a date string. */
function dayNum(str) {
  const d = parseDate(str);
  if (!d) return '';
  return d.getDate();
}

/**
 * Convert a Google Drive sharing URL to a directly embeddable image URL.
 * Handles: https://drive.google.com/file/d/FILE_ID/view?...
 * Falls back to the placeholder avatar if url is empty.
 */
function resolvePhotoUrl(url) {
  if (!url) return VOICECLUB_CONFIG.placeholderAvatar;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url;
}

/** Escape HTML to prevent XSS. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Return true if the date string is today or in the future. */
function isUpcoming(str) {
  const d = parseDate(str);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

/** Compare two date strings for sorting — unparseable dates sort last. */
function compareDates(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
}
