/*
 * Maison Coiffure motion and interaction controller (Navy-led update).
 * Section reveals, intro reveal, hero header state, About-card and brand
 * marquees, treatment hover previews, compact drawer and WhatsApp forms.
 * Content is fully readable without this file; hidden initial states are only
 * applied once this controller marks the document ready (html.mjs).
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var MOTION = doc.classList.contains('js-motion'); // absent when reduced motion

  if (MOTION) doc.classList.add('mjs');

  /* ---------------------------------------------------------------- */
  /* Header over the homepage hero: solid MC surface after the hero    */
  /* ---------------------------------------------------------------- */

  (function () {
    var header = document.querySelector('.site-header.over-hero');
    if (!header) return;
    var hero = document.querySelector('.hero-landing');
    if (!hero || !('IntersectionObserver' in window)) {
      header.classList.add('solid');
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          header.classList.toggle('solid', e.boundingClientRect.bottom - 70 <= 0 || !e.isIntersecting);
        });
      },
      { threshold: [0, 0.02, 0.05, 0.1], rootMargin: '-70px 0px 0px 0px' }
    );
    io.observe(hero);
  })();

  /* ---------------------------------------------------------------- */
  /* Ordinary section reveals                                          */
  /* ---------------------------------------------------------------- */

  if (MOTION && 'IntersectionObserver' in window) {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0) el.classList.add('settle', 'is-in');
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var group = el.getAttribute('data-reveal-group');
          if (group) {
            var idx = Number(el.getAttribute('data-reveal-index') || 0);
            el.style.setProperty('--reveal-delay', Math.min(idx, 2) * 70 + 'ms');
          }
          el.classList.add('is-in');
          io.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      if (el.offsetHeight > window.innerHeight * 0.85) {
        el.classList.add('is-in');
        return;
      }
      io.observe(el);
    });

    /* Introduction reveal: trigger when the section enters the lower 80%. */
    var intro = Array.prototype.slice.call(document.querySelectorAll('.reveal-intro'));
    if (intro.length) {
      var settled = intro[0].getBoundingClientRect().bottom < 0;
      if (settled) {
        intro.forEach(function (el) { el.classList.add('settle', 'is-in'); });
      } else {
        var iio = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-in');
              iio.unobserve(entry.target);
            });
          },
          { rootMargin: '0px 0px -20% 0px', threshold: 0 }
        );
        intro.forEach(function (el) { iio.observe(el); });
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Marquee tracks (About cards 28px/s, brand strip 35px/s)           */
  /* ---------------------------------------------------------------- */

  Array.prototype.slice.call(document.querySelectorAll('[data-marquee]')).forEach(function (mq) {
    var viewport = mq.querySelector('.mq-viewport');
    var track = mq.querySelector('.mq-track');
    var set = mq.querySelector('.mq-set');
    if (!viewport || !track || !set) return;

    var section = mq.closest('section') || mq;
    var toggle = section.querySelector('.mq-toggle');
    var prev = section.querySelector('.mq-prev');
    var next = section.querySelector('.mq-next');
    var dots = mq.querySelector('.mq-dots');
    var items = Array.prototype.slice.call(set.children);
    var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var loopOnTouch = mq.hasAttribute('data-loop-touch');

    /* Reduced motion, automatic movement switched off in Studio, or too few
       items for a useful loop: static layout with no auto movement. */
    if (!MOTION || mq.getAttribute('data-auto') === '0' || items.length < 2) {
      mq.classList.add('mq-static');
      return;
    }

    if (touch && !loopOnTouch) {
      /* Manual swipeable row with snap points, buttons and indicator. */
      mq.classList.add('mq-manual');
      if (prev) prev.hidden = false;
      if (next) next.hidden = false;
      function cardStep() {
        return items[0].getBoundingClientRect().width + 24;
      }
      if (prev) prev.addEventListener('click', function () {
        viewport.scrollBy({ left: -cardStep(), behavior: 'smooth' });
      });
      if (next) next.addEventListener('click', function () {
        viewport.scrollBy({ left: cardStep(), behavior: 'smooth' });
      });
      if (dots) {
        dots.hidden = false;
        items.forEach(function (_, i) {
          var d = document.createElement('button');
          d.type = 'button';
          d.className = 'mq-dot' + (i === 0 ? ' on' : '');
          d.setAttribute('aria-label', 'Go to card ' + (i + 1));
          d.addEventListener('click', function () {
            viewport.scrollTo({ left: i * cardStep(), behavior: 'smooth' });
          });
          dots.appendChild(d);
        });
        viewport.addEventListener('scroll', function () {
          var i = Math.round(viewport.scrollLeft / cardStep());
          Array.prototype.forEach.call(dots.children, function (d, j) {
            d.classList.toggle('on', j === Math.min(i, items.length - 1));
          });
        }, { passive: true });
      }
      return;
    }

    /* Continuous auto mode. Clone the set visually for a seamless loop:
       clones are decorative, hidden from AT and removed from tab order. */
    mq.classList.add('mq-auto');
    if (toggle) toggle.hidden = false;

    var speed = Number(mq.getAttribute('data-speed')) || 30;
    var setWidth = 0;
    var x = 0;
    var raf = null;
    var last = null;
    var hoverPause = false;
    var focusPause = false;
    var userPause = false;
    var offscreen = false;

    function buildClones() {
      Array.prototype.slice.call(track.querySelectorAll('.mq-clone')).forEach(function (c) { c.remove(); });
      setWidth = set.getBoundingClientRect().width;
      if (!setWidth) return;
      var needed = Math.max(2, Math.ceil((viewport.clientWidth + setWidth) / setWidth));
      for (var i = 1; i < needed; i++) {
        var clone = set.cloneNode(true);
        clone.classList.add('mq-clone');
        clone.setAttribute('aria-hidden', 'true');
        Array.prototype.forEach.call(clone.querySelectorAll('a, button'), function (el) {
          el.setAttribute('tabindex', '-1');
        });
        track.appendChild(clone);
      }
    }

    function paused() {
      return hoverPause || focusPause || userPause || offscreen || document.hidden;
    }

    function tick(t) {
      raf = null;
      if (last == null) last = t;
      var dt = Math.min(64, t - last);
      last = t;
      if (!paused()) {
        x -= (speed * dt) / 1000;
        if (setWidth > 0 && -x >= setWidth) x += setWidth;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px, 0, 0)';
      }
      raf = requestAnimationFrame(tick);
    }

    buildClones();
    raf = requestAnimationFrame(tick);

    mq.addEventListener('pointerenter', function () { hoverPause = true; });
    mq.addEventListener('pointerleave', function () { hoverPause = false; last = null; });
    mq.addEventListener('focusin', function () { focusPause = true; });
    mq.addEventListener('focusout', function () {
      requestAnimationFrame(function () {
        if (!mq.contains(document.activeElement)) { focusPause = false; last = null; }
      });
    });
    if (toggle) {
      toggle.addEventListener('click', function () {
        userPause = !userPause;
        toggle.setAttribute('aria-pressed', String(userPause));
        last = null;
      });
    }
    document.addEventListener('visibilitychange', function () { last = null; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { offscreen = !e.isIntersecting; last = null; });
      }, { threshold: 0 }).observe(mq);
    }
    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { x = 0; buildClones(); }, 200);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Compact menu drawer                                               */
  /* ---------------------------------------------------------------- */

  (function () {
    var drawer = document.getElementById('menu-drawer');
    var openBtn = document.getElementById('menu-open');
    if (!drawer || !openBtn) return;

    openBtn.addEventListener('click', function () {
      if (typeof drawer.showModal === 'function') drawer.showModal();
      else drawer.setAttribute('open', '');
    });
    drawer.addEventListener('close', function () {
      openBtn.focus();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) drawer.close(); // backdrop click
      var link = e.target.closest && e.target.closest('a');
      if (link) drawer.close();
    });
    var closeBtn = drawer.querySelector('.drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { drawer.close(); });

    Array.prototype.slice.call(drawer.querySelectorAll('.drawer-group-btn')).forEach(function (btn) {
      var sub = document.getElementById(btn.getAttribute('aria-controls'));
      if (!sub) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (!MOTION) {
          sub.style.height = open ? '0px' : 'auto';
          return;
        }
        if (open) {
          sub.style.height = sub.scrollHeight + 'px';
          requestAnimationFrame(function () { sub.style.height = '0px'; });
        } else {
          sub.style.height = sub.scrollHeight + 'px';
          sub.addEventListener('transitionend', function fix(e) {
            if (e.propertyName === 'height') {
              if (btn.getAttribute('aria-expanded') === 'true') sub.style.height = 'auto';
              sub.removeEventListener('transitionend', fix);
            }
          });
        }
      });
    });
  })();

  /* ---------------------------------------------------------------- */
  /* Treatment explorer previews (retained interaction)                */
  /* ---------------------------------------------------------------- */

  (function () {
    var explorers = Array.prototype.slice.call(document.querySelectorAll('[data-explorer]'));
    if (!explorers.length) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');

    var panel = null;
    var showT = null;
    var hideT = null;
    var raf = null;
    var lastX = 0;
    var lastY = 0;
    var active = null;

    function ensurePanel() {
      if (panel) return panel;
      panel = document.createElement('div');
      panel.className = 'preview-panel';
      panel.setAttribute('aria-hidden', 'true');
      document.body.appendChild(panel);
      return panel;
    }

    function position() {
      raf = null;
      if (!panel) return;
      var pw = panel.offsetWidth;
      var ph = panel.offsetHeight;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var x = lastX + 20;
      var y = lastY + 20;
      if (x + pw > vw - 16) x = lastX - pw - 20;
      if (y + ph > vh - 16) y = lastY - ph - 20;
      x = Math.max(16, Math.min(x, vw - pw - 16));
      y = Math.max(16, Math.min(y, vh - ph - 16));
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
    }

    function show(link) {
      var p = ensurePanel();
      active = link;
      p.innerHTML = '';
      var h = document.createElement('h4');
      h.textContent = link.getAttribute('data-preview-title') || '';
      var body = document.createElement('p');
      body.textContent = link.getAttribute('data-preview') || '';
      p.appendChild(h);
      p.appendChild(body);
      p.classList.remove('hiding');
      position();
      p.classList.add('show');
    }

    function hideNow() {
      clearTimeout(showT);
      clearTimeout(hideT);
      active = null;
      if (panel) panel.classList.remove('show', 'hiding');
    }

    explorers.forEach(function (list) {
      Array.prototype.slice.call(list.querySelectorAll('a[data-preview]')).forEach(function (link) {
        link.addEventListener('pointerenter', function (e) {
          if (!fine.matches || e.pointerType === 'touch') return;
          lastX = e.clientX;
          lastY = e.clientY;
          clearTimeout(hideT);
          clearTimeout(showT);
          if (active && active !== link) {
            show(link);
          } else {
            showT = setTimeout(function () { show(link); }, 120);
          }
        });
        link.addEventListener('pointermove', function (e) {
          if (!active && !showT) return;
          lastX = e.clientX;
          lastY = e.clientY;
          if (!raf) raf = requestAnimationFrame(position);
        });
        link.addEventListener('pointerleave', function () {
          clearTimeout(showT);
          showT = null;
          clearTimeout(hideT);
          hideT = setTimeout(function () {
            active = null;
            if (panel && panel.classList.contains('show')) {
              panel.classList.add('hiding');
              panel.classList.remove('show');
            }
          }, 100);
        });
        link.addEventListener('click', hideNow);

        link.addEventListener('focus', function () {
          if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
          var li = link.closest('li');
          if (!li || li.querySelector('.focus-preview')) return;
          var fp = document.createElement('div');
          fp.className = 'focus-preview';
          fp.setAttribute('aria-hidden', 'true');
          fp.textContent = link.getAttribute('data-preview') || '';
          li.style.position = 'relative';
          fp.style.top = '100%';
          fp.style.right = '0';
          fp.style.marginTop = '-8px';
          li.appendChild(fp);
        });
        link.addEventListener('blur', function () {
          var li = link.closest('li');
          var fp = li && li.querySelector('.focus-preview');
          if (fp) fp.remove();
        });
      });
    });

    window.addEventListener('scroll', hideNow, { passive: true });
    window.addEventListener('blur', hideNow);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideNow();
    });
  })();

  /* ---------------------------------------------------------------- */
  /* WhatsApp enquiry forms                                            */
  /* ---------------------------------------------------------------- */

  Array.prototype.slice.call(document.querySelectorAll('form[data-wa-form]')).forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var lines = [form.getAttribute('data-wa-intro') || 'Hello Maison Coiffure,'];
      Array.prototype.slice.call(form.elements).forEach(function (el) {
        if (!el.name || el.disabled) return;
        var label = el.getAttribute('data-label') || el.name;
        if (el.type === 'checkbox') {
          if (el.checked) lines.push(label + ': yes');
          return;
        }
        if (el.type === 'radio') {
          if (el.checked) lines.push(label + ': ' + el.value);
          return;
        }
        if (el.tagName === 'BUTTON' || el.type === 'submit') return;
        if (String(el.value).trim() !== '') lines.push(label + ': ' + String(el.value).trim());
      });
      var base = form.getAttribute('data-wa-base');
      window.open(base + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });
})();
