// Progress Board — loads members + progress data, renders breath-time leaderboard

(function () {
  const root    = document.getElementById('board-root');
  const summary = document.getElementById('board-summary');

  function load() {
    showLoading(root, 5, 'schedule');
    summary.innerHTML = '';

    Promise.all([
      fetchCSV(VOICECLUB_CONFIG.sheets.members),
      fetchCSV(VOICECLUB_CONFIG.sheets.progress),
    ])
      .then(([members, progress]) => render(members, progress))
      .catch(() => showError(root, null, load));
  }

  function render(members, progressRows) {
    // Only active members
    const activeMembers = members.filter(m => (m.active || '').toUpperCase() === 'TRUE');

    // Group progress rows by member name (case-insensitive trim)
    const byMember = {};
    progressRows.forEach(row => {
      const name = (row.name || row.member || '').trim();
      const secs = parseFloat(row.seconds);
      if (!name || isNaN(secs) || secs <= 0) return;
      if (!byMember[name]) byMember[name] = [];
      byMember[name].push({ date: row.date || '', seconds: secs, notes: row.notes || '' });
    });

    // Build stats per member
    const stats = activeMembers.map(m => {
      const name = (m.name || '').trim();
      const records = (byMember[name] || []).sort((a, b) => compareDates(a.date, b.date));
      const best    = records.length ? Math.max(...records.map(r => r.seconds)) : null;
      const first   = records.length ? records[0].seconds : null;
      const bestRec = records.find(r => r.seconds === best) || null;

      return {
        name,
        role:      m.role || '',
        photoUrl:  m.photo_url || '',
        best,
        first,
        improvement: best !== null && first !== null ? +(best - first).toFixed(1) : null,
        bestDate:  bestRec ? bestRec.date : '',
        recordCount: records.length,
      };
    });

    // Sort: members with data first (by best desc), then no-data members alphabetically
    stats.sort((a, b) => {
      if (a.best !== null && b.best !== null) return b.best - a.best;
      if (a.best !== null) return -1;
      if (b.best !== null) return 1;
      return a.name.localeCompare(b.name);
    });

    if (stats.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🏆</div>
          <h3>No data yet</h3>
          <p>Progress records will appear here once members start logging their breath times.</p>
        </div>`;
      return;
    }

    // Summary stats
    const withData    = stats.filter(s => s.best !== null);
    const groupBest   = withData.length ? Math.max(...withData.map(s => s.best)) : 0;
    const avgBest     = withData.length ? withData.reduce((s, m) => s + m.best, 0) / withData.length : 0;
    const totalLogs   = progressRows.length;

    summary.innerHTML = `
      <div class="summary-stat">
        <div class="summary-stat__value">${withData.length}</div>
        <div class="summary-stat__label">Members tracked</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat__value">${fmtSecs(groupBest)}</div>
        <div class="summary-stat__label">Group record</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat__value">${fmtSecs(Math.round(avgBest))}</div>
        <div class="summary-stat__label">Average best</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat__value">${totalLogs}</div>
        <div class="summary-stat__label">Sessions logged</div>
      </div>`;

    // Render rows
    root.innerHTML = `
      <div class="board-list" role="list">
        ${stats.map((s, i) => boardRow(s, i, groupBest)).join('')}
      </div>`;

    // Animate bars after render
    requestAnimationFrame(() => {
      document.querySelectorAll('.board-bar[data-width]').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  }

  function boardRow(s, index, groupBest) {
    const rank        = s.best !== null ? index + 1 : null;
    const rankLabel   = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank ? `#${rank}` : '—';
    const rankAttr    = rank === 1 ? '1' : rank === 2 ? '2' : rank === 3 ? '3' : 'other';
    const barPct      = groupBest > 0 && s.best !== null ? Math.round((s.best / groupBest) * 100) : 0;
    const noData      = s.best === null;

    const AVATAR_COLORS = ['#E8907A','#89B8A2','#C8A070','#7A9CB0','#A08EC8','#7AAF8A'];
    const words   = s.name.trim().split(/\s+/);
    const initials = (words.length >= 2 ? words[0][0] + words[words.length-1][0] : (words[0]||'?').slice(0,2)).toUpperCase();
    const colorIdx = s.name.split('').reduce((acc,c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    const avatarBg = AVATAR_COLORS[colorIdx];
    const resolvedSrc = resolvePhotoUrl(s.photoUrl);
    const avatarEl = (!s.photoUrl || resolvedSrc === VOICECLUB_CONFIG.placeholderAvatar)
      ? `<div class="board-avatar member-card__initials" style="width:52px;height:52px;font-size:1rem;background:${avatarBg}" aria-label="${escHtml(initials)}">${escHtml(initials)}</div>`
      : `<img class="board-avatar" src="${escHtml(resolvedSrc)}" alt="${escHtml(s.name)}" width="52" height="52" loading="lazy" onerror="window._avatarFallback(this,'${escHtml(initials)}','${avatarBg}')">`;

    const improvementChip = (() => {
      if (s.improvement === null) return '';
      if (s.improvement === 0 || s.recordCount < 2)
        return '<span class="improvement flat">first record</span>';
      return `<span class="improvement">▲ +${fmtSecs(s.improvement)}</span>`;
    })();

    const bestDisplay = noData
      ? '<span style="color:var(--color-text-muted);font-size:0.9rem">No records yet</span>'
      : `<div class="board-best">${fmtSecs(s.best)}</div>
         <div class="board-best-label">Personal Best</div>`;

    return `
      <div class="board-row${noData ? ' no-data' : ''}" data-rank="${rankAttr}" role="listitem">
        <div class="board-rank" data-rank="${rankAttr}" aria-label="Rank ${rank || 'unranked'}">${rankLabel}</div>

        ${avatarEl}

        <div class="board-info">
          <span class="board-name">${escHtml(s.name)}</span>
          <div class="board-meta">
            ${improvementChip}
            ${s.bestDate ? `<span class="board-date">Best on ${formatDate(s.bestDate)}</span>` : ''}
          </div>
          ${!noData ? `
            <div class="board-bar-wrap" title="${barPct}% of group record">
              <div class="board-bar" data-width="${barPct}" style="width:0%"></div>
            </div>` : ''}
        </div>

        <div class="board-best-wrap">
          ${bestDisplay}
        </div>
      </div>`;
  }

  /** Format seconds into a readable string: "1 min 23 sec" or "45 sec" */
  function fmtSecs(totalSeconds) {
    if (totalSeconds === null || isNaN(totalSeconds)) return '—';
    const s = Math.round(totalSeconds);
    if (s < 60) return `${s} sec`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m} min` : `${m} min ${rem} sec`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
