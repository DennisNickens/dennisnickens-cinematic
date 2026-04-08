/*!
 * modules.js â Spiritual Romeo Interactive Modules
 * M1: Background Particle Canvas
 * M2: Kinetic Text Reveal
 * M3: Story Timeline Scroll
 * M4: Services Accordion
 * M5: Testimonial Flip Cards
 * M6: Booking Typewriter
 */

(function () {
  'use strict';

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     UTILS
  âââââââââââââââââââââââââââââââââââââââââââââ */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M1 â BACKGROUND PARTICLE CANVAS
     Fixed behind all sections, subtle purple-blue
     connecting-dot network.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initBgParticles() {
    const canvas = qs('#bgParticle');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2); // cap at 2Ã for GPU budget
    let W, H, nodes = [], animId;

    // Design tokens
    const CFG = {
      count:       80,
      speed:       0.25,
      radius:      1.6,
      linkDist:    140,
      linkOpacity: 0.18,
      colors:      ['#7C3AED', '#A855F7', '#3B82F6', '#06B6D4', '#00E5FF'],
    };

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // draw in CSS px
    }

    function makeNode() {
      const color = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * CFG.speed,
        vy: (Math.random() - 0.5) * CFG.speed,
        r:  CFG.radius * (0.6 + Math.random() * 0.8),
        color,
        alpha: 0.4 + Math.random() * 0.5,
      };
    }

    function buildNodes() {
      nodes = Array.from({ length: CFG.count }, makeNode);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.linkDist) {
            const alpha = CFG.linkOpacity * (1 - dist / CFG.linkDist);
            const grd = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grd.addColorStop(0, a.color);
            grd.addColorStop(1, b.color);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grd;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Dots
      ctx.globalAlpha = 1;
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = n.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function update() {
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      });
    }

    function loop() {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    }

    resize();
    buildNodes();
    loop();

    window.addEventListener('resize', () => {
      resize();
      buildNodes();
    });
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M2 â KINETIC TEXT REVEAL
     Wraps each word in .kinetic-line/.kinetic-inner
     then triggers reveal via GSAP or IntersectionObserver.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initKineticText() {
    const targets = qsa('[data-kinetic]');
    if (!targets.length) return;

    targets.forEach(el => {
      // Already split? skip
      if (el.querySelector('.kinetic-line')) return;

      const raw    = el.textContent.trim();
      const words  = raw.split(/\s+/);
      const isGrad = el.dataset.kineticGrad !== undefined;

      el.textContent = '';

      words.forEach((word, i) => {
        const line  = document.createElement('span');
        line.className = 'kinetic-line';

        const inner = document.createElement('span');
        inner.className = 'kinetic-inner' + (isGrad ? ' kinetic-word is-gradient' : '');
        inner.textContent = word;
        inner.style.transitionDelay = (i * 0.06) + 's';

        line.appendChild(inner);

        if (i < words.length - 1) {
          line.appendChild(document.createTextNode('\u00a0'));
        }

        el.appendChild(line);
        el.style.display = 'inline';
      });
    });

    // GSAP path
    if (window.gsap && window.ScrollTrigger) {
      targets.forEach(el => {
        const inners = qsa('.kinetic-inner', el);
        gsap.fromTo(inners,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity:  1,
            duration: 1,
            ease:     'power3.out',
            stagger:  0.06,
            scrollTrigger: {
              trigger: el,
              start:   'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
      return;
    }

    // Fallback â IntersectionObserver
    // Double-rAF ensures the browser has committed the initial translateY(110%)
    // style before we add .revealed, so the CSS transition actually fires.
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const inners = qsa('.kinetic-inner', entry.target);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inners.forEach(n => n.classList.add('revealed'));
          });
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    targets.forEach(el => io.observe(el));
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M3 â STORY TIMELINE SCROLL
     Animates .story-step items with stagger.
     Each step fades + slides up on scroll.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initStoryTimeline() {
    const steps = qsa('.story-step');
    if (!steps.length) return;

    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo(steps,
        { opacity: 0, y: 50 },
        {
          opacity:  1,
          y:        0,
          duration: 0.9,
          ease:     'power2.out',
          stagger:  0.15,
          scrollTrigger: {
            trigger: qs('#story') || steps[0],
            start:   'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Progress line fill
      const line = qs('.story-line-fill');
      if (line) {
        gsap.fromTo(line,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: {
              trigger: qs('#story'),
              start:   'top 75%',
              end:     'bottom 60%',
              scrub:   1,
            },
          }
        );
      }
      return;
    }

    // Fallback
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('story-step--visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    steps.forEach(s => io.observe(s));
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M4 â SERVICES ACCORDION
     Only one item open at a time.
     Animates via max-height in CSS;
     JS toggles .open class.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initServicesAccordion() {
    const items = qsa('.accord-item');
    if (!items.length) return;

    // Open first item by default
    if (items[0]) items[0].classList.add('open');

    items.forEach(item => {
      const header = qs('.accord-header', item);
      if (!header) return;

      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach(i => i.classList.remove('open'));

        // Toggle clicked
        if (!isOpen) item.classList.add('open');
      });

      // Keyboard support
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });

    // Scroll-animate the section heading + items entrance
    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo('.services-accordion',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#services',
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M5 â TESTIMONIAL FLIP CARDS
     Desktop: CSS hover (handled in CSS).
     Mobile: tap toggles .is-flipped class.
     Also triggers card entrance animation.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initFlipCards() {
    const cards = qsa('.flip-card');
    if (!cards.length) return;

    const isTouch = window.matchMedia('(hover: none)').matches;

    if (isTouch) {
      cards.forEach(card => {
        card.addEventListener('click', () => {
          card.classList.toggle('is-flipped');
        });
      });
    }

    // Entrance animation
    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo(cards,
        { opacity: 0, y: 60, rotateX: 8 },
        {
          opacity:  1,
          y:        0,
          rotateX:  0,
          duration: 0.85,
          ease:     'power3.out',
          stagger:  0.12,
          scrollTrigger: {
            trigger: '#testimonials',
            start:   'top 78%',
            toggleActions: 'play none none none',
          },
        }
      );
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('flip-card--visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      cards.forEach(ch => io.observe(c));
    }
    }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     M6 â BOOKING TYPEWRITER
     Cycles through phrases with type â pause â
     delete â retype cadence.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initTypewriter() {
    const display = qs('#twDisplay');
    if (!display) return;

    const phrases = [
      'Guessing.',
      'Suffering in Silence.',
      'Missing Each Other.',
      'Going Through the Motions.',
      'Feeling Alone Together.',
    ];

    const SPEED_TYPE   = 60;   // ms per char
    const SPEED_DELETE = 35;   // ms per char delete
    const PAUSE_AFTER  = 2200; // ms hold after full phrase
    const PAUSE_BEFORE = 400;  // ms before typing next

    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;
    let timeoutId = null;

    function tick() {
      const phrase = phrases[phraseIdx];

      if (!deleting) {
        // Type forward
        charIdx++;
        display.textContent = phrase.slice(0, charIdx);

        if (charIdx === phrase.length) {
          // Pause then start deleting
          timeoutId = setTimeout(() => {
            deleting = true;
            tick();
          }, PAUSE_AFTER);
          return;
        }
      } else {
        // Delete backward
        charIdx--;
        display.textContent = phrase.slice(0, charIdx);

        if (charIdx === 0) {
          deleting  = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timeoutId = setTimeout(tick, PAUSE_BEFORE);
          return;
        }
      }

      timeoutId = setTimeout(tick, deleting ? SPEED_DELETE : SPEED_TYPE);
    }

    // Start when booking section enters viewport
    const bookingSection = qs('#booking');
    if (!bookingSection) { tick(); return; }

    const startObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        startObserver.disconnect();
        // Small delay for drama
        setTimeout(tick, 600);
      }
    }, { threshold: 0.3 });

    startObserver.observe(bookingSection);

    // Booking urgency pulse is handled via CSS animation on .booking-urgency-dot
    // Animate booking CTA section entrance
    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo('#booking .booking-inner',
        { opacity: 0, scale: 0.97 },
        {
          opacity:  1,
          scale:    1,
          duration: 1,
          ease:     'power3.out',
          scrollTrigger: {
            trigger: '#booking',
            start:   'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     BONUS â STATS COUNTER ANIMATION
     (enhances the existing counter in style.js
      with a cleaner GSAP path when available)
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initStatCounters() {
    const counters = qsa('[data-count]');
    if (!counters.length || !window.gsap || !window.ScrollTrigger) return;

    counters.forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj    = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        snap: { val: target % 1 === 0 ? 1 : 0.1 },
        scrollTrigger: {
          trigger: el,
          start:   'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate() {
          el.textContent = (target % 1 === 0
            ? Math.round(obj.val)
            : obj.val.toFixed(1)) + suffix;
        },
      });
    });
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     BONUS â NAV ACTIVE STATE
     Highlights active nav link as sections enter.
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initNavActive() {
    const sections = qsa('section[id]');
    const navLinks = qsa('.nav-link[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });

    sections.forEach(s => io.observe(s));
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     SCROLL PROGRESS BAR
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initScrollProgress() {
    const bar = qs('#scrollProgress');
    if (!bar) return;

    function update() {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${clamp(scrolled / total, 0, 1)})`;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     MOBILE MENU TOGGLE
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initMobileMenu() {
    const btn   = qs('#menuBtn');
    const menu  = qs('#mobileMenu');
    const links = qsa('#mobileMenu a');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      btn.innerHTML = isOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', false);
      });
    });
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââ
     INIT ALL
  âââââââââââââââââââââââââââââââââââââââââââââ */
  function initModules() {
    initBgParticles();
    initKineticText();
    initStoryTimeline();
    initServicesAccordion();
    initFlipCards();
    initTypewriter();
    initStatCounters();
    initNavActive();
    initScrollProgress();
    initMobileMenu();
  }

  // Wait for load so GSAP + ScrollTrigger are ready
  if (document.readyState === 'complete') {
    initModules();
  } else {
    window.addEventListener('load', initModules);
  }

})();
