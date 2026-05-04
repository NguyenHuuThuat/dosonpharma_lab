/* ===========================================================
   DO.SON Pharmaceuticals — site.js
   Smooth, premium effects. No infinite anims.
   - Scroll reveal (IntersectionObserver, one-shot)
   - 3D tilt on cards & glimpse tiles
   - Magnetic buttons
   - Count-up hero stats
   - Hero parallax (mouse + scroll, rAF-throttled, CSS-var driven)
   - Header morph + smooth scroll + form
   =========================================================== */

(() => {
  const $   = (s, ctx = document) => ctx.querySelector(s);
  const $$  = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const fineHover = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Year stamp ───────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ───────── Header / FAB / scroll-parallax (single rAF loop) ───────── */
  const header    = $('#siteHeader');
  const fab       = $('.fab');
  const heroDecor = $('.hero__decor');

  let scrollTicking = false;
  const onScroll = () => {
    const y = window.scrollY;

    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (fab)    fab.classList.toggle('is-visible', y > 600);
    if (heroDecor && fineHover) {
      // Subtle scroll parallax (5% of scroll, capped to keep it gentle)
      const py = Math.min(y * 0.18, 120);
      heroDecor.style.setProperty('--sy', `${py}px`);
    }
    scrollTicking = false;
  };
  addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ───────── Mobile drawer ───────── */
  const toggle = $('#navToggle');
  const drawer = $('#navDrawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', drawer).forEach(a =>
      a.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ───────── Smooth scroll w/ fixed-header offset ───────── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ───────── Hero mouse parallax (rAF, CSS-var driven) ───────── */
  const hero = $('.hero');
  if (fineHover && hero && heroDecor && !reduced) {
    let mx = 0, my = 0, raf = null;
    const apply = () => {
      heroDecor.style.setProperty('--mx', `${mx * -10}px`);
      heroDecor.style.setProperty('--my', `${my * -10}px`);
      raf = null;
    };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width  - 0.5;
      my = (e.clientY - r.top)  / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener('mouseleave', () => {
      mx = my = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* ───────── IntersectionObserver: scroll reveal ───────── */
  if ('IntersectionObserver' in window && !reduced) {
    const revealSel = [
      '.section__head',
      '.story__copy', '.story__media',
      '.pillar', '.card', '.approach__panel',
      '.glimpse__tile',
      '.timeline > li',
      '.research__quote',
      '.contact__copy', '.contact__form',
    ].join(',');

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$(revealSel).forEach(el => io.observe(el));
  } else {
    // Fallback: ensure everything is visible
    document.documentElement.classList.remove('js');
  }

  /* ───────── Magnetic buttons (CSS-var driven) ───────── */
  if (fineHover && !reduced) {
    const magnetic = $$('.btn');
    magnetic.forEach(btn => {
      let raf = null, x = 0, y = 0;
      const apply = () => {
        btn.style.setProperty('--mx', `${x}px`);
        btn.style.setProperty('--my', `${y}px`);
        raf = null;
      };
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        // Pull strength: 28% of distance from center
        x = (e.clientX - r.left  - r.width  / 2) * 0.28;
        y = (e.clientY - r.top   - r.height / 2) * 0.28;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        x = 0; y = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  }

  /* ───────── 3D Tilt on cards & glimpse tiles ───────── */
  if (fineHover && !reduced) {
    const tiltTargets = $$('.card, .glimpse__tile');
    tiltTargets.forEach(el => {
      let raf = null, rect = null, rx = 0, ry = 0, lift = 0;
      const apply = () => {
        el.style.transform =
          `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0, ${lift}px, 0)`;
        raf = null;
      };
      el.addEventListener('mouseenter', () => {
        rect = el.getBoundingClientRect();
        el.classList.add('is-tilting');
        lift = -3;
      });
      el.addEventListener('mousemove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width  - 0.5;
        const py = (e.clientY - rect.top)  / rect.height - 0.5;
        rx = py * -3.5;
        ry = px *  3.5;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('is-tilting');
        rx = ry = lift = 0;
        rect = null;
        // Cleared inline transform — CSS .card transition handles smooth reset
        el.style.transform = '';
      });
      // Recompute rect on resize (cheap)
      addEventListener('resize', () => { rect = null; }, { passive: true });
    });
  }

  /* ───────── Count-up on hero stats ───────── */
  if (!reduced) {
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const count = (el) => {
      const txt = el.textContent.trim();
      const m = txt.match(/^(\d+)(.*)$/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const suffix = m[2] || '';
      if (target <= 0) return;
      const dur = 1400;
      let start = null;
      const tick = (now) => {
        if (start === null) start = now;
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * ease(t)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    // Hero meta is above-the-fold; trigger after the rise stagger
    const startCount = () => $$('.hero__meta .num').forEach((el, i) => {
      setTimeout(() => count(el), 700 + i * 120);
    });
    if (document.readyState === 'complete') startCount();
    else addEventListener('load', startCount, { once: true });
  }

  /* ───────── Contact form (Formspree, AJAX) ───────── */
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span>Sending…</span>';
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('bad response');
        form.querySelectorAll('.field, .field-row, .form__note, .form__submit')
            .forEach(el => el.style.display = 'none');
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.reset();
      } catch (err) {
        console.error('[Formspree] submit failed:', err, 'action:', form.action);
        submit.disabled = false;
        submit.innerHTML = original;
        alert('Sorry — your enquiry could not be sent (' + (err && err.message || 'unknown') + '). Please email enquiries@dosonpharma.com directly.');
      }
    });
  }
})();
