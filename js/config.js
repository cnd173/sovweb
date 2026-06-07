// ─────────────────────────────────────────────────────────────────────────────
// VOICE CLUB — Configuration (Soul of Voice Club)
// Spreadsheet: Soul of Voice Club  |  Published via File > Share > Publish to the web
// ─────────────────────────────────────────────────────────────────────────────

const VOICECLUB_CONFIG = {
  site: {
    name: 'Soul of Voice Club',
    tagline: 'From Soul to Story — through every breath.',
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

  // Practice page — vocal warm-up videos
  // Paste the full YouTube URL for each duration, e.g.:
  //   url: 'https://www.youtube.com/watch?v=ABC123'
  // Supports youtube.com/watch?v=…, youtu.be/…, or youtube.com/embed/…
  // Leave url empty ('') and the button will be greyed out until filled in.
  practice: {
    warmupVideos: [
      { label: '5 min',  url: 'https://www.youtube.com/watch?v=YCLyAmXtpfY' },
      { label: '10 min', url: 'https://www.youtube.com/watch?v=ck1pzgy07ZU' },
      { label: '15 min', url: 'https://www.youtube.com/watch?v=1f_SVJMRx5s' },
      { label: '20 min', url: 'https://www.youtube.com/watch?v=3Q9tHGLzILQ' },
      { label: '30 min', url: 'https://www.youtube.com/watch?v=zU4GoNtenxw' },
      { label: '40 min', url: 'https://www.youtube.com/watch?v=0KGxK7nHWUc' },
    ],
  },
};
