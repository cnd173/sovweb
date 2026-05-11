// Practice page — breathing triangle + vocal warm-up launcher

(function () {

  // ══════════════════════════════════════════════════════════════
  //  BREATHING TRIANGLE
  // ══════════════════════════════════════════════════════════════

  // Triangle vertices (match SVG viewBox 0 0 300 290)
  const V = {
    top: { x: 150, y: 24  },
    br:  { x: 284, y: 258 },
    bl:  { x: 16,  y: 258 },
  };

  // Phases: from vertex → to vertex, highlight colour, display label
  const PHASES = [
    { from: 'bl',  to: 'top', color: '#81B29A', label: 'Inhale'  },
    { from: 'top', to: 'br',  color: '#F2CC8F', label: 'Hold'    },
    { from: 'br',  to: 'bl',  color: '#E07A5F', label: 'Exhale'  },
  ];

  // IDs of the three SVG progress <line> elements
  const PROG_IDS = ['progress-inhale', 'progress-hold', 'progress-exhale'];
  // Start vertices for each progress line (must match SVG x1/y1 attributes)
  const PROG_STARTS = [V.bl, V.top, V.br];

  let timings  = [4, 4, 4];  // seconds [inhale, hold, exhale]
  let running  = false;
  let phaseIdx = 0;
  let phaseTs  = null;
  let rafId    = null;

  const svgDot   = document.getElementById('breath-dot');
  const svgPhase = document.getElementById('breath-phase-label');
  const svgCount = document.getElementById('breath-countdown');
  const startBtn = document.getElementById('breath-start-btn');
  const progEls  = PROG_IDS.map(id => document.getElementById(id));

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Set every progress line back to a zero-length line at its start vertex
  function resetProgress() {
    progEls.forEach((el, i) => {
      const s = PROG_STARTS[i];
      el.setAttribute('x1', s.x); el.setAttribute('y1', s.y);
      el.setAttribute('x2', s.x); el.setAttribute('y2', s.y);
    });
  }

  function applyPhaseStyle(idx) {
    const ph = PHASES[idx];
    svgPhase.textContent = ph.label;
    svgDot.setAttribute('fill', ph.color);
    svgDot.setAttribute('filter', 'url(#dot-glow)');
  }

  function tick(ts) {
    if (phaseTs === null) phaseTs = ts;
    const elapsed = (ts - phaseTs) / 1000;
    const dur = timings[phaseIdx];
    const t   = Math.min(elapsed / dur, 1);
    const ph  = PHASES[phaseIdx];
    const from = V[ph.from], to = V[ph.to];

    // Move dot along current side
    svgDot.setAttribute('cx', lerp(from.x, to.x, t));
    svgDot.setAttribute('cy', lerp(from.y, to.y, t));

    // Grow the progress line for this phase
    const pl = progEls[phaseIdx];
    pl.setAttribute('x2', lerp(from.x, to.x, t));
    pl.setAttribute('y2', lerp(from.y, to.y, t));

    // Countdown
    svgCount.textContent = t < 1 ? Math.ceil(dur * (1 - t)) : '';

    // Phase complete → advance
    if (t >= 1) {
      phaseTs = ts;
      const next = (phaseIdx + 1) % 3;
      if (next === 0) resetProgress();   // new cycle: clear drawn lines
      phaseIdx = next;
      applyPhaseStyle(phaseIdx);
    }

    if (running) rafId = requestAnimationFrame(tick);
  }

  function startBreath() {
    running  = true;
    phaseIdx = 0;
    phaseTs  = null;
    resetProgress();
    svgDot.setAttribute('cx', V.bl.x);
    svgDot.setAttribute('cy', V.bl.y);
    applyPhaseStyle(0);
    startBtn.textContent = 'Stop';
    startBtn.dataset.active = '1';
    rafId = requestAnimationFrame(tick);
  }

  function stopBreath() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    resetProgress();
    svgDot.setAttribute('cx', V.bl.x);
    svgDot.setAttribute('cy', V.bl.y);
    svgDot.setAttribute('fill', 'var(--color-primary)');
    svgDot.removeAttribute('filter');
    svgPhase.textContent = 'Ready';
    svgCount.textContent = '';
    startBtn.textContent = 'Start';
    delete startBtn.dataset.active;
  }

  startBtn.addEventListener('click', () => running ? stopBreath() : startBreath());

  // ── Preset buttons ─────────────────────────────────────────
  document.querySelectorAll('.breath-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const was = running;
      if (running) stopBreath();
      timings = [+btn.dataset.inhale, +btn.dataset.hold, +btn.dataset.exhale];
      document.querySelectorAll('.breath-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncVals();
      if (was) startBreath();
    });
  });

  // ── Custom ± adjusters ─────────────────────────────────────
  document.querySelectorAll('.timing-adj').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = +btn.dataset.phase, d = +btn.dataset.delta;
      timings[p] = Math.max(1, Math.min(60, timings[p] + d));
      document.querySelectorAll('.breath-preset').forEach(b => b.classList.remove('active'));
      syncVals();
    });
  });

  function syncVals() {
    document.querySelectorAll('.timing-val').forEach(el => {
      el.textContent = timings[+el.dataset.phase];
    });
  }


  // ══════════════════════════════════════════════════════════════
  //  VOCAL WARM-UP
  // ══════════════════════════════════════════════════════════════

  /**
   * Extract an 11-character YouTube video ID from any of these formats:
   *   https://www.youtube.com/watch?v=ID
   *   https://youtu.be/ID
   *   https://www.youtube.com/embed/ID
   *   Just the raw ID itself (11 chars)
   * Returns null if nothing recognisable is found.
   */
  function extractYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    // Already a bare ID (11 alphanumeric/dash/underscore chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  const warmupVideos = (VOICECLUB_CONFIG.practice || {}).warmupVideos || [];
  const warmupGrid   = document.getElementById('warmup-grid');

  // Render buttons — grey out ones with no URL configured yet
  warmupGrid.innerHTML = warmupVideos.map(v => {
    const id       = extractYouTubeId(v.url || '');
    const disabled = id ? '' : ' warmup-btn--empty';
    const title    = id ? '' : ` title="Add a YouTube URL for this duration in js/config.js"`;
    return `
    <button class="warmup-btn${disabled}"${title} data-yt-id="${escHtml(id || '')}" data-label="${escHtml(v.label)}">
      <span class="warmup-btn__play">${id ? '▶' : '＋'}</span>
      <span class="warmup-btn__label">${escHtml(v.label)}</span>
    </button>`;
  }).join('');

  // YouTube modal
  const modal    = document.getElementById('warmup-modal');
  const iframe   = document.getElementById('warmup-iframe');
  const closeBtn = document.getElementById('warmup-close');

  warmupGrid.querySelectorAll('.warmup-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.ytId;
      if (!id) return;  // not configured yet — do nothing
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('modal--open');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.querySelector('.modal__backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();
