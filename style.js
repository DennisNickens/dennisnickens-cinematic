/* âââââââââââââââââââââââââââââââââââââââââââââââ
   SPIRITUAL ROMEO â CINEMATIC SITES
   style.js  |  Dennis Nickens  |  2026

   Systems:
   1.  Lenis smooth scroll
   2.  GSAP ScrollTrigger â section animations
   3.  Scroll reveal (CSS fallback)
   4.  Stat counter animations
   5.  Particle canvas â handed off to hero-animation.js
       (initParticleCanvas runs only if SR_HERO_READY is false)
   6.  Booking canvas â mini cosmos
   7.  Scroll-based video scrub (ready for future video drop-in)
   8.  Nav scroll state + active link tracking
   9.  Mobile menu
   10. Store filter
   11. Notify form
âââââââââââââââââââââââââââââââââââââââââââââââ */

'use strict';

/* âââ Wait for all deferred scripts (GSAP, Lenis, hero-animation) âââ */
window.addEventListener('load', () => {
  initAll();
});

function initAll() {
  initLenis();
  initGSAP();
  initScrollReveal();
  initStatCounters();
  // Hero canvas is owned by hero-animation.js when SR_HERO_READY === true.
  // Fall back to our simple pulsing network if that engine didn't load.
  if (!window.SR_HERO_READY) {
    initParticleCanvas();
  }
  initBookingCanvas();
  // Video scrub is commented out because canvas engine is the current hero.
  // Uncomment + set .hero-scroll-track height to 500vh to activate.
  // initVideoScrub();
  initNav();
}

/* âââââââââââââââââââââââââââââââââââ
   1. LENIS SMOOTH SCROLL
âââââââââââââââââââââââââââââââââââ */
function initLenis() {
  if (typeof Lenis === 'undefined') {
    console.warn('SR: Lenis not loaded â using native scroll');
    return;
  }

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  // Tell GSAP ScrollTrigger about Lenis
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth anchor clicks
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72, duration: 1.4 });
      }
    });
  });

  window._lenis = lenis;
}

/* âââââââââââââââââââââââââââââââââââ
   2. GSAP SCROLL TRIGGER ANIMATIONS
âââââââââââââââââââââââââââââââââââ */
function initGSAP() {
  if (typeof gsap === 'undefined') {
    console.warn('SR: GSAP not loaded â animations disabled');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Hero content entrance
  const heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .from('.hero-eyebrow', { opacity: 0, y: 20, duration: .7, ease: 'power3.out' })
    .from('.hero-line-1',  { opacity: 0, y: 40, duration: .8, ease: 'power3.out' }, '-=.4')
    .from('.hero-line-2',  { opacity: 0, y: 40, duration: .8, ease: 'power3.out' }, '-=.5')
    .from('.hero-sub',     { opacity: 0, y: 24, duration: .7, ease: 'power3.out' }, '-=.4')
    .from('.hero-ctas',    { opacity: 0, y: 20, duration: .6, ease: 'power3.out' }, '-=.3')
    .from('.hero-tags',    { opacity: 0, y: 16, duration: .5, ease: 'power3.out' }, '-=.3')
    .from('.scroll-indicator', { opacity: 0, duration: 1, ease: 'power2.out' }, '-=.1');

  // Scroll-driven hero content fade as user scrolls into video
  ScrollTrigger.create({
    trigger: '.hero-scroll-track',
    start: 'top top',
    end: '15% top',
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set('.hero-content', { opacity: 1 - p * 1.8, y: p * -60 });
      gsap.set('.scroll-indicator', { opacity: Math.max(0, 1 - p * 5) });
    }
  });

  // Pillar cards horizontal stagger
  ScrollTrigger.batch('.pillar-card', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, y: 50, stagger: .15, duration: .8, ease: 'power3.out'
      });
    },
    start: 'top 85%',
    once: true
  });

  // Process steps
  ScrollTrigger.batch('.process-step', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, scale: .9, stagger: .2, duration: .7, ease: 'back.out(1.5)'
      });
    },
    start: 'top 85%',
    once: true
  });

  // Testimonial cards
  ScrollTrigger.batch('.testi-card', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, y: 40, stagger: .12, duration: .75, ease: 'power3.out'
      });
    },
    start: 'top 88%',
    once: true
  });

  // Pricing cards
  ScrollTrigger.batch('.pricing-card, .service-card', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, y: 40, stagger: .15, duration: .75, ease: 'power3.out'
      });
    },
    start: 'top 85%',
    once: true
  });

  // Video cards
  ScrollTrigger.batch('.video-card', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, y: 30, stagger: .1, duration: .65, ease: 'power3.out'
      });
    },
    start: 'top 88%',
    once: true
  });

  // Product cards
  ScrollTrigger.batch('.product-card', {
    onEnter: (els) => {
      gsap.from(els, {
        opacity: 0, y: 30, stagger: .08, duration: .65, ease: 'power3.out'
      });
    },
    start: 'top 88%',
    once: true
  });

  // Pull quote
  ScrollTrigger.create({
    trigger: '.pull-quote-block',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.from('.pull-quote-bar', { scaleX: 0, duration: .6, ease: 'power3.out', transformOrigin: 'left' });
      gsap.from('.pull-quote',      { opacity: 0, y: 30, duration: .9, ease: 'power3.out', delay: .2 });
      gsap.from('.pull-quote-cite', { opacity: 0, y: 16, duration: .6, ease: 'power3.out', delay: .5 });
    }
  });

  // Stats bar
  ScrollTrigger.create({
    trigger: '.stats-section',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.from('.stat-item', {
        opacity: 0, y: 30, stagger: .12, duration: .7, ease: 'power3.out'
      });
    }
  });

  // Booking title
  ScrollTrigger.create({
    trigger: '.booking-content',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.from('.booking-title', { opacity: 0, y: 40, duration: .9, ease: 'power3.out' });
      gsap.from('.booking-sub',   { opacity: 0, y: 24, duration: .7, ease: 'power3.out', delay: .2 });
      gsap.from('.booking-content .btn', { opacity: 0, y: 20, stagger: .15, duration: .6, ease: 'power3.out', delay: .35 });
    }
  });
}

