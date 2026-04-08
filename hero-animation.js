/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   SPIRITUAL ROMEO â CINEMATIC HERO ENGINE
   hero-animation.js  |  Dennis Nickens  |  2026

   6-Layer Canvas Architecture (back â front):
   âââââââââââââââââââââââââââââââââââââââââââââ
   L1  Aurora nebula      â slow drifting light clouds
   L2  Star field         â 200 twinkling micro-stars
   L3  Connection network â pulsing node graph + radial waves
   L4  Energy arcs        â occasional arcing light beams
   L5  Dust particles     â rising foreground embers
   L6  Central orb        â glowing core with corona rings

   All layers carry independent parallax coefficients.
   Mouse proximity illuminates nearby nodes.
   Click anywhere fires a localized pulse.
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

(function () {
  'use strict';

  /* ââ CONFIGURATION âââââââââââââââââââââââââââââââ */
  const CFG = {
    aurora:   { count: 7,  speed: 0.00045, parallax: 0.06 },
    stars:    { count: 200, parallax: 0.10 },
    network:  { count: 60, maxDist: 158, parallax: 0.28 },
    arcs:     { minInterval: 3200, maxInterval: 6500, maxActive: 3 },
    dust:     { count: 40, parallax: 0.48 },
    orb:      { baseR: 16 },
    pulse:    { speed: 0.024, interval: 95 }, // frames between auto-pulses
  };

  /* ââ CANVAS SETUP ââââââââââââââââââââââââââââââââ */
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return; // Guard: element must exist

  const ctx = canvas.getContext('2d');

  // Off-screen aurora canvas (updated at Â½ rate â cheaper)
  const auroraOff = document.createElement('canvas');
  const auroraCtx = auroraOff.getContext('2d');

  let W = 0, H = 0;

  // Retina / HiDPI support
  const DPR = Math.min(window.devicePixelRatio || 1, 2); // cap at 2Ã to save GPU memory

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cw   = rect.width  || window.innerWidth;
    const ch   = rect.height || window.innerHeight;

    // Set physical pixel dimensions
    canvas.width     = auroraOff.width  = cw * DPR;
    canvas.height    = auroraOff.height = ch * DPR;

    // Scale all draw calls so coordinates stay in CSS pixels
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    auroraCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    W = cw;
    H = ch;
    buildScenes(); // Rebuild node positions relative to new canvas size
  }

  /* ââ SCROLL STATE ââââââââââââââââââââââââââââââââ */
  let scrollY   = 0;
  let mouseX    = -9999;
  let mouseY    = -9999;

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  // Lenis integration â picks up smoothed scroll position
  function connectLenis() {
    if (window._lenis) {
      window._lenis.on('scroll', ({ scroll }) => { scrollY = scroll; });
    } else {
      setTimeout(connectLenis, 300); // retry until Lenis is ready
    }
  }
  connectLenis();

  /* ââ CLICK â LOCAL PULSE âââââââââââââââââââââââââ */
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    clickPulses.push({ cx, cy, t: 0, alpha: 1 });
  });
  let clickPulses = [];

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     LAYER 1 â AURORA NEBULA BLOBS
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  class AuroraBlob {
    constructor(i) {
      this.angle     = (i / CFG.aurora.count) * Math.PI * 2 + Math.random() * 0.5;
      this.dist      = Math.min(W || 900, H || 700) * (0.22 + Math.random() * 0.32);
      this.speed     = (Math.random() < 0.5 ? 1 : -1) * CFG.aurora.speed * (0.6 + Math.random() * 0.8);
      this.size      = (Math.min(W || 900, H || 700) * 0.3) + Math.random() * 180;
      this.alpha     = 0.04 + Math.random() * 0.10;
      // Colour family: purple Â· blue Â· cyan
      const fam = Math.random();
      if      (fam < 0.45) this.rgb = [124, 58, 237];   // purple
      else if (fam < 0.80) this.rgb = [ 59, 130, 246];  // blue
      else                 this.rgb = [  6, 182, 212];   // cyan
    }
    get cx() { return W / 2 + Math.cos(this.angle) * this.dist; }
    get cy() { return H / 2 + Math.sin(this.angle) * this.dist; }
    update() { this.angle += this.speed; }
    draw(ctx2, parallaxOffset) {
      const [r, g, b] = this.rgb;
      const py = this.cy + parallaxOffset;
      const grd = ctx2.createRadialGradient(this.cx, py, 0, this.cx, py, this.size);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${this.alpha})`);
      grd.addColorStop(0.55,`rgba(${r},${g},${b},${this.alpha * 0.4})`);
      grd.addColorStop(1,   'transparent');
      ctx2.beginPath();
      ctx2.arc(this.cx, py, this.size, 0, Math.PI * 2);
      ctx2.fillStyle = grd;
      ctx2.fill();
    }
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     LAYER 2 â STAR FIELD
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  class Star {
    constructor() {
      this.x      = Math.random() * (W || 1400);
      this.y      = Math.random() * (H || 900);
      this.r      = Math.random() * 1.15 + 0.25;
      this.vx     = (Math.random() - 0.5) * 0.12;
      this.vy     = (Math.random() - 0.5) * 0.12;
      this.base   = 0.08 + Math.random() * 0.45;
      this.phase  = Math.random() * Math.PI * 2;
      this.twinkle= 0.012 + Math.random() * 0.018;
      // Occasional colour tint
      const t = Math.random();
      this.tint = t < 0.15 ? `rgba(168,85,247,` : t < 0.25 ? `rgba(59,130,246,` : `rgba(255,255,255,`;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.phase += this.twinkle;
      if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
    }
    draw(ctx2, parallaxOffset) {
      const a = this.base * (0.55 + Math.sin(this.phase) * 0.45);
      ctx2.beginPath();
      ctx2.arc(this.x, this.y + parallaxOffset, this.r, 0, Math.PI * 2);
      ctx2.fillStyle = `${this.tint}${a})`;
      ctx2.fill();
    }
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     LAYER 3 â NODE NETWORK
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  class NetworkNode {
    constructor(forced) {
      // forced=true â place close to center (inner cluster)
      const inner = forced || Math.random() < 0.2;
      this.angle     = Math.random() * Math.PI * 2;
      this.dist      = inner
        ? 20 + Math.random() * 90
        : 70 + Math.random() * Math.min(W || 900, H || 700) * 0.36;
      this.orbitSpd  = (Math.random() - 0.5) * 0.0022;
      this.r         = Math.random() * 2.6 + 1.0;
      this.col       = Math.random() < 0.62 ? [124, 58, 237] : [59, 130, 246];
      this.lit       = 0;
      this.phase     = Math.random() * Math.PI * 2;
      this.phaseSpd  = 0.014 + Math.random() * 0.022;
    }
    get x() { return W / 2 + Math.cos(this.angle) * this.dist; }
    get y() { return H / 2 + Math.sin(this.angle) * this.dist; }
    update() {
      this.angle += this.orbitSpd;
      this.phase += this.phaseSpd;
      this.lit = Math.max(0, this.lit - 0.013);
      // Mouse hover illumination
      const dx = this.x - mouseX;
      const dy = (this.y + scrollY * CFG.network.parallax * -1) - mouseY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 185) this.lit = Math.max(this.lit, (1 - d / 185) * 0.95);
    }
    draw(ctx2, parallaxOffset) {
      const pulse = Math.sin(this.phase) * 0.4 + 0.6;
      const a     = 0.22 + pulse * 0.22 + this.lit * 0.56;
      const r     = this.r + this.lit * 5.5;
      const [cr, cg, cb] = this.col;
      const py    = this.y + parallaxOffset;

      if (this.lit > 0.06) {
        const grd = ctx2.createRadialGradient(this.x, py, 0, this.x, py, r * 7);
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${this.lit * 0.38})`);
        grd.addColorStop(1, 'transparent');
        ctx2.beginPath();
        ctx2.arc(this.x, py, r * 7, 0, Math.PI * 2);
        ctx2.fillStyle = grd;
        ctx2.fill();
      }
      ctx2.beginPath();
      ctx2.arc(this.x, py, r, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
      ctx2.fill();
    }
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     LAYER 4 â ENERGY ARCS
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  class EnergyArc {
    constructor() {
      // Pick two random edge points â arc toward center
      const pick = () => {
        const e = Math.floor(Math.random() * 4);
        if (e === 0) return { x: Math.random() * W, y: -30 };
        if (e === 1) return { x: W + 30, y: Math.random() * H };
        if (e === 2) return { x: Math.random() * W, y: H + 30 };
        return { x: -30, y: Math.random() * H };
      };
      const a = pick();
      const b = pick();
      this.sx = a.x; this.sy = a.y;
      this.ex = b.x; this.ey = b.y;
      // Control point biased toward canvas center
      this.cpx = W * 0.2 + Math.random() * W * 0.6 + (Math.random() - 0.5) * 180;
      this.cpy = H * 0.2 + Math.random() * H * 0.6 + (Math.random() - 0.5) * 180;
      this.t        = 0;
      this.speed    = 0.0055 + Math.random() * 0.006;
      this.width    = 0.6 + Math.random() * 2.0;
      this.maxAlpha = 0.25 + Math.random() * 0.55;
      this.col      = Math.random() < 0.5 ? [168, 85, 247] : [0, 229, 255];
      this.done     = false;
      this.trail    = [];
    }
    _bezier(t) {
      const m = 1 - t;
      return {
        x: m * m * this.sx + 2 * m * t * this.cpx + t * t * this.ex,
        y: m * m * this.sy + 2 * m * t * this.cpy + t * t * this.ey,
      };
    }
    update() {
      this.t += this.speed;
      if (this.t >= 1) { this.done = true; return; }
      const pt = this._bezier(this.t);
      this.trail.unshift(pt);
      if (this.trail.length > 24) this.trail.pop();
    }
    draw(ctx2) {
      if (this.trail.length < 2) return;
      const [r, g, b] = this.col;
      const envelope  = Math.sin(this.t * Math.PI);
      const alpha     = envelope * this.maxAlpha;

      // Outer glow
      for (let i = 0; i < this.trail.length - 1; i++) {
        const frac = (1 - i / this.trail.length) * envelope;
        ctx2.beginPath();
        ctx2.moveTo(this.trail[i].x, this.trail[i].y);
        ctx2.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
        ctx2.strokeStyle = `rgba(${r},${g},${b},${frac * alpha * 0.35})`;
        ctx2.lineWidth   = this.width * 5 * frac;
        ctx2.lineCap     = 'round';
        ctx2.stroke();
      }
      // Core line (first few trail points)
      const coreLen = Math.min(this.trail.length - 1, 6);
      for (let i = 0; i < coreLen; i++) {
        const frac = 1 - i / coreLen;
        ctx2.beginPath();
        ctx2.moveTo(this.trail[i].x, this.trail[i].y);
        ctx2.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
        ctx2.strokeStyle = `rgba(${r},${g},${b},${alpha * frac})`;
        ctx2.lineWidth   = this.width * frac;
        ctx2.stroke();
      }
      // Head spark
      const head = this.trail[0];
      const sparkGrd = ctx2.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10);
      sparkGrd.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
      sparkGrd.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.6})`);
      sparkGrd.addColorStop(1, 'transparent');
      ctx2.beginPath();
      ctx2.arc(head.x, head.y, 10, 0, Math.PI * 2);
      ctx2.fillStyle = sparkGrd;
      ctx2.fill();
    }
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     LAYER 5 â DUST / EMBER PARTICLES
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  class DustParticle {
    constructor(placed) {
      this._W = W || 1200;
      this._H = H || 800;
      this.x    = Math.random() * this._W;
      this.y    = placed ? Math.random() * this._H : this._H + 10;
      this.vx   = (Math.random() - 0.5) * 0.55;
      this.vy   = -(0.25 + Math.random() * 0.7);
      this.r    = 0.5 + Math.random() * 2.2;
      this.base = 0.08 + Math.random() * 0.30;
      this.col  = Math.random() < 0.55 ? [168, 85, 247] : [59, 130, 246];
      this.life = placed ? Math.random() : 1.0;
      this.decay= 0.0015 + Math.random() * 0.0025;
    }
    reset() {
      this._W = W; this._H = H;
      this.x = Math.random() * W;
      this.y = H + 5;
      this.vx = (Math.random() - 0.5) * 0.55;
      this.vy = -(0.25 + Math.random() * 0.7);
      this.life = 1.0;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.life -= this.decay;
      if (this.y < -10 || this.life <= 0) this.reset();
    }
    draw(ctx2, parallaxOffset) {
      const [r, g, b] = this.col;
      const a = this.base * this.life;
      ctx2.beginPath();
      ctx2.arc(this.x, this.y + parallaxOffset, this.r, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx2.fill();
    }
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     SCENE STATE
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  let auroraBlobs  = [];
  let stars        = [];
  let nodes        = [];
  let arcs         = [];
  let dust         = [];
  let frame        = 0;
  let nextArcAt    = 180;   // frame number for next arc spawn
  let pulseT       = 999;   // current pulse progress (>1 = inactive)
  let nextPulseAt  = CFG.pulse.interval;

  function buildScenes() {
    auroraBlobs = Array.from({ length: CFG.aurora.count },   (_, i) => new AuroraBlob(i));
    stars       = Array.from({ length: CFG.stars.count },    ()    => new Star());
    nodes       = Array.from({ length: CFG.network.count },  ()    => new NetworkNode());
    dust        = Array.from({ length: CFG.dust.count },     ()    => new DustParticle(true));
    arcs        = [];
    clickPulses = [];
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     RADIAL PULSE SYSTEM
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  function triggerPulse() { pulseT = 0; }
  function triggerClickPulse(cx, cy) { clickPulses.push({ cx, cy, t: 0 }); }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     MAIN RENDER LOOP
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  function loop() {
    requestAnimationFrame(loop);
    frame++;

    // â Parallax offsets for each layer âââââââââââââ
    const sY   = scrollY;
    const aP   = -sY * CFG.aurora.parallax;
    const stP  = -sY * CFG.stars.parallax;
    const nP   = -sY * CFG.network.parallax;
    const dP   = -sY * CFG.dust.parallax;

    // â Clear main canvas âââââââââââââââââââââââââââ
    ctx.clearRect(0, 0, W, H);

    // â LAYER 1: Aurora (off-screen, every 2 frames) â
    if (frame % 2 === 0) {
      auroraCtx.clearRect(0, 0, W, H);
      auroraBlobs.forEach(b => { b.update(); b.draw(auroraCtx, aP); });
    }
    ctx.drawImage(auroraOff, 0, 0);

    // â LAYER 2: Stars ââââââââââââââââââââââââââââââ
    stars.forEach(s => { s.update(); s.draw(ctx, stP); });

    // â LAYER 3: Node network âââââââââââââââââââââââ
    // Auto-pulse timer
    if (frame >= nextPulseAt) {
      triggerPulse();
      nextPulseAt = frame + CFG.pulse.interval + Math.floor(Math.random() * 50);
    }
    pulseT += CFG.pulse.speed;

    const pulseR = pulseT * Math.min(W, H) * 0.56;
    const pulseA = Math.max(0, 1 - pulseT * 1.05);

    if (pulseA > 0) {
      const cx = W / 2, cy = H / 2 + nP;
      const grd = ctx.createRadialGradient(cx, cy, pulseR * 0.72, cx, cy, pulseR);
      grd.addColorStop(0,    'transparent');
      grd.addColorStop(0.65, `rgba(124,58,237,${pulseA * 0.16})`);
      grd.addColorStop(1,    'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Light up nodes swept by pulse ring
    nodes.forEach(n => {
      const dx = n.x - W / 2, dy = n.y - H / 2;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(d - pulseR) < 40 && pulseA > 0) {
        n.lit = Math.max(n.lit, pulseA * 1.15);
      }
    });

    // Click pulses
    clickPulses = clickPulses.filter(p => p.t < 1);
    clickPulses.forEach(p => {
      p.t += 0.032;
      const cR = p.t * Math.min(W, H) * 0.4;
      const cA = Math.max(0, 1 - p.t * 1.2);
      const grd = ctx.createRadialGradient(p.cx, p.cy, cR * 0.5, p.cx, p.cy, cR);
      grd.addColorStop(0,    'transparent');
      grd.addColorStop(0.7,  `rgba(168,85,247,${cA * 0.25})`);
      grd.addColorStop(1,    'transparent');
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, cR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      // Light up nearby nodes on click
      nodes.forEach(n => {
        const dx = n.x - p.cx, dy = n.y - p.cy;
        if (Math.abs(Math.sqrt(dx * dx + dy * dy) - cR) < 50 && cA > 0) {
          n.lit = Math.max(n.lit, cA * 1.3);
        }
      });
    });

    // Draw connections between nodes
    const MAXD = CFG.network.maxDist;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const dx = ni.x - nj.x, dy = ni.y - nj.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d >= MAXD) continue;
        const t   = 1 - d / MAXD;
        const lit = Math.max(ni.lit, nj.lit);
        const a   = t * (0.10 + lit * 0.50);
        const grad = ctx.createLinearGradient(ni.x, ni.y + nP, nj.x, nj.y + nP);
        grad.addColorStop(0, `rgba(124,58,237,${a})`);
        grad.addColorStop(1, `rgba(59,130,246,${a})`);
        ctx.beginPath();
        ctx.moveTo(ni.x, ni.y + nP);
        ctx.lineTo(nj.x, nj.y + nP);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = lit > 0.35 ? 1.5 : 0.6;
        ctx.stroke();
      }
    }

    nodes.forEach(n => { n.update(); n.draw(ctx, nP); });

    // â LAYER 4: Energy arcs ââââââââââââââââââââââââ
    if (frame >= nextArcAt && arcs.length < CFG.arcs.maxActive) {
      arcs.push(new EnergyArc());
      nextArcAt = frame + Math.floor(
        CFG.arcs.minInterval / 16.67 +
        Math.random() * ((CFG.arcs.maxInterval - CFG.arcs.minInterval) / 16.67)
      );
    }
    arcs = arcs.filter(a => !a.done);
    arcs.forEach(a => { a.update(); a.draw(ctx); });

    // â LAYER 5: Dust / embers ââââââââââââââââââââââ
    dust.forEach(d => { d.update(); d.draw(ctx, dP); });

    // â LAYER 6: Central orb ââââââââââââââââââââââââ
    const cx   = W / 2;
    const cy   = H / 2 + nP;
    const orbP = Math.sin(frame * 0.032) * 0.5 + 0.5;
    const orbR = CFG.orb.baseR + orbP * 9;

    // Outer corona rings (3 nested glows)
    for (let ring = 0; ring < 3; ring++) {
      const rScale = (ring + 1) * 1.8;
      const rA     = (0.18 - ring * 0.045) * (0.6 + orbP * 0.4);
      const grd    = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * rScale * 3);
      grd.addColorStop(0,   `rgba(168,85,247,${rA})`);
      grd.addColorStop(0.45,`rgba(59,130,246,${rA * 0.5})`);
      grd.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * rScale * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Orb body
    const orbGrd = ctx.createRadialGradient(cx - orbR * 0.3, cy - orbR * 0.3, 0, cx, cy, orbR);
    orbGrd.addColorStop(0,   'rgba(255,255,255,1)');
    orbGrd.addColorStop(0.35,'rgba(220,200,255,0.95)');
    orbGrd.addColorStop(1,   'rgba(124,58,237,0.8)');
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.fillStyle = orbGrd;
    ctx.fill();
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     REDUCED MOTION â minimal static version
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.5);
    grd.addColorStop(0,   'rgba(124,58,237,0.3)');
    grd.addColorStop(0.6, 'rgba(59,130,246,0.12)');
    grd.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  /* ââââââââââââââââââââââââââââââââââââââââââââââââ
     BOOT
  ââââââââââââââââââââââââââââââââââââââââââââââââ */
  resize();
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas.parentElement);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawStatic();
  } else {
    buildScenes();
    loop();
  }

  // Signal to style.js that this engine owns the canvas
  window.SR_HERO_READY = true;

  console.log('%c SR Hero Engine loaded â 6 layers active ', 'background:#7C3AED;color:#fff;padding:3px 8px;border-radius:4px;');

})();
