// Schedule page — month-based week-block grid layout

(function () {
  const root = document.getElementById('schedule-root');

  function t(vi, en) { return (window.SOVC_i18n ? window.SOVC_i18n.current() : 'vi') === 'en' ? en : vi; }

  // Week bucket: days 1–7 → 0, 8–14 → 1, 15–21 → 2, 22+ → 3
  function weekIdx(date) {
    const d = date.getDate();
    return d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : 3;
  }

  function weekRangeLabel(wi, month, year) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const starts = [1,  8,  15, 22];
    const ends   = [7, 14,  21, daysInMonth];
    const s = starts[wi], e = ends[wi];
    return t(`${s}–${e} th.${month + 1}`, `${s}–${e}`);
  }

  function monthOrder(m) { return m.year * 12 + m.month; }

  function load() {
    showLoading(root, 4, 'schedule');
    fetchCSV(VOICECLUB_CONFIG.sheets.schedule)
      .then(render)
      .catch(() => showError(root, null, load));
  }

  function render(rows) {
    if (rows.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <h3>${t('Chưa có sự kiện nào','No events yet')}</h3>
          <p>${t('Theo dõi nhé — lịch sẽ được cập nhật sớm!','Check back soon — sessions are being planned!')}</p>
        </div>`;
      return;
    }

    rows.sort((a, b) => compareDates(a.date, b.date));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const currentOrder = today.getFullYear() * 12 + today.getMonth();

    // Find the next upcoming event to determine which week block to highlight
    const nextUpcoming = rows.find(r => {
      const d = parseDate(r.date);
      return d && d >= today && (r.status || '').toLowerCase() !== 'cancelled';
    });

    let activeMonthOrder = -1, activeWeek = -1;
    if (nextUpcoming) {
      const d = parseDate(nextUpcoming.date);
      activeMonthOrder = d.getFullYear() * 12 + d.getMonth();
      activeWeek       = weekIdx(d);
    }

    // Group events by year-month
    const monthMap = {};
    rows.forEach(r => {
      const d = parseDate(r.date);
      if (!d) return;
      const order = d.getFullYear() * 12 + d.getMonth();
      if (!monthMap[order]) monthMap[order] = { year: d.getFullYear(), month: d.getMonth(), events: [] };
      monthMap[order].events.push({ ...r, _parsed: d });
    });

    const allMonths = Object.values(monthMap)
      .sort((a, b) => monthOrder(a) - monthOrder(b));

    const upcomingMonths = allMonths.filter(m => monthOrder(m) >= currentOrder);
    const pastMonths     = allMonths.filter(m => monthOrder(m) <  currentOrder);

    let html = '';

    upcomingMonths.forEach(m => {
      html += renderMonth(m, activeMonthOrder, activeWeek, today, false);
    });

    if (upcomingMonths.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <h3>${t('Chưa có buổi tập sắp tới','No upcoming sessions right now')}</h3>
          <p>${t('Theo dõi nhé — sự kiện mới đang được lên kế hoạch!','Check back soon — new sessions are being planned!')}</p>
        </div>`;
    }

    if (pastMonths.length > 0) {
      const pastLabel = t(
        `Các tháng đã qua (${pastMonths.length})`,
        `Past months (${pastMonths.length})`
      );
      html += `
        <button class="past-toggle" id="past-toggle" aria-expanded="false">
          <span class="past-toggle__label">${pastLabel}</span>
          <span class="past-toggle__arrow">▼</span>
        </button>
        <div class="past-months" id="past-months">
          ${pastMonths.slice().reverse().map(m => renderMonth(m, -1, -1, today, true)).join('')}
        </div>`;
    }

    root.innerHTML = html;

    const btn   = root.querySelector('#past-toggle');
    const panel = root.querySelector('#past-months');
    if (btn && panel) {
      btn.addEventListener('click', () => {
        const open = panel.classList.toggle('visible');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    }
  }

  function renderMonth(m, activeMonthOrder, activeWeek, today, isPast) {
    const { year, month, events } = m;
    const order = monthOrder(m);

    const monthName = new Date(year, month, 1).toLocaleDateString(
      t('vi-VN', 'en-US'),
      { month: 'long', year: 'numeric' }
    );

    // Distribute into 4 week buckets
    const weeks = [[], [], [], []];
    events.forEach(e => weeks[weekIdx(e._parsed)].push(e));

    const weeksHtml = weeks.map((evts, wi) => {
      const isActive = !isPast && order === activeMonthOrder && wi === activeWeek;

      const weekEndDays = [7, 14, 21, new Date(year, month + 1, 0).getDate()];
      const weekEndDate = new Date(year, month, weekEndDays[wi]);
      const isWeekPast  = isPast || weekEndDate < today;

      const classes = ['week-block'];
      if (isActive)          classes.push('week-block--active');
      else if (isWeekPast)   classes.push('week-block--past');
      if (evts.length === 0) classes.push('week-block--empty');

      return `
        <div class="${classes.join(' ')}">
          <div class="week-block__header">
            <span class="week-num">${t(`Tuần ${wi + 1}`, `Week ${wi + 1}`)}</span>
            ${isActive ? `<span class="week-badge">${t('Sắp tới','Next')}</span>` : ''}
          </div>
          <div class="week-date-range">${weekRangeLabel(wi, month, year)}</div>
          ${evts.length > 0
            ? evts.map(weekEvent).join('')
            : `<div class="week-empty-msg">${t('Không có buổi','—')}</div>`
          }
        </div>`;
    }).join('');

    return `
      <div class="month-section${isPast ? ' month-section--past' : ''}">
        <h2 class="month-header">${monthName}</h2>
        <div class="week-grid">${weeksHtml}</div>
      </div>`;
  }

  function weekEvent(r) {
    const isCancelled = (r.status || '').toLowerCase() === 'cancelled';
    const link = safeUrl(r.meeting_link);
    return `
      <div class="week-event${isCancelled ? ' week-event--cancelled' : ''}">
        ${isCancelled
          ? `<span class="chip chip-error" style="font-size:0.7rem;margin-bottom:4px;display:inline-block">${t('Đã huỷ','Cancelled')}</span>`
          : ''}
        <div class="week-event__title">${escHtml(r.title || t('Buổi tập', 'Session'))}</div>
        ${r.time        ? `<div class="week-event__meta">🕐 ${escHtml(r.time)}</div>` : ''}
        ${r.location    ? `<div class="week-event__meta">📍 ${escHtml(r.location)}</div>` : ''}
        ${r.description ? `<div class="week-event__desc">${escHtml(r.description)}</div>` : ''}
        ${link
          ? `<a href="${escHtml(link)}" target="_blank" rel="noopener noreferrer" class="week-event__link">${t('Tham gia →','Join →')}</a>`
          : ''}
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
