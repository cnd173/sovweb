// Practice page — breathing triangle + exhale timer + vocal warm-up launcher

document.addEventListener('DOMContentLoaded', function () {

  // ══════════════════════════════════════════════════════════════
  //  BREATHING TRIANGLE
  // ══════════════════════════════════════════════════════════════
  (function initBreathing() {
    // Triangle vertices (match SVG viewBox 0 0 300 300)
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

    const PROG_IDS    = ['progress-inhale', 'progress-hold', 'progress-exhale'];
    const PROG_STARTS = [V.bl, V.top, V.br];

    let timings  = [4, 4, 4];
    let running  = false;
    let phaseIdx = 0;
    let phaseTs  = null;
    let rafId    = null;

    const svgDot   = document.getElementById('breath-dot');
    const svgPhase = document.getElementById('breath-phase-label');
    const svgCount = document.getElementById('breath-countdown');
    const startBtn = document.getElementById('breath-start-btn');
    const progEls  = PROG_IDS.map(id => document.getElementById(id));

    if (!svgDot || !svgPhase || !svgCount || !startBtn || progEls.some(e => !e)) {
      console.warn('Breathing triangle: some elements missing, skipping init.');
      return;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

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

      svgDot.setAttribute('cx', lerp(from.x, to.x, t));
      svgDot.setAttribute('cy', lerp(from.y, to.y, t));

      const pl = progEls[phaseIdx];
      pl.setAttribute('x2', lerp(from.x, to.x, t));
      pl.setAttribute('y2', lerp(from.y, to.y, t));

      svgCount.textContent = t < 1 ? Math.ceil(dur * (1 - t)) : '';

      if (t >= 1) {
        phaseTs = ts;
        const next = (phaseIdx + 1) % 3;
        if (next === 0) resetProgress();
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
  })();


  // ══════════════════════════════════════════════════════════════
  //  EXHALE TIMER
  // ══════════════════════════════════════════════════════════════
  (function initExhaleTimer() {
    const exhaleTimeEl  = document.getElementById('exhale-time');
    const exhaleBtn     = document.getElementById('exhale-btn');
    const exhaleResult  = document.getElementById('exhale-result');
    const exhaleResVal  = document.getElementById('exhale-result-val');
    const exhaleBestEl  = document.getElementById('exhale-best');

    if (!exhaleTimeEl || !exhaleBtn || !exhaleResult || !exhaleResVal || !exhaleBestEl) {
      console.warn('Exhale timer: some elements missing, skipping init.');
      return;
    }

    let exhaleRunning = false;
    let exhaleStartTs = null;
    let exhaleRafId   = null;
    let exhaleBest    = 0;

    function exhaleFrame(ts) {
      if (exhaleStartTs === null) exhaleStartTs = ts;
      const secs = (ts - exhaleStartTs) / 1000;
      exhaleTimeEl.textContent = secs.toFixed(1);
      if (exhaleRunning) exhaleRafId = requestAnimationFrame(exhaleFrame);
    }

    exhaleBtn.addEventListener('click', function () {
      if (!exhaleRunning) {
        // ── Start ──
        exhaleRunning  = true;
        exhaleStartTs  = null;
        exhaleTimeEl.textContent = '0.0';
        exhaleTimeEl.classList.add('running');
        exhaleResult.hidden = true;
        exhaleBtn.textContent = 'Stop';
        exhaleBtn.classList.add('btn-primary');
        exhaleBtn.classList.remove('btn-outline');
        exhaleRafId = requestAnimationFrame(exhaleFrame);
      } else {
        // ── Stop ──
        exhaleRunning = false;
        if (exhaleRafId) { cancelAnimationFrame(exhaleRafId); exhaleRafId = null; }
        exhaleTimeEl.classList.remove('running');

        const secs = parseFloat(exhaleTimeEl.textContent);
        exhaleResVal.textContent = secs.toFixed(1) + ' sec';
        exhaleResult.hidden = false;

        if (secs > exhaleBest) {
          exhaleBest = secs;
        }
        exhaleBestEl.textContent = '🏅 Best this session: ' + exhaleBest.toFixed(1) + ' sec';
        exhaleBestEl.hidden = false;

        exhaleBtn.textContent = 'Try Again';
        exhaleBtn.classList.remove('btn-primary');
        exhaleBtn.classList.add('btn-outline');
      }
    });
  })();


  // ══════════════════════════════════════════════════════════════
  //  VOCAL WARM-UP
  // ══════════════════════════════════════════════════════════════
  (function initWarmup() {
    var modal    = document.getElementById('warmup-modal');
    var iframe   = document.getElementById('warmup-iframe');
    var closeBtn = document.getElementById('warmup-close');

    if (!modal || !iframe || !closeBtn) return;

    function openModal(ytId) {
      iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0';
      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('modal--open');
      iframe.src = '';
      document.body.style.overflow = '';
    }

    // Attach click handlers to all warmup buttons already in the HTML
    document.querySelectorAll('#warmup-grid .warmup-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.ytId;
        if (id) openModal(id);
      });
    });

    closeBtn.addEventListener('click', closeModal);
    var backdrop = modal.querySelector('.modal__backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  })();

});
