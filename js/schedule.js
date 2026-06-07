// Schedule page — loads events from Google Sheets, splits upcoming vs. past

(function () {
  const root = document.getElementById('schedule-root');

  function t(vi, en) { return (window.SOVC_i18n ? window.SOVC_i18n.current() : 'vi') === 'en' ? en : vi; }

  function getStatusChips() {
    return {
      upcoming:  `<span class="chip chip-secondary">${t('Sắp tới','Upcoming')}</span>`,
      cancelled: `<span class="chip chip-error">${t('Đã huỷ','Cancelled')}</span>`,
      past:      `<span class="chip chip-muted">${t('Đã qua','Past')}</span>`,
    };
  }

  function load() {
    showLoading(root, 4, 'schedule');
    fetchCSV(VOICECLUB_CONFIG.sheets.schedule)
      .then(render)
      .catch(() => showError(root, null, load));
  }

  function render(rows) {
    // Sort by date ascending
    rows.sort((a, b) => compareDates(a.date, b.date));

    const upcoming = rows.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s === 'upcoming' || (s !== 'past' && s !== 'cancelled' && isUpcoming(r.date));
    });

    const past = rows.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s === 'past' || (s !== 'upcoming' && s !== 'cancelled' && !isUpcoming(r.date));
    });

    const cancelled = rows.filter(r => (r.status || '').toLowerCase() === 'cancelled');

    if (rows.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <h3>${t('Chưa có sự kiện nào','No events yet')}</h3>
          <p>${t('Theo dõi nhé — lịch sẽ được cập nhật sớm!','Check back soon — sessions are being planned!')}</p>
        </div>`;
      return;
    }

    let html = '';

    const STATUS_CHIP = getStatusChips();

    // Upcoming + cancelled future
    const upcomingAndCancelled = [
      ...upcoming,
      ...cancelled.filter(r => isUpcoming(r.date)),
    ].sort((a, b) => compareDates(a.date, b.date));

    if (upcomingAndCancelled.length > 0) {
      html += `<div class="schedule-list">${upcomingAndCancelled.map(r => eventCard(r, STATUS_CHIP)).join('')}</div>`;
    } else {
      html += `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <h3>${t('Chưa có buổi tập sắp tới','No upcoming sessions right now')}</h3>
          <p>${t('Theo dõi nhé — sự kiện mới đang được lên kế hoạch!','Check back soon — new sessions are being planned!')}</p>
        </div>`;
    }

    // Past events
    const pastAll = [...past, ...cancelled.filter(r => !isUpcoming(r.date))]
      .sort((a, b) => compareDates(b.date, a.date));

    if (pastAll.length > 0) {
      html += `
        <div class="past-section">
          <h2>${t('Đã qua','Past Events')}</h2>
          <div>${pastAll.map(pastEventItem).join('')}</div>
        </div>`;
    }

    root.innerHTML = html;
  }

  function eventCard(r, STATUS_CHIP) {
    const statusChip = STATUS_CHIP[(r.status || 'upcoming').toLowerCase()] || STATUS_CHIP.upcoming;

    const meetingBtn = r.meeting_link
      ? `<div class="event-card__link">
           <a href="${escHtml(r.meeting_link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
             ${t('Tham gia Online →','Join Online →')}
           </a>
         </div>`
      : '';

    return `
      <div class="event-card">
        <div class="event-card__date-badge" aria-label="${formatDate(r.date)}">
          <span class="month">${monthAbbr(r.date)}</span>
          <span class="day">${dayNum(r.date)}</span>
        </div>
        <div class="event-card__body">
          <div class="event-card__title">
            ${escHtml(r.title || 'Untitled Event')}
            ${statusChip}
          </div>
          <div class="event-card__info">
            ${r.time     ? `<span>🕐 ${escHtml(r.time)}</span>` : ''}
            ${r.location ? `<span>📍 ${escHtml(r.location)}</span>` : ''}
          </div>
          ${r.description ? `<p class="event-card__desc">${escHtml(r.description)}</p>` : ''}
          ${meetingBtn}
        </div>
      </div>`;
  }

  function pastEventItem(r) {
    return `
      <div class="past-event-item">
        <span class="past-event-item__date">${formatDate(r.date)}</span>
        <div class="past-event-item__body">
          <span class="past-event-item__title">${escHtml(r.title || 'Untitled Event')}${
            (r.status || '').toLowerCase() === 'cancelled'
              ? ' <span class="chip chip-error">Cancelled</span>'
              : ''
          }</span>
          ${r.description ? `<span class="past-event-item__desc">${escHtml(r.description)}</span>` : ''}
        </div>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', load);
})();