/* âââââââââââââââââââââââââââââââââââ
   3. SCROLL REVEAL (CSS fallback when GSAP unavailable)
âââââââââââââââââââââââââââââââââââ */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, parseFloat(delay) * 1000);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

/* âââââââââââââââââââââââââââââââââââ
   4. STAT COUNTERS
âââââââââââââââââââââââââââââââââââ */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-num[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1600;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* âââââââââââââââââââââââââââââââââââ
   5. HERO PARTICLE CANVAS
   Option B: Pulsing network â nodes orbit center,
   pulse waves radiate out and light up connections.
âââââââââââââââââââââââââââââââââââ */
function initParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], frame = 0;
  let pulseT = 999, nextPulse = 80;
  let mx = -9999, my = -9999;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Node {
    constructor() {
      const isCentral = Math.random() < .15;
      if (isCentral) {
        this.angle = Math.random() * Math.PI * 2;
        this.dist  = 30 + Math.random() * 80;
      } else {
        this.angle = Math.random() * Math.PI * 2;
        this.dist  = 80 + Math.random() * Math.min(W, H) * .38;
      }
      this.speed  = (Math.random() - .5) * .0018;
      this.r      = Math.random() * 2.4 + 1;
      this.col    = Math.random() < .6 ? [124, 58, 237] : [59, 130, 246];
      this.lit    = 0;
      this.phase  = Math.random() * Math.PI * 2;
    }
    get x() { return W / 2 + Math.cos(this.angle) * this.dist; }
    get y() { return H / 2 + Math.sin(this.angle) * this.dist; }
    update() {
      this.angle += this.speed;
      this.phase += .02;
      this.lit = Math.max(0, this.lit - .012);
      // Mouse proximity glow
      const dx = this.x - mx, dy = this.y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 150) this.lit = Math.max(this.lit, (1 - d / 150) * .9);
    }
    draw() {
      const pulse = Math.sin(this.phase) * .4 + .6;
      const a = (.25 + pulse * .2 + this.lit * .55);
      const r = this.r + this.lit * 4;
      const [cr, cg, cb] = this.col;

      if (this.lit > .08) {
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 6);
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${this.lit * .3})`);
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
      ctx.fill();
    }
  }

  function buildNodes() {
    const count = Math.min(Math.floor((W * H) / 14000), 70);
    nodes = Array.from({ length: count }, () => new Node());
  }

  resize();
  window.addEventListener('resize', () => { resize(); buildNodes(); });
  buildNodes();

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

  function triggerPulse() {
    pulseT = 0;
  }

  const MAXD = 150;

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Schedule next pulse
    if (frame >= nextPulse) {
      triggerPulse();
      nextPulse = frame + 100 + Math.floor(Math.random() * 60);
    }

    // Advance pulse
    pulseT += .022;
    const pulseR = pulseT * Math.min(W, H) * .55;
    const pulseA = Math.max(0, 1 - pulseT * 1.05);

    // Pulse ring
    if (pulseA > 0) {
      const cx = W / 2, cy = H / 2;
      const grd = ctx.createRadialGradient(cx, cy, pulseR * .75, cx, cy, pulseR);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(.65, `rgba(124,58,237,${pulseA * .18})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Light up nodes hit by the pulse ring
      nodes.forEach(n => {
        const dx = n.x - cx, dy = n.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(d - pulseR) < 36) {
          n.lit = Math.max(n.lit, pulseA * 1.1);
        }
      });
    }

    // Connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const dx = ni.x - nj.x, dy = ni.y - nj.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAXD) {
          const t = 1 - d / MAXD;
          const lit = Math.max(ni.lit, nj.lit);
          const a = t * (.12 + lit * .45);
          const grad = ctx.createLinearGradient(ni.x, ni.y, nj.x, nj.y);
          grad.addColorStop(0, `rgba(124,58,237,${a})`);
          grad.addColorStop(1, `rgba(59,130,246,${a})`);
          ctx.beginPath();
          ctx.moveTo(ni.x, ni.y);
          ctx.lineTo(nj.x, nj.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = lit > .3 ? 1.4 : .65;
          ctx.stroke();
        }
      }
    }

    // Central orb
    const cx = W / 2, cy = H / 2;
    const orbP = Math.sin(frame * .035) * .5 + .5;
    const orbR = 14 + orbP * 8;
    const orbGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 4);
    orbGrd.addColorStop(0, 'rgba(255,255,255,.95)');
    orbGrd.addColorStop(.3, 'rgba(168,85,247,.75)');
    orbGrd.addColorStop(.7, 'rgba(59,130,246,.3)');
    orbGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, orbR * 4, 0, Math.PI * 2);
    ctx.fillStyle = orbGrd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fill();

    // Update nodes
    nodes.forEach(n => { n.update(); n.draw(); });
  }
  loop();
}

