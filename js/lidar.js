(function () {
  // ── SWITCH: set to false to disable LiDAR and show name normally ──
  const LIDAR_ENABLED = false;

  const section = document.getElementById('hero');
  const canvas  = document.getElementById('lidar-canvas');
  const nameEl  = document.getElementById('hero-name-el');
  const reveal  = document.getElementById('hero-name-reveal');
  const label   = document.getElementById('lidar-label');

  // If disabled: show name immediately, hide canvas, done.
  if (!LIDAR_ENABLED) {
    if (reveal) {
      reveal.style.transition = 'none';
      reveal.style.clipPath   = 'inset(0 0% 0 0)';
    }
    if (canvas) canvas.style.display = 'none';
    if (label)  label.style.display  = 'none';
    return;
  }

  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');

  const ACCENT_A = (a) => `rgba(10,191,188,${a})`;
  const HIT_CLR  = '#5DD9D6';
  const DOT_CLR  = '#0ABFBC';

  let W, H, sensorX, sensorY;
  let nameRect  = null;   // tight bbox around actual rendered text
  let nameRevealed  = false;
  let labelVisible  = false;

  // ── Measure actual rendered text width via canvas 2D ──
  // This gives us the real ink width, not the element's full box width.
  function measureTextRect() {
    const sr   = section.getBoundingClientRect();
    const nr   = nameEl.getBoundingClientRect();

    // element-relative origin (top-left of the h1 box in section coords)
    const elLeft = nr.left - sr.left;
    const elTop  = nr.top  - sr.top;

    // Read the computed font so we match exactly what the browser renders
    const cs       = window.getComputedStyle(nameEl);
    const fontSize = parseFloat(cs.fontSize);
    const fontStr  = `900 ${fontSize}px 'Playfair Display', Georgia, serif`;

    const mc = document.createElement('canvas').getContext('2d');
    mc.font  = fontStr;

    const text    = nameEl.textContent.trim();
    const metrics = mc.measureText(text);
    const textW   = metrics.width;

    // Text renders from the left edge of the element
    // Height: use actual element height (line-height already applied)
    const elH = nr.height;

    nameRect = {
      left:   elLeft,
      top:    elTop,
      right:  elLeft + textW,
      bottom: elTop  + elH,
      width:  textW,
      height: elH,
    };
  }

  function resize() {
    W = section.offsetWidth;
    H = section.offsetHeight;
    canvas.width  = W;
    canvas.height = H;
    sensorX = W - 52;
    sensorY = H - 42;
    measureTextRect();
  }

  // ── Ray–AABB slab test ──
  function rayHitName(angle) {
    if (!nameRect) return null;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let tMin = -Infinity, tMax = Infinity;

    if (Math.abs(dx) > 1e-10) {
      const t1 = (nameRect.left  - sensorX) / dx;
      const t2 = (nameRect.right - sensorX) / dx;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (sensorX < nameRect.left || sensorX > nameRect.right) return null;

    if (Math.abs(dy) > 1e-10) {
      const t1 = (nameRect.top    - sensorY) / dy;
      const t2 = (nameRect.bottom - sensorY) / dy;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (sensorY < nameRect.top || sensorY > nameRect.bottom) return null;

    if (tMax < tMin || tMax < 0) return null;
    const tHit = Math.max(tMin, 0);
    return { x: sensorX + tHit * dx, y: sensorY + tHit * dy };
  }

  // ── Strict point-in-nameRect guard ──
  function insideName(x, y) {
    return nameRect &&
      x >= nameRect.left && x <= nameRect.right &&
      y >= nameRect.top  && y <= nameRect.bottom;
  }

  const CYCLE_MS  = 4000;
  const POINT_TTL = 1000;

  let hitPoints = [];
  let lastSpawn = 0;

  function spawnPoints(beamAngle, ts) {
    if (ts - lastSpawn < 18) return;
    lastSpawn = ts;

    const hits = rayHitName(beamAngle);

    if (hits) {
      // First detection: reveal name and label
      if (!nameRevealed) {
        nameRevealed = true;
        reveal.style.transition = 'clip-path 0.55s ease';
        reveal.style.clipPath   = 'inset(0 0% 0 0)';
        showLabel();
      }
      // Dense point cloud strictly inside the measured text rect
      for (let k = 0; k < 14; k++) {
        const nx = nameRect.left + Math.random() * nameRect.width;
        const ny = nameRect.top  + Math.random() * nameRect.height;
        hitPoints.push({ x: nx, y: ny, born: ts, life: POINT_TTL + Math.random() * 700, onName: true });
      }
    } else {
      // Background scatter — reject any point that lands in the name bbox
      for (let i = 0; i < 3; i++) {
        const a = beamAngle + (Math.random() - 0.5) * 0.06;
        const r = 50 + Math.random() * Math.hypot(W, H) * 0.9;
        const x = sensorX + Math.cos(a) * r;
        const y = sensorY + Math.sin(a) * r;
        if (x > 0 && x < W && y > 0 && y < H && !insideName(x, y)) {
          hitPoints.push({ x, y, born: ts, life: POINT_TTL + Math.random() * 300, onName: false });
        }
      }
    }
  }

  // ── Label: bottom-left at top-right of name, clamped to viewport ──
  function showLabel() {
    if (!nameRect || labelVisible) return;
    labelVisible = true;
    measureTextRect(); // re-measure with live font

    // Force label paint so offsetWidth is real
    label.style.opacity = '0';
    label.style.left    = '0px';
    label.style.top     = '0px';

    requestAnimationFrame(() => {
      const labelW = label.offsetWidth || 130;
      const labelH = label.offsetHeight || 22;

      // bottom-left of label = top-right of name text
      let left = nameRect.right - labelW;
      let top  = nameRect.top - labelH - 6;

      // clamp: never overflow section edges
      left = Math.max(nameRect.left, Math.min(left, W - labelW - 8));
      top  = Math.max(8, top);

      label.style.left    = left + 'px';
      label.style.top     = top  + 'px';
      label.style.opacity = '1';
    });
  }

  function drawFan(beamAngle) {
    const fanSpan  = Math.PI * 0.55;
    const fanStart = beamAngle - fanSpan;
    const diag     = Math.hypot(W, H);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sensorX, sensorY);
    ctx.arc(sensorX, sensorY, diag, fanStart, beamAngle, false);
    ctx.closePath();
    const g = ctx.createRadialGradient(sensorX, sensorY, 0, sensorX, sensorY, diag);
    g.addColorStop(0,   ACCENT_A(0.10));
    g.addColorStop(0.3, ACCENT_A(0.04));
    g.addColorStop(1,   ACCENT_A(0));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function drawBeam(angle) {
    const diag = Math.hypot(W, H);
    const ex   = sensorX + Math.cos(angle) * diag;
    const ey   = sensorY + Math.sin(angle) * diag;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sensorX, sensorY);
    ctx.lineTo(ex, ey);
    const g = ctx.createLinearGradient(sensorX, sensorY, ex, ey);
    g.addColorStop(0,    ACCENT_A(1));
    g.addColorStop(0.10, ACCENT_A(0.65));
    g.addColorStop(0.35, ACCENT_A(0.18));
    g.addColorStop(1,    ACCENT_A(0));
    ctx.strokeStyle = g;
    ctx.lineWidth   = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  function drawPoints(ts) {
    hitPoints = hitPoints.filter(p => ts - p.born < p.life);
    for (const p of hitPoints) {
      const f = (ts - p.born) / p.life;
      const a = f < 0.08 ? f / 0.08 : f < 0.65 ? 1 : 1 - (f - 0.65) / 0.35;
      ctx.save();
      ctx.globalAlpha = a * (p.onName ? 0.95 : 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.onName ? 2.6 : 1.4, 0, Math.PI * 2);
      ctx.fillStyle   = p.onName ? HIT_CLR : DOT_CLR;
      ctx.shadowColor = p.onName ? HIT_CLR : DOT_CLR;
      ctx.shadowBlur  = p.onName ? 8 : 3;
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(ts) {
    ctx.clearRect(0, 0, W, H);
    const beamAngle = ((ts % CYCLE_MS) / CYCLE_MS) * Math.PI * 2 - Math.PI;
    drawFan(beamAngle);
    drawBeam(beamAngle);
    spawnPoints(beamAngle, ts);
    drawPoints(ts);
    requestAnimationFrame(frame);
  }

  function boot() {
    resize();
    window.addEventListener('resize', () => {
      resize();
      if (nameRevealed) {
        labelVisible = false;
        showLabel();
      }
    });
    requestAnimationFrame(frame);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
  } else {
    window.addEventListener('load', boot);
  }
})();