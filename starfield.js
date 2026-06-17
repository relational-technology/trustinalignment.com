// Starfield matched to The Seeker app: deep-space background stars, a few
// additive bloom stars, and the Orion constellation in the upper-center.
(function () {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1;
  let bgStars = [];
  let pulseStars = [];
  let constellation = [];
  const start = performance.now();

  // Orion layout (fractions of the constellation box), from the app.
  const ORION = [
    [0.50, 0.05], // Meissa
    [0.30, 0.28], // Betelgeuse
    [0.70, 0.24], // Bellatrix
    [0.38, 0.52], // Mintaka
    [0.50, 0.55], // Alnilam
    [0.62, 0.58], // Alnitak
    [0.40, 0.88], // Saiph
    [0.74, 0.83], // Rigel
  ];
  const ORION_LINES = [[0,1],[0,2],[1,3],[2,5],[3,4],[4,5],[5,6],[5,7]];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    const area = w * h;
    const count = Math.min(680, Math.max(220, Math.round(area / 2600)));
    bgStars = [];
    for (let i = 0; i < count; i++) {
      const large = Math.random() < 0.2;
      bgStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: large ? rand(0.6, 1.1) : rand(0.3, 0.6),
        base: rand(0.18, 0.6),
        amp: rand(0.05, 0.3),
        speed: rand(0.3, 1.1),
        phase: Math.random() * Math.PI * 2,
      });
    }
    pulseStars = [];
    for (let i = 0; i < 26; i++) {
      pulseStars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        r: rand(0.8, 1.6),
        speed: rand(0.25, 0.7),
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Constellation box: x 12%, y 4%, width 76%, height 46% (upper-center).
    const bx = w * 0.12, by = h * 0.04, bw = w * 0.76;
    const bh = Math.min(h * 0.46, 520);
    constellation = ORION.map(([fx, fy]) => ({
      x: bx + fx * bw,
      y: by + fy * bh,
      r: rand(1.1, 1.9),
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduceMotion) draw(0); // single static frame
  }

  function draw(now) {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, w, h);

    // background twinkle
    for (const s of bgStars) {
      const tw = reduceMotion ? s.base : s.base + s.amp * Math.sin(t * s.speed + s.phase);
      const a = Math.max(0, Math.min(1, tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.fill();
    }

    // additive bloom stars
    ctx.globalCompositeOperation = 'lighter';
    for (const p of pulseStars) {
      const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * p.speed + p.phase);
      const a = 0.10 + 0.35 * pulse;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      g.addColorStop(0, 'rgba(154,208,241,' + a.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(154,208,241,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Orion connecting lines (faint)
    ctx.strokeStyle = 'rgba(112,176,224,0.16)';
    ctx.lineWidth = 0.6;
    for (const [a, b] of ORION_LINES) {
      ctx.beginPath();
      ctx.moveTo(constellation[a].x, constellation[a].y);
      ctx.lineTo(constellation[b].x, constellation[b].y);
      ctx.stroke();
    }

    // Orion stars (warm, gently glowing)
    ctx.globalCompositeOperation = 'lighter';
    for (const c of constellation) {
      const tw = reduceMotion ? 0.85 : 0.7 + 0.3 * Math.sin(t * 0.8 + c.phase);
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 7);
      g.addColorStop(0, 'rgba(154,208,241,' + (0.85 * tw).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(154,208,241,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    if (!reduceMotion && running) rafId = requestAnimationFrame(draw);
  }

  let running = false;
  let rafId = 0;

  function play() {
    if (reduceMotion || running) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  }
  function pause() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause(); else play();
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  play();
})();
