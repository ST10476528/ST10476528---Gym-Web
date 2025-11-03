/* =========================================================
   GYM WEBSITE – INTERACTIVITY + ANIMATIONS + UX + SEO
   Vanilla JS, no dependencies. Include with: <script src="gym.js" defer></script>
   Expected hooks in your HTML:
   - Header/Nav: #header, #navToggle, #navMenu, .nav-link
   - Scroll reveals: .reveal (optionally .reveal-left / .reveal-right)
   - Back-to-top: #backToTop
   - Testimonials slider: #testimonials .testimonial
   - BMI: #bmi-form, #bmi-height, #bmi-weight, #bmi-result
   - Class filter: #class-filter [data-filter], #classes .class-card[data-day][data-level]
   - Forms: #signup-form (fullName, email, phone, goal, terms), #newsletter-form (email)
   - Lazy images: <img data-src="...">
   - Deferred Map: #mapFrame[data-src="...maps..."]
   - YouTube lite: .yt-lite[data-video-id="XXXXXXXXXXX"]
   - New animations:
     * Counters: <span class="counter" data-target="500">0</span>
     * Typewriter: #typewriter
     * Scroll progress bar: #scrollProgress
   ========================================================= */

(() => {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const smoothScrollTo = (el) => {
    const y = el.getBoundingClientRect().top + window.scrollY - 72; // offset for fixed header
    window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const throttle = (fn, wait = 100) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn(...args);
      }
    };
  };

  // ---------- Mobile Nav ----------
  const initNav = () => {
    const header = $('#header');
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      document.body.classList.remove('no-scroll');
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    });

    $$('.nav-link', menu).forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          const target = $(href);
          if (target) smoothScrollTo(target);
        }
        closeMenu();
      });
    });

    const onScroll = throttle(() => {
      if (window.scrollY > 8) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    }, 100);
    onScroll();
    window.addEventListener('scroll', onScroll);
  };

  // ---------- Scroll Reveal Animations (with left/right variants) ----------
  const initReveals = () => {
    const els = $$('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  };

  // ---------- Back To Top ----------
  const initBackToTop = () => {
    const btn = $('#backToTop');
    if (!btn) return;
    const toggle = throttle(() => {
      btn.classList.toggle('show', window.scrollY > 600);
    }, 100);
    toggle();
    window.addEventListener('scroll', toggle);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  // ---------- Testimonials Auto-Slider ----------
  const initTestimonials = () => {
    const container = $('#testimonials');
    if (!container) return;
    const slides = $$('.testimonial', container);
    if (slides.length <= 1) return;

    let i = 0;
    let timer;
    const show = (idx) => {
      slides.forEach((s, n) => s.classList.toggle('active', n === idx));
    };
    const play = () => {
      timer = setInterval(() => {
        i = (i + 1) % slides.length;
        show(i);
      }, 4500);
    };
    const pause = () => clearInterval(timer);

    show(0);
    play();
    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', play);
  };

  // ---------- BMI Calculator ----------
  const initBMI = () => {
    const form = $('#bmi-form');
    if (!form) return;
    const height = $('#bmi-height');
    const weight = $('#bmi-weight');
    const out = $('#bmi-result');

    const classify = (bmi) => {
      if (bmi < 18.5) return 'Underweight';
      if (bmi < 25) return 'Normal';
      if (bmi < 30) return 'Overweight';
      return 'Obese';
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const h = parseFloat(height?.value || '');
      const w = parseFloat(weight?.value || '');
      if (!h || !w) {
        out.textContent = 'Please enter your height and weight.';
        return;
      }
      const m = h / 100;
      const bmi = w / (m * m);
      out.textContent = `BMI: ${bmi.toFixed(1)} (${classify(bmi)})`;
    });
  };

  // ---------- Class Schedule Filter ----------
  const initClassFilter = () => {
    const bar = $('#class-filter');
    const grid = $('#classes');
    if (!bar || !grid) return;
    const cards = $$('.class-card', grid);

    const apply = () => {
      const active = $$('.active', bar).map((b) => b.getAttribute('data-filter'));
      cards.forEach((card) => {
        const day = card.getAttribute('data-day');
        const level = card.getAttribute('data-level');
        const matchDay = active.some((f) => f?.startsWith('day:')) ? active.includes(`day:${day}`) : true;
        const matchLevel = active.some((f) => f?.startsWith('level:')) ? active.includes(`level:${level}`) : true;
        card.style.display = matchDay && matchLevel ? '' : 'none';
      });
    };

    $$('[data-filter]', bar).forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        apply();
      });
    });

    apply();
  };

  // ---------- Forms: Signup + Newsletter (client-side validation) ----------
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneOk = (v) => !v || /^[+()\-\s\d]{7,}$/.test(v);

  const setFieldError = (input, msg = '') => {
    const field = input.closest('.field') || input.parentElement;
    field?.classList.toggle('has-error', !!msg);
    let hint = field?.querySelector('.hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'hint';
      field?.appendChild(hint);
    }
    hint.textContent = msg;
  };

  const initSignupForm = () => {
    const form = $('#signup-form');
    if (!form) return;

    form.setAttribute('novalidate', 'true');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      let ok = true;

      if (!data.fullName || String(data.fullName).trim().length < 2) {
        setFieldError(form.elements.fullName, 'Please enter your full name.');
        ok = false;
      } else setFieldError(form.elements.fullName);

      if (!emailOk(String(data.email || ''))) {
        setFieldError(form.elements.email, 'Enter a valid email address.');
        ok = false;
      } else setFieldError(form.elements.email);

      if (!phoneOk(String(data.phone || ''))) {
        setFieldError(form.elements.phone, 'Use digits and symbols like + ( ) - only.');
        ok = false;
      } else setFieldError(form.elements.phone);

      if (!data.goal) {
        setFieldError(form.elements.goal, 'Select your primary goal.');
        ok = false;
      } else setFieldError(form.elements.goal);

      if (!form.elements.terms?.checked) {
        setFieldError(form.elements.terms, 'You must accept the terms.');
        ok = false;
      } else setFieldError(form.elements.terms);

      if (!ok) return;

      form.classList.add('is-loading');
      await new Promise((r) => setTimeout(r, 600));
      form.classList.remove('is-loading');

      try {
        const leads = JSON.parse(localStorage.getItem('gym:leads') || '[]');
        leads.push({ name: data.fullName, email: data.email, ts: Date.now() });
        localStorage.setItem('gym:leads', JSON.stringify(leads));
      } catch (_) {}

      form.reset();
      alert('Thanks! We’ll be in touch shortly.');
    });
  };

  const initNewsletterForm = () => {
    const form = $('#newsletter-form');
    if (!form) return;
    form.setAttribute('novalidate', 'true');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { email } = Object.fromEntries(new FormData(form).entries());
      if (!emailOk(String(email || ''))) {
        setFieldError(form.elements.email, 'Enter a valid email address.');
        return;
      }
      setFieldError(form.elements.email, '');
      form.reset();
      alert('Subscribed! Check your inbox for confirmation.');
    });
  };

  // ---------- Lazy Images ----------
  const initLazyImages = () => {
    const imgs = $$('img[data-src]');
    if (!imgs.length) return;

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const img = e.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            obs.unobserve(img);
          }
        });
      },
      { rootMargin: '300px 0px' }
    );
    imgs.forEach((img) => io.observe(img));
  };

  // ---------- Defer External Embeds (Maps / YouTube) ----------
  const initMapDefer = () => {
    const i = $('#mapFrame');
    if (!i) return;
    const load = () => {
      if (i.dataset.src && !i.src) {
        i.src = i.dataset.src;
        i.removeAttribute('data-src');
      }
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && (load(), io.disconnect()));
    });
    io.observe(i);
    i.addEventListener('click', load);
  };

  const initYouTubeLite = () => {
    const cards = $$('.yt-lite');
    if (!cards.length) return;

    cards.forEach((card) => {
      const id = card.getAttribute('data-video-id');
      if (!id) return;
      const img = new Image();
      img.alt = 'Play video';
      img.referrerPolicy = 'no-referrer';
      img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      card.appendChild(img);

      const btn = document.createElement('button');
      btn.className = 'yt-play';
      btn.setAttribute('aria-label', 'Play video');
      card.appendChild(btn);

      const activate = () => {
        const iframe = document.createElement('iframe');
        iframe.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.title = 'YouTube video player';
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        card.replaceChildren(iframe);
      };

      card.addEventListener('click', activate, { once: true });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        activate();
      }, { once: true });
    });
  };

  // ---------- Light SEO Helpers ----------
  const initSEO = () => {
    const orgName = document.body.getAttribute('data-gym-name') || 'Your Gym';
    const phone = document.body.getAttribute('data-gym-phone') || '';
    const street = document.body.getAttribute('data-gym-street') || '';
    const city = document.body.getAttribute('data-gym-city') || '';
    const postal = document.body.getAttribute('data-gym-postal') || '';
    const country = document.body.getAttribute('data-gym-country') || '';

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'HealthClub',
      name: orgName,
      url: location.origin,
      telephone: phone || undefined,
      address: street
        ? {
            '@type': 'PostalAddress',
            streetAddress: street,
            addressLocality: city,
            postalCode: postal,
            addressCountry: country || 'US'
          }
        : undefined,
      sameAs: $$('a[data-social]').map((a) => a.href)
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);

    $$('img').forEach((img) => {
      if (!img.hasAttribute('alt') || img.alt.trim() === '') {
        const fallback =
          img.getAttribute('data-alt') ||
          (img.src || img.getAttribute('data-src') || '').split('/').pop()?.split('?')[0]?.replace(/[-_]/g, ' ') ||
          'Gym image';
        img.setAttribute('alt', fallback);
      }
    });

    const desc = $('meta[name="description"]');
    if (!desc || !desc.content || desc.content.length < 20) {
      const el = desc || Object.assign(document.createElement('meta'), { name: 'description' });
      el.content =
        `${orgName} – memberships, personal training, classes, and nutrition coaching. Join today for a stronger, healthier you.`;
      if (!desc) document.head.appendChild(el);
    }
  };

  // ========================================================
  // EXTRA ANIMATIONS
  // ========================================================

  // 1) Animated number counters
  const initCounters = () => {
    const counters = $$('.counter');
    if (!counters.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = +el.dataset.target;
            const duration = 2000; // ms
            const start = performance.now();

            const tick = (now) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
              el.textContent = Math.floor(eased * target).toLocaleString();
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => io.observe(el));
  };

  // 2) Typewriter hero text
  const initTypewriter = () => {
    const el = $('#typewriter');
    if (!el) return;
    const texts = [
      'Transform Your Body,',
      'Transform Your Life.',
      'Join the Movement Today!'
    ];
    let i = 0, j = 0, deleting = false;

    const type = () => {
      const current = texts[i];
      el.textContent = current.slice(0, j);
      if (!deleting && j < current.length) j++;
      else if (deleting && j > 0) j--;
      else if (!deleting && j === current.length) {
        deleting = true;
        setTimeout(type, 1600);
        return;
      } else if (deleting && j === 0) {
        deleting = false;
        i = (i + 1) % texts.length;
      }
      setTimeout(type, deleting ? 40 : 90);
    };
    type();
  };

  // 3) Scroll progress bar
  const initScrollProgress = () => {
    const bar = $('#scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = pct + '%';
    };
    update();
    window.addEventListener('scroll', throttle(update, 50));
    window.addEventListener('resize', throttle(update, 100));
  };

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveals();
    initBackToTop();
    initTestimonials();
    initBMI();
    initClassFilter();
    initSignupForm();
    initNewsletterForm();
    initLazyImages();
    initMapDefer();
    initYouTubeLite();
    initSEO();
    // New animations:
    initCounters();
    initTypewriter();
    initScrollProgress();
  });
})();

