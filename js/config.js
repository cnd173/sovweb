// ─────────────────────────────────────────────────────────────────────────────
// VOICE CLUB — Configuration (Soul of Voice Club)
// Spreadsheet: CLB SOV - bang nhap  |  only the web-* tabs are published (File > Share > Publish to the web).
// The web-* tabs are rebuilt hourly by an Apps Script from the entry tabs, without private columns.
// ─────────────────────────────────────────────────────────────────────────────

const VOICECLUB_CONFIG = {
  site: {
    name: 'Soul of Voice Club',
    tagline: 'From Soul to Story — through every breath.',
    contact: '',
    socialLinks: [],
  },

  sheets: {
    // Tab: web-members  (gid 601196502)
    members:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33WilGREy9_TukQoceSLHfrsd0rov2tO3mV_2q9LSxGRncN7OtevxAC5gkFZapO9_EXXy9DEy465x/pub?gid=601196502&single=true&output=csv',
    // Tab: web-progress  (gid 1994178462)
    progress:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33WilGREy9_TukQoceSLHfrsd0rov2tO3mV_2q9LSxGRncN7OtevxAC5gkFZapO9_EXXy9DEy465x/pub?gid=1994178462&single=true&output=csv',
    // Tab: web-schedule  (gid 149389168)
    schedule:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33WilGREy9_TukQoceSLHfrsd0rov2tO3mV_2q9LSxGRncN7OtevxAC5gkFZapO9_EXXy9DEy465x/pub?gid=149389168&single=true&output=csv',
    // Tab: web-finance  (gid 1943043928)
    finance:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33WilGREy9_TukQoceSLHfrsd0rov2tO3mV_2q9LSxGRncN7OtevxAC5gkFZapO9_EXXy9DEy465x/pub?gid=1943043928&single=true&output=csv',
    // Tab: web-rules  (gid 685147897)
    rules:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33WilGREy9_TukQoceSLHfrsd0rov2tO3mV_2q9LSxGRncN7OtevxAC5gkFZapO9_EXXy9DEy465x/pub?gid=685147897&single=true&output=csv',
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
