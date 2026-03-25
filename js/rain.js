// ── ARM EMOJI RAIN ──────────────────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('rain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const ARMS = ['\uD83D\uDCAA', '\uD83E\uDDBE', '\uD83E\uDD1B', '\u270A', '\uD83E\uDD1C',
    '\uD83D\uDCAA\uD83C\uDFFB', '\uD83D\uDCAA\uD83C\uDFFC', '\uD83D\uDCAA\uD83C\uDFFD',
    '\uD83D\uDCAA\uD83C\uDFFE', '\uD83D\uDCAA\uD83C\uDFFF'];
  const drops = [];
  const MAX_DROPS = 45;

  function spawnDrop() {
    if (drops.length >= MAX_DROPS) return;
    drops.push({
      x: Math.random() * W,
      y: -40,
      speed: 0.4 + Math.random() * 1.2,
      size: 16 + Math.random() * 24,
      opacity: 0.08 + Math.random() * 0.18,
      emoji: ARMS[Math.floor(Math.random() * ARMS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      drift: (Math.random() - 0.5) * 0.3,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    if (Math.random() < 0.12) spawnDrop();

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.speed;
      d.x += d.drift;
      d.rotation += d.rotSpeed;

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.globalAlpha = d.opacity;
      ctx.font = d.size + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.emoji, 0, 0);
      ctx.restore();

      if (d.y > H + 60 || d.x < -60 || d.x > W + 60) {
        drops.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  // Pre-fill some drops
  for (let i = 0; i < 20; i++) {
    spawnDrop();
    drops[drops.length - 1].y = Math.random() * H;
  }
  animate();

  // ── TOUCH RIPPLE ────────────────────────────────────────────────────────────
  document.addEventListener('touchstart', function(e) {
    const ripple = document.createElement('div');
    ripple.style.cssText =
      'position:fixed;z-index:100;pointer-events:none;' +
      'width:30px;height:30px;border-radius:50%;' +
      'border:1.5px solid rgba(200,245,98,0.4);' +
      'left:' + (e.touches[0].clientX - 15) + 'px;' +
      'top:' + (e.touches[0].clientY - 15) + 'px;' +
      'animation:touchRipple 0.6s ease-out forwards;';
    document.body.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 600);
  }, { passive: true });
})();
