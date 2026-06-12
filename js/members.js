// Members page — loads data from Google Sheets and renders member cards with attendance stats

(function () {
  const root = document.getElementById('members-root');

  // Column indices in the raw CSV (0-based)
  const COL_NAME      = 1;
  const COL_ROLE      = 2;
  const COL_BIO       = 3;
  const COL_PHOTO_URL = 4;
  const COL_JOIN_DATE = 5;
  const COL_ACTIVE    = 6;
  const COL_TOTAL     = 13; // "total times attend"
  const COL_ATT_START = 14; // first weekly attendance checkbox (TRUE/FALSE)
  // Row indices
  const ROW_DATES     = 2;  // row containing date headers for attendance cols
  const ROW_DATA      = 3;  // first member data row

  function load() {
    showLoading(root, 6, 'member');
    fetchCSVRaw(VOICECLUB_CONFIG.sheets.members)
      .then(render)
      .catch(() => showError(root, null, load));
  }

  function render(allRows) {
    if (allRows.length <= ROW_DATA) {
      renderEmpty();
      return;
    }

    // Extract attendance date headers from row 2 (D/M/YYYY strings)
    const dateHeaders = allRows[ROW_DATES].slice(COL_ATT_START);

    // Today for "past vs future" classification
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a set of excluded timestamps (holidays / cancelled sessions)
    const excluded = new Set(
      (VOICECLUB_CONFIG.excludedDates || [])
        .map(d => { const p = parseDate(d); return p ? p.getTime() : null; })
        .filter(Boolean)
    );

    // Which date columns count as sessions? Past + not a holiday
    const rawPastMask = dateHeaders.map(d => {
      const parsed = parseDate(d);
      if (!parsed) return false;
      if (excluded.has(parsed.getTime())) return false;
      return parsed <= today;
    });

    // Track which indices are excluded holidays (for dot display)
    const holidayMask = dateHeaders.map(d => {
      const parsed = parseDate(d);
      return parsed ? excluded.has(parsed.getTime()) : false;
    });

    // First pass: collect all attended arrays to find the last session with any data
    const activeRows = allRows.slice(ROW_DATA).filter(r => (r[COL_ACTIVE] || '').trim().toUpperCase() === 'TRUE');
    const allAttended = activeRows.map(r =>
      r.slice(COL_ATT_START).map(v => (v || '').trim().toUpperCase() === 'TRUE')
    );

    // Find last past session index where at least one member attended
    let lastActiveIdx = -1;
    for (let j = rawPastMask.length - 1; j >= 0; j--) {
      if (!rawPastMask[j]) continue;
      if (allAttended.some(att => att[j])) { lastActiveIdx = j; break; }
    }

    // Cap the past mask to that session — sessions after the last recorded one don't count
    const pastMask = rawPastMask.map((isPast, i) => isPast && i <= lastActiveIdx);
    const totalPast = pastMask.filter(Boolean).length;

    // Build member list from ROW_DATA onwards
    const members = [];
    for (let i = ROW_DATA; i < allRows.length; i++) {
      const row = allRows[i];
      const active = (row[COL_ACTIVE] || '').trim().toUpperCase();
      if (active !== 'TRUE') continue;

      const name     = (row[COL_NAME]      || '').trim();
      const role     = (row[COL_ROLE]      || '').trim();
      const bio      = (row[COL_BIO]       || '').trim();
      const photoUrl = (row[COL_PHOTO_URL] || '').trim();
      const joinDate = (row[COL_JOIN_DATE] || '').trim();
      const total    = parseInt(row[COL_TOTAL] || '0', 10) || 0;

      // Attendance booleans for each weekly column
      const attCols = row.slice(COL_ATT_START);
      const attended = attCols.map(v => (v || '').trim().toUpperCase() === 'TRUE');

      // Ordered list of real session indices (past + not excluded)
      const sessionIdxs = pastMask.map((b, i) => b ? i : -1).filter(i => i >= 0);

      // Current streak — count back from most recent session
      let streak = 0;
      for (let k = sessionIdxs.length - 1; k >= 0; k--) {
        if (attended[sessionIdxs[k]]) streak++;
        else break;
      }

      // Longest streak
      let longest = 0, run = 0;
      for (let k = 0; k < sessionIdxs.length; k++) {
        if (attended[sessionIdxs[k]]) { run++; if (run > longest) longest = run; }
        else run = 0;
      }

      members.push({ name, role, bio, photoUrl, joinDate, total, totalPast, attended, pastMask, holidayMask, streak, longest });
    }

    if (members.length === 0) {
      renderEmpty();
      return;
    }

    root.innerHTML = `<div class="card-grid">${members.map(memberCard).join('')}</div>`;
    wireAvatarFallbacks(root);
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">👥</div>
        <h3>No members yet</h3>
        <p>Check back soon — member profiles are being added.</p>
      </div>`;
  }

  // Palette for initials avatars — cycles based on name hash
  const AVATAR_COLORS = ['#E8907A','#89B8A2','#C8A070','#7A9CB0','#A08EC8','#7AAF8A'];

  function initialsAvatar(name, extraClass) {
    const words   = name.trim().split(/\s+/);
    const initials = (words.length >= 2
      ? words[0][0] + words[words.length - 1][0]
      : (words[0] || '?').slice(0, 2)
    ).toUpperCase();
    const colorIdx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    const bg = AVATAR_COLORS[colorIdx];
    return `<div class="member-card__avatar member-card__initials${extraClass ? ' ' + extraClass : ''}" style="background:${bg}" aria-label="${escHtml(initials)}">${escHtml(initials)}</div>`;
  }

  function avatarHtml(m) {
    const src = safeUrl(resolvePhotoUrl(m.photoUrl));
    if (!m.photoUrl || !src) {
      return initialsAvatar(m.name);
    }
    const words    = m.name.trim().split(/\s+/);
    const initials = (words.length >= 2
      ? words[0][0] + words[words.length - 1][0]
      : (words[0] || '?').slice(0, 2)
    ).toUpperCase();
    const colorIdx = m.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    const bg = AVATAR_COLORS[colorIdx];
    return `<img
      class="member-card__avatar"
      src="${escHtml(src)}"
      alt="Photo of ${escHtml(m.name)}"
      width="72" height="72"
      loading="lazy"
      data-fallback-initials="${escHtml(initials)}"
      data-fallback-bg="${escHtml(bg)}"
    />`;
  }

  function t(vi, en) { return (window.SOVC_i18n ? window.SOVC_i18n.current() : 'vi') === 'en' ? en : vi; }

  function memberCard(m) {

    const sinceLabel = m.joinDate
      ? `<span class="member-card__meta">${t('Thành viên từ','Member since')} ${formatDate(m.joinDate)}</span>`
      : '';

    const rate = m.totalPast > 0 ? Math.round((m.total / m.totalPast) * 100) : 0;

    const statsHtml = m.totalPast > 0 ? `
      <div class="member-stats">
        <div class="stat-item">
          <span class="stat-value">${m.total}/${m.totalPast}</span>
          <span class="stat-label">${t('Buổi tập','Sessions')}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${rate}%</span>
          <span class="stat-label">${t('Tỷ lệ','Attendance')}</span>
        </div>
        <div class="stat-item stat-item--streak">
          <span class="stat-value">${m.streak > 0 ? '🔥' + m.streak : '—'}</span>
          <span class="stat-label">${t('Chuỗi','Streak')}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${m.longest || '—'}</span>
          <span class="stat-label">${t('Dài nhất','Best streak')}</span>
        </div>
      </div>
      <div class="attend-dots" title="Weekly attendance (green = attended)">
        ${m.pastMask.map((isPast, i) => {
          if (m.holidayMask[i]) return `<span class="attend-dot attend-dot--holiday" title="Holiday / Day off"></span>`;
          if (!isPast) return `<span class="attend-dot attend-dot--future" title="Upcoming"></span>`;
          return m.attended[i]
            ? `<span class="attend-dot attend-dot--yes" title="Attended"></span>`
            : `<span class="attend-dot attend-dot--no" title="Missed"></span>`;
        }).join('')}
      </div>` : '';

    return `
      <div class="card member-card">
        ${avatarHtml(m)}
        <div>
          <h2 class="member-card__name">${escHtml(m.name)}</h2>
          ${m.role ? `<span class="chip chip-primary">${escHtml(m.role)}</span>` : ''}
          ${sinceLabel}
        </div>
        ${m.bio ? `<p class="member-card__bio">${escHtml(m.bio)}</p>` : ''}
        ${statsHtml}
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
