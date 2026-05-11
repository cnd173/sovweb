// ─────────────────────────────────────────────────────────────────────────────
// VOICE CLUB — Configuration (Soul of Voice Club)
// Spreadsheet: Soul of Voice Club  |  Published via File > Share > Publish to the web
// ─────────────────────────────────────────────────────────────────────────────

const VOICECLUB_CONFIG = {
  site: {
    name: 'Soul of Voice Club',
    tagline: 'A community built on sound and story.',
    contact: '',
    socialLinks: [],
  },

  sheets: {
    // Tab: members  (gid 1249376586)
    members:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYG8HtxYkQkatuT0TEyqgYxBLR-k_fDE3bQyLWlXKjRgqGfsC97ISH9NkZgTPEP5lfDaIm-jBHmSrq/pub?gid=1249376586&single=true&output=csv',
    // Tab: progress  (gid 201434808)
    progress:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYG8HtxYkQkatuT0TEyqgYxBLR-k_fDE3bQyLWlXKjRgqGfsC97ISH9NkZgTPEP5lfDaIm-jBHmSrq/pub?gid=201434808&single=true&output=csv',
    // Tab: schedule  (gid 917830098)
    schedule:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYG8HtxYkQkatuT0TEyqgYxBLR-k_fDE3bQyLWlXKjRgqGfsC97ISH9NkZgTPEP5lfDaIm-jBHmSrq/pub?gid=917830098&single=true&output=csv',
    // Tab: finance  (gid 674234012)
    finance:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYG8HtxYkQkatuT0TEyqgYxBLR-k_fDE3bQyLWlXKjRgqGfsC97ISH9NkZgTPEP5lfDaIm-jBHmSrq/pub?gid=674234012&single=true&output=csv',
    // Tab: rules  (gid 1842522860)
    rules:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYG8HtxYkQkatuT0TEyqgYxBLR-k_fDE3bQyLWlXKjRgqGfsC97ISH9NkZgTPEP5lfDaIm-jBHmSrq/pub?gid=1842522860&single=true&output=csv',
  },

  // Dates to exclude from session counting (holidays, cancellations) — D/M/YYYY format
  excludedDates: ['2/5/2026'],

  // Photos & Videos — served via Google Apps Script
  photos: {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbxbmMbz5xphOMSHEElHxI3j3FirTGIhN7TJEDMPxmgb3XAkWS63R8_mwxDQdAsm18GoCw/exec',
  },

  placeholderAvatar: 'assets/images/placeholder-avatar.svg',
};