/* âââââââââââââââââââââââââââââââââââ
   6. BOOKING SECTION MINI CANVAS
   Lightweight electric beam effect
âââââââââââââââââââââââââââââââââââ */
function initBookingCanvas() {
  const canvas = document.getElementById('bookingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], frame = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function buildNodes() {
    const count = 30;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .4,
      vy: (Math.random() - .5) * .4,
      r: Math.random() * 2 + 1,
      col: Math.random() < .55 ? [124, 58, 237] : [59, 130, 246],
    }));
  }

  resize();
  new ResizeObserver(() => { resize(); buildNodes(); }).observe(canvas.parentElement);
  buildNodes();

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          const t = 1 - d / 130;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(124,58,237,${t * .18})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;
      const [r, g, b] = n.col;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},.3)`;
      ctx.fill();
    });
  }
  loop();
}

/* âââââââââââââââââââââââââââââââââââ
   7. SCROLL-BASED VIDEO SCRUB ENGINE
âââââââââââââââââââââââââââââââââââ */
function initVideoScrub() {
  const video  = document.getElementById('heroVideo');
  const loader = document.getElementById('heroLoader');
  const fill   = document.getElementById('videoProgressFill');
  const wrap   = document.getElementById('heroVideoWrap');
  const fallback = document.getElementById('heroFallback');

  if (!video) return;

  // ââ Mobile / low-power detection ââ
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isMobile || prefersReduced) {
    // Show gradient fallback, hide video
    video.parentElement.style.display = 'none';
    fallback.style.display = 'block';
    if (loader) { loader.classList.add('hidden'); }
    return;
  }

  // ââ Video loading ââ
  let videoReady = false;

  function onVideoReady() {
    if (videoReady) return;
    videoReady = true;
    video.pause();
    video.currentTime = 0;
    video.classList.add('loaded');
    if (loader) {
      loader.classList.add('hidden');
    }
  }

  video.addEventListener('loadedmetadata', onVideoReady);
  video.addEventListener('canplaythrough', onVideoReady);

  // If video fails to load (file not found), show fallback gracefully
  video.addEventListener('error', () => {
    console.info('SR: Hero video not found â showing particle canvas fallback.');
    wrap.style.display = 'none';
    fallback.style.display = 'block';
    if (loader) loader.classList.add('hidden');
  });

  // ââ Scroll scrub ââ
  const track = document.querySelector('.hero-scroll-track');
  if (!track) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateVideoTime);
      ticking = true;
    }
  }

  function updateVideoTime() {
    ticking = false;
    if (!videoReady || !video.duration) return;

    const trackTop    = track.getBoundingClientRect().top + window.scrollY;
    const trackHeight = track.offsetHeight - window.innerHeight;
    const scrolled    = window.scrollY - trackTop;
    const progress    = Math.max(0, Math.min(1, scrolled / trackHeight));

    // Map progress to video time
    const targetTime = progress * video.duration;

    // Clamp to avoid seeking past duration
    video.currentTime = Math.min(targetTime, video.duration - 0.01);

    // Update progress bar
    if (fill) fill.style.width = (progress * 100) + '%';
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Also update via Lenis if available
  if (window._lenis) {
    window._lenis.on('scroll', updateVideoTime);
  }

  /* ââ GSAP ScrollTrigger integration ââ */
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!videoReady || !video.duration) return;
        const time = self.progress * video.duration;
        video.currentTime = Math.min(time, video.duration - 0.01);
        if (fill) fill.style.width = (self.progress * 100) + '%';
      }
    });
  }
}

/* âââââââââââââââââââââââââââââââââââ
   8. NAV SCROLL STATE
âââââââââââââââââââââââââââââââââââ */
function initNav() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  function updateNav() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Active link tracking
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[data-nav]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('nav-active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('nav-active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach(s => sectionObserver.observe(s));
}

/* âââââââââââââââââââââââââââââââââââ
   MOBILE MENU
âââââââââââââââââââââââââââââââââââ */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

/* âââââââââââââââââââââââââââââââââââ
   STORE FILTER
âââââââââââââââââââââââââââââââââââ */
function filterStore(cat, btn) {
  // Update active tab
  document.querySelectorAll('.store-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Show/hide products
  document.querySelectorAll('.product-card[data-cat]').forEach(card => {
    const show = cat === 'all' || card.dataset.cat === cat;
    if (show) {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        card.style.transition = 'opacity .4s ease, transform .4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    } else {
      card.style.display = 'none';
    }
  });
}

/* âââââââââââââââââââââââââââââââââââ
   NOTIFY FORM
âââââââââââââââââââââââââââââââââââ */
function handleNotifySubmit(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input[type="email"]');
  const btn   = form.querySelector('button');
  if (!input || !btn) return;

  // Simulate submission
  btn.textContent = 'Subscribing...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'â You\'re on the list!';
    input.value = '';
    input.disabled = true;
    btn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
  }, 1200);
}

/* âââââââââââââââââââââââââââââââââââ
   VIDEO PLACEHOLDER NOTE
   (console guidance for content team)
âââââââââââââââââââââââââââââââââââ */
console.log(`
%c SPIRITUAL ROMEO â CINEMATIC SITES %c
%c
Video Setup Instructions:
ââââââââââââââââââââââââ
1. Place your hero video at: assets/hero-cinematic.mp4
2. Recommended specs:
   â¢ Resolution: 1920Ã1080 or 3840Ã2160 (4K)
   â¢ Duration: 10â30 seconds
   â¢ Format: H.264 MP4, no audio track
   â¢ Size: Under 20MB (optimize with HandBrake)
3. Good video content ideas:
   â¢ Slow-motion light streaks / particle effects
   â¢ Abstract human connection visuals
   â¢ Cosmic / electric energy footage
   â¢ Time-lapse of a city at night
4. Until video is ready: particle canvas shows automatically.

Have questions? Contact your dev team.
`,
'background:#7C3AED;color:#fff;font-weight:bold;padding:4px 8px;',
'',
'color:#A855F7;'
);
