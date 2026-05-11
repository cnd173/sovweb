// Photos & Videos page — lists files from a public Google Drive folder via Drive API v3

(function () {
  const root    = document.getElementById('photos-root');
  const filters = document.getElementById('photos-filters');
  const counter = document.getElementById('photos-counter');

  let allFiles  = [];
  let activeTab = 'all';

  function load() {
    const { scriptUrl } = VOICECLUB_CONFIG.photos;

    showLoading(root, 6, 'card');

    fetch(scriptUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        allFiles = data.files || [];
        renderFilters();
        renderGrid('all');
      })
      .catch(err => {
        root.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">⚠️</div>
            <h3>Couldn't load media</h3>
            <p>The Google Drive folder may be empty or the script may need re-deploying.<br><small style="font-family:monospace">${escHtml(err.message)}</small></p>
            <button class="btn btn-outline btn-sm" onclick="location.reload()">Try Again</button>
          </div>`;
      });
  }

  function renderFilters() {
    const photos = allFiles.filter(f => f.mimeType.startsWith('image/')).length;
    const videos = allFiles.filter(f => f.mimeType.startsWith('video/')).length;

    filters.innerHTML = `
      <button class="photo-filter active" data-tab="all">All (${allFiles.length})</button>
      ${photos ? `<button class="photo-filter" data-tab="photo">Photos (${photos})</button>` : ''}
      ${videos ? `<button class="photo-filter" data-tab="video">Videos (${videos})</button>` : ''}
    `;

    filters.querySelectorAll('.photo-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.querySelectorAll('.photo-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGrid(btn.dataset.tab);
      });
    });
  }

  function renderGrid(tab) {
    activeTab = tab;
    const files = allFiles.filter(f => {
      if (tab === 'photo') return f.mimeType.startsWith('image/');
      if (tab === 'video') return f.mimeType.startsWith('video/');
      return true;
    });

    if (files.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📷</div>
          <h3>Nothing here yet</h3>
          <p>Upload photos or videos to the Google Drive folder and they'll appear automatically.</p>
        </div>`;
      counter.textContent = '';
      return;
    }

    counter.textContent = `${files.length} item${files.length !== 1 ? 's' : ''}`;

    root.innerHTML = `<div class="photo-grid">${files.map(mediaCard).join('')}</div>`;

    // Lightbox for images
    root.querySelectorAll('.photo-card[data-type="image"]').forEach(card => {
      card.addEventListener('click', () => openLightbox(card.dataset.id, card.dataset.name));
    });

    // Detect orientation from thumbnail dimensions
    applyAspectDetection();
  }

  function mediaCard(f) {
    const isVideo  = f.mimeType.startsWith('video/');
    const thumbSrc = f.thumbnailLink
      ? f.thumbnailLink.replace(/=s\d+$/, '=s400')
      : `https://lh3.googleusercontent.com/d/${f.id}=s400`;
    const label   = escHtml(f.name.replace(/\.[^.]+$/, '')); // used for alt/title only
    const dateStr = f.createdTime ? formatDate(f.createdTime.slice(0, 10)) : '';
    const caption = dateStr ? `<div class="photo-card__date">${dateStr}</div>` : '';

    if (isVideo) {
      return `
        <a class="photo-card photo-card--video" href="https://drive.google.com/file/d/${f.id}/view" target="_blank" rel="noopener noreferrer" title="${label}">
          <div class="photo-card__thumb">
            <img src="${escHtml(thumbSrc)}" alt="${label}" loading="lazy" onerror="this.closest('.photo-card__thumb').classList.add('no-thumb')"/>
            <div class="photo-card__play">▶</div>
          </div>
          ${caption}
        </a>`;
    }

    return `
      <div class="photo-card" data-type="image" data-id="${f.id}" data-name="${label}" title="${label}" role="button" tabindex="0">
        <div class="photo-card__thumb">
          <img src="https://lh3.googleusercontent.com/d/${f.id}=s400" alt="${label}" loading="lazy" onerror="this.closest('.photo-card__thumb').classList.add('no-thumb')"/>
        </div>
        ${caption}
      </div>`;
  }

  // ── Orientation detection ─────────────────────────────────
  // Videos: always landscape 16:9. Phone cameras store rotation as metadata so
  // the raw thumbnail pixels are often portrait even for landscape recordings —
  // thumbnail dimensions can't be trusted for videos.
  //
  // Photos: detect orientation from the thumbnail's natural pixel dimensions.
  function applyAspectDetection() {

    // ── Videos → always landscape ────────────────────────────
    root.querySelectorAll('.photo-card--video').forEach(card => {
      card.classList.add('photo-card--landscape');
      card.querySelector('.photo-card__thumb')?.classList.add('thumb--landscape');
    });

    // ── Photos → detect from thumbnail pixels ────────────────
    root.querySelectorAll('.photo-card[data-type="image"] .photo-card__thumb img').forEach(img => {
      function detect() {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        const thumb = img.closest('.photo-card__thumb');
        const card  = img.closest('.photo-card');
        if (!thumb || !card) return;

        if (w > h * 1.15) {
          card.classList.add('photo-card--landscape');
          thumb.classList.add('thumb--landscape');
        } else if (h > w * 1.15) {
          card.classList.add('photo-card--portrait');
          thumb.classList.add('thumb--portrait');
        }
        // else: roughly square → keep default 1:1
      }

      if (img.complete && img.naturalWidth) {
        detect();
      } else {
        img.addEventListener('load', detect);
        img.addEventListener('error', () => {});
      }
    });
  }

  // ── Lightbox ──────────────────────────────────────────────
  function openLightbox(fileId, name) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <div class="lightbox__content">
        <button class="lightbox__close" aria-label="Close">✕</button>
        <img class="lightbox__img" src="https://lh3.googleusercontent.com/d/${fileId}" alt="${escHtml(name)}" />
        <div class="lightbox__caption">${escHtml(name)}</div>
        <a class="lightbox__open-link" href="https://drive.google.com/file/d/${fileId}/view" target="_blank" rel="noopener noreferrer">Open in Drive ↗</a>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('lightbox--visible'));

    const close = () => {
      overlay.classList.remove('lightbox--visible');
      setTimeout(() => overlay.remove(), 250);
    };

    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.querySelector('.lightbox__backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  document.addEventListener('DOMContentLoaded', load);
})();
