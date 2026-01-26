/**
 * Geegle (지글)
 * - Google-like interaction skeleton with Joseon parody UX
 * - Refactor focus: structure, state isolation, predictable timers, and clean event wiring
 *
 * Notes:
 * - No external APIs. Answer engine remains rule-based (see bottom block).
 * - Keeps existing IDs/classes to avoid touching HTML/CSS.
 */
(() => {
  'use strict';

  // ----------------------------
  // Tiny helpers (Google-ish minimalism)
  // ----------------------------
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  const getPointer = (e) => {
    // Mouse event
    if (typeof e.clientX === 'number') {
      return {
        clientX: e.clientX,
        clientY: e.clientY,
        pageX:   typeof e.pageX === 'number' ? e.pageX : (e.clientX + window.scrollX),
        pageY:   typeof e.pageY === 'number' ? e.pageY : (e.clientY + window.scrollY),
      };
    }
    // Touch event
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!t) return null;

    return {
      clientX: t.clientX,
      clientY: t.clientY,
      pageX:   typeof t.pageX === 'number' ? t.pageX : (t.clientX + window.scrollX),
      pageY:   typeof t.pageY === 'number' ? t.pageY : (t.clientY + window.scrollY),
    };
  };

  // ----------------------------
  // DOM cache
  // ----------------------------
  const EL = {
    // Settings (Joseon scroll)
    settingsOpen:  qs('#btn-open-settings'),
    settingsClose: qs('#btn-close-settings'),
    settingsModal: qs('#settings-modal'),

    // Theme
    themeAuto:  qs('#btn-auto'),
    themeLight: qs('#btn-light'),
    themeDark:  qs('#btn-dark'),

    // Search UI
    questionInput: qs('#question-input'),
    clearBtn:      qs('.clear-btn'),
    btnSearch:     qs('#btn-geegle-search'),
    btnExplain:    qs('#btn-feeling-lucky'),

    // Cursor & brand
    cursor:    qs('#iron-cursor'),
    brandIron: qs('#brand-iron'),

    // Game stage
    firePit:   qs('#fire-pit-container'),
    person:    qs('#person-container'),
    bubble:    qs('#answer-bubble'),
    sinner:    qs('#sinner-group'),

    // Heat gauge
    heatGauge:    qs('#heat-gauge'),
    heatGaugeNum: qs('#heat-gauge-num'),

    // Footer / About (currently kept as-is)
    footerBtn:   qs('#btn-geegle-footer'),
    aboutOverlay: qs('#about-overlay'),
    aboutText:    qs('#about-text'),
    aboutCancel:  qs('#about-cancel'),
    aboutSave:    qs('#about-save'),

    // Tutorial (B안)
    tutOverlay:   qs('#tutorial-overlay'),
    tutSpotlight: qs('#tutorial-spotlight'),
    tutPopover: qs('#tutorial-popover'),
    tutClose:     qs('#tutorial-close'),
    tutPrev:      qs('#tutorial-prev'),
    tutNext:      qs('#tutorial-next'),
    tutSkip:      qs('#tutorial-skip'),
    tutLabel:     qs('#tutorial-step-label'),
    tutTitle:     qs('#tutorial-step-title'),
    tutDesc:      qs('#tutorial-step-desc'),
    tutDots:      qsa('.tutorial-dots .dot'),
  };

  // ----------------------------
  // Overlay (modal) manager
  // ----------------------------
  const Overlay = (() => {
    const all = [EL.settingsModal, EL.aboutOverlay, EL.tutOverlay].filter(Boolean);

    const isOpen = (node) => !!node && node.classList.contains('open');

    const syncBody = () => {
      const anyOpen = all.some(isOpen);
      document.body.classList.toggle('settings-active', anyOpen);
    };

    const open = (node) => {
      if (!node) return;
      all.forEach((n) => {
        if (n !== node && isOpen(n)) close(n, { sync: false });
      });
      node.classList.add('open');
      node.setAttribute('aria-hidden', 'false');
      syncBody();
    };

    const close = (node, opts = { sync: true }) => {
      if (!node) return;
      node.classList.remove('open');
      node.setAttribute('aria-hidden', 'true');
      if (opts.sync) syncBody();
    };

    return { open, close, syncBody, isOpen };
  })();

  // ----------------------------
  // Theme manager
  // ----------------------------
  const Theme = (() => {
    const btns = [EL.themeAuto, EL.themeLight, EL.themeDark].filter(Boolean);

    const apply = (mode) => {
      btns.forEach((b) => b.classList.remove('active'));

      if (mode === 'auto') EL.themeAuto?.classList.add('active');
      else if (mode === 'light') EL.themeLight?.classList.add('active');
      else EL.themeDark?.classList.add('active');

      if (mode === 'auto') {
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (sysDark) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        return;
      }

      if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    };

    const init = () => {
      apply('auto');
      EL.themeAuto?.addEventListener('click', () => apply('auto'));
      EL.themeLight?.addEventListener('click', () => apply('light'));
      EL.themeDark?.addEventListener('click', () => apply('dark'));

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (EL.themeAuto?.classList.contains('active')) apply('auto');
      });
    };

    return { init, apply };
  })();

  // ----------------------------
  // Heat controller
  // ----------------------------
  const Heat = (() => {
    const HEAT_DURATION_MS = 5000;

    let heated = false;
    let inFirePrev = false;

    let endsAt = 0;
    let tCooldown = null;
    let tTick = null;
    let lastSec = null;

    // Fire rect cache
    let fireRect = null;

    const setBrandHeat = (on) => {
      EL.brandIron?.classList.toggle('heated', !!on);
    };

    const setHeated = (on) => {
      heated = !!on;
      EL.cursor?.classList.toggle('heated', heated);
      setBrandHeat(heated);
    };

    const stopTimers = () => {
      if (tCooldown) { clearTimeout(tCooldown); tCooldown = null; }
      if (tTick)     { clearInterval(tTick); tTick = null; }
    };

    const hideGauge = () => {
      if (!EL.heatGauge) return;
      EL.heatGauge.classList.remove('show');
      lastSec = null;
      EL.heatGauge.style.removeProperty('--heat-progress');
    };

    const showGauge = (sec) => {
      if (!EL.heatGauge || !EL.heatGaugeNum) return;

      EL.heatGauge.classList.add('show');

      // Only update when integer seconds change (prevents jitter)
      if (lastSec === sec) return;
      lastSec = sec;

      EL.heatGaugeNum.textContent = String(sec);
      EL.heatGaugeNum.classList.remove('bump');
      // force reflow to restart animation
      void EL.heatGaugeNum.offsetWidth;
      EL.heatGaugeNum.classList.add('bump');
    };

    const setProgress = (remainMs) => {
      if (!EL.heatGauge) return;
      const p = Math.max(0, Math.min(1, remainMs / HEAT_DURATION_MS));
      EL.heatGauge.style.setProperty('--heat-progress', String(p));
    };

    const coolDown = () => {
      setHeated(false);
      stopTimers();
      hideGauge();
    };

    const startCooldown = () => {
      stopTimers();
      endsAt = Date.now() + HEAT_DURATION_MS;

      showGauge(5);
      setProgress(HEAT_DURATION_MS);

      tTick = setInterval(() => {
        const remainMs = Math.max(0, endsAt - Date.now());
        const remainS  = Math.ceil(remainMs / 1000);
        setProgress(remainMs);

        if (remainS <= 0) {
          coolDown();
          return;
        }
        showGauge(remainS);
      }, 100);

      tCooldown = setTimeout(coolDown, HEAT_DURATION_MS);
    };

    const holdOnFire = () => {
      if (!heated) setHeated(true);
      // Holding on fire: keep hot, no countdown UI
      stopTimers();
      hideGauge();
      setBrandHeat(true);
    };

    const updateFireRect = () => {
      fireRect = EL.firePit?.getBoundingClientRect() || null;
    };

    const isInsideFire = (x, y) => {
      if (!fireRect) return false;
      return x >= fireRect.left && x <= fireRect.right && y >= fireRect.top && y <= fireRect.bottom;
    };

    const stepWithPointer = (x, y) => {
      const nowInFire = isInsideFire(x, y);

      if (nowInFire) {
        holdOnFire();
      } else {
        // Leaving moment: start countdown once
        if (inFirePrev && heated) startCooldown();
      }

      inFirePrev = nowInFire;
    };

    const igniteForMobileTap = () => {
      // Mobile: tap firepit => ignite + start countdown
      setHeated(true);
      startCooldown();
    };

    const isHot = () => heated;

    const init = () => {
      updateFireRect();
      window.addEventListener('resize', updateFireRect, { passive: true });
      window.addEventListener('scroll', updateFireRect, { passive: true });
      window.addEventListener('orientationchange', () => setTimeout(updateFireRect, 50), { passive: true });
      window.addEventListener('load', updateFireRect);

      // Mobile tap support
      EL.firePit?.addEventListener('click', () => {
        if (!isMobile()) return;
        if (Overlay.isOpen(EL.settingsModal) || Overlay.isOpen(EL.aboutOverlay) || Overlay.isOpen(EL.tutOverlay)) return;
        igniteForMobileTap();
      });
    };

    return {
      init,
      coolDown,
      isHot,
      stepWithPointer,
      igniteForMobileTap,
    };
  })();

  // ----------------------------
  // Cursor controller (custom iron cursor + fire collision via raf)
  // ----------------------------
  const Cursor = (() => {
    const pointer = {
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      dirty: false,
    };

    const setCursorPos = (x, y) => {
      if (!EL.cursor) return;
      EL.cursor.style.setProperty('--cx', x + 'px');
      EL.cursor.style.setProperty('--cy', y + 'px');
      if (EL.cursor.style.visibility !== 'visible') EL.cursor.style.visibility = 'visible';
    };

    const isBlocked = () =>
      document.body.classList.contains('settings-active') ||
      document.body.classList.contains('input-active');

    const rafLoop = () => {
      if (!isBlocked() && pointer.dirty) {
        pointer.dirty = false;
        setCursorPos(pointer.clientX, pointer.clientY);
        Heat.stepWithPointer(pointer.clientX, pointer.clientY);
      }
      requestAnimationFrame(rafLoop);
    };

    const onMove = (e) => {
      if (isBlocked()) return;

      // On touch, ignore moves in text input / modal area
      if (e.type.startsWith('touch')) {
        const t = e.target;
        if (t?.closest?.('#question-input') || t?.closest?.('.modal-scroll') || t?.closest?.('.about-card') || t?.closest?.('.tutorial-card')) {
          return;
        }
      }

      const p = getPointer(e);
      if (!p) return;

      pointer.clientX = p.clientX;
      pointer.clientY = p.clientY;
      pointer.pageX = p.pageX;
      pointer.pageY = p.pageY;
      pointer.dirty = true;
    };

    const init = () => {
      // Prefer pointer events (covers mouse + touch) but keep touchmove fallback for older engines
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchstart', onMove, { passive: true });

      requestAnimationFrame(rafLoop);
    };

    return { init };
  })();

  // ----------------------------
  // Tutorial (10s onboarding) — B안
  // ----------------------------
  const Tutorial = (() => {
    const STEPS = [
      {
        title: '하문을 적으시오',
        desc:  '검색창에 질문을 적고 “지글 검색”을 누르시오.',
        target: '#question-input',
      },
      {
        title: '인두를 달구시오',
        desc:  '커서를 화로(숯불) 위에 올리면 인두가 달아오르옵니다.',
        target: '#fire-pit-container',
      },
      {
        title: '5초 안에 지지시오',
        desc:  '화로에서 떼는 순간 5초 제한이 생기오니, 죄인을 지져 답을 얻으시옵소서.',
        target: '#person-container',
      },
    ];

    let step = 0;
    let manual = false;
    let timers = [];

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const clearTimers = () => {
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };

    const positionCoachmark = () => {
      if (!EL.tutOverlay || !EL.tutSpotlight || !EL.tutPopover) return;
      if (!Overlay.isOpen(EL.tutOverlay)) return;

      const s = STEPS[step];
      const target = s?.target ? qs(s.target) : null;

      if (!target) {
        EL.tutSpotlight.classList.add('hide');
        EL.tutPopover.style.left = '16px';
        EL.tutPopover.style.top  = '16px';
        EL.tutPopover.dataset.placement = 'bottom';
        EL.tutPopover.style.removeProperty('--arrow-x');
        EL.tutPopover.style.removeProperty('--arrow-y');
        return;
      }

      const r = target.getBoundingClientRect();
      const pad = 10;

      // Spotlight sizing
      const left = Math.max(8, r.left - pad);
      const top  = Math.max(8, r.top  - pad);
      const width  = Math.min(window.innerWidth  - left - 8, r.width  + pad * 2);
      const height = Math.min(window.innerHeight - top  - 8, r.height + pad * 2);

      EL.tutSpotlight.classList.remove('hide');
      EL.tutSpotlight.style.left = left + 'px';
      EL.tutSpotlight.style.top = top + 'px';
      EL.tutSpotlight.style.width = width + 'px';
      EL.tutSpotlight.style.height = height + 'px';

      // Popover near target
      const gap = 12;
      const margin = 12;

      const popRect = EL.tutPopover.getBoundingClientRect();
      const popW = popRect.width || 320;
      const popH = popRect.height || 160;

      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;

      const fits = (x, y) =>
        x >= margin &&
        y >= margin &&
        x + popW <= window.innerWidth - margin &&
        y + popH <= window.innerHeight - margin;

      const candidates = [
        'bottom',
        'right',
        'top',
        'left',
      ];

      let chosen = 'bottom';
      let x = margin;
      let y = margin;

      for (const p of candidates) {
        let tx = margin, ty = margin;

        if (p === 'bottom') {
          tx = clamp(cx - popW / 2, margin, window.innerWidth - margin - popW);
          ty = r.bottom + gap;
        } else if (p === 'top') {
          tx = clamp(cx - popW / 2, margin, window.innerWidth - margin - popW);
          ty = r.top - gap - popH;
        } else if (p === 'right') {
          tx = r.right + gap;
          ty = clamp(cy - popH / 2, margin, window.innerHeight - margin - popH);
        } else if (p === 'left') {
          tx = r.left - gap - popW;
          ty = clamp(cy - popH / 2, margin, window.innerHeight - margin - popH);
        }

        if (fits(tx, ty)) {
          chosen = p;
          x = tx;
          y = ty;
          break;
        }
      }

      EL.tutPopover.style.left = x + 'px';
      EL.tutPopover.style.top  = y + 'px';
      EL.tutPopover.dataset.placement = chosen;

      // Arrow alignment
      if (chosen === 'bottom' || chosen === 'top') {
        const arrowX = clamp(cx - x - 5, 18, popW - 28);
        EL.tutPopover.style.setProperty('--arrow-x', arrowX + 'px');
        EL.tutPopover.style.removeProperty('--arrow-y');
      } else {
        const arrowY = clamp(cy - y - 5, 18, popH - 28);
        EL.tutPopover.style.setProperty('--arrow-y', arrowY + 'px');
        EL.tutPopover.style.removeProperty('--arrow-x');
      }
    };

    const render = () => {
      const s = STEPS[step];
      if (!s) return;

      EL.tutTitle && (EL.tutTitle.textContent = s.title);
      EL.tutDesc  && (EL.tutDesc.textContent  = s.desc);
      EL.tutLabel && (EL.tutLabel.textContent = `팁 ${step + 1}/${STEPS.length}`);

      EL.tutDots?.forEach((d, i) => d.classList.toggle('active', i === step));

      if (EL.tutPrev) {
        EL.tutPrev.disabled = step === 0;
      }

      if (EL.tutNext) {
        EL.tutNext.textContent = step === STEPS.length - 1 ? '완료' : '다음';
      }

      const target = s.target ? qs(s.target) : null;
      if (target) {
        try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        setTimeout(positionCoachmark, 220);
      } else {
        positionCoachmark();
      }
    };

    const open = () => {
      if (!EL.tutOverlay) return;

      manual = false;
      step = 0;

      Overlay.open(EL.tutOverlay);
      render();
      clearTimers();

      // 10s autoplay: 3s / 3s / 4s (manual interaction cancels)
      timers.push(setTimeout(() => { if (!manual) { step = 1; render(); } }, 3000));
      timers.push(setTimeout(() => { if (!manual) { step = 2; render(); } }, 6000));
      timers.push(setTimeout(() => { if (!manual) close(); }, 10000));

      window.addEventListener('resize', positionCoachmark);
      window.addEventListener('scroll', positionCoachmark);
      setTimeout(positionCoachmark, 60);
    };

    const close = () => {
      if (!EL.tutOverlay) return;

      clearTimers();
      Overlay.close(EL.tutOverlay);

      EL.tutSpotlight?.classList.add('hide');
      if (EL.tutPopover) {
        EL.tutPopover.style.removeProperty('--arrow-x');
        EL.tutPopover.style.removeProperty('--arrow-y');
      }

      window.removeEventListener('resize', positionCoachmark);
      window.removeEventListener('scroll', positionCoachmark);
    };

    const init = () => {
      EL.tutOverlay?.addEventListener('click', (e) => {
        if (e.target === EL.tutOverlay) close();
      });

      EL.tutClose?.addEventListener('click', close);

      EL.tutSkip?.addEventListener('click', () => {
        manual = true;
        close();
      });

      EL.tutPrev?.addEventListener('click', () => {
        manual = true;
        clearTimers();
        step = Math.max(0, step - 1);
        render();
      });

      EL.tutNext?.addEventListener('click', () => {
        manual = true;
        clearTimers();
        if (step >= STEPS.length - 1) close();
        else {
          step = Math.min(STEPS.length - 1, step + 1);
          render();
        }
      });
    };

    return { init, open, close };
  })();;

  // ----------------------------
  // Bubble helpers + effects
  // ----------------------------
  const Bubble = (() => {
    let tHide = null;

    const show = (text, ms = 2400) => {
      if (!EL.bubble) return;
      EL.bubble.textContent = text;
      EL.bubble.style.visibility = 'visible';

      if (tHide) clearTimeout(tHide);
      tHide = setTimeout(() => {
        EL.bubble && (EL.bubble.style.visibility = 'hidden');
      }, ms);
    };

    const hide = () => {
      if (!EL.bubble) return;
      EL.bubble.style.visibility = 'hidden';
      if (tHide) { clearTimeout(tHide); tHide = null; }
    };

    return { show, hide };
  })();

  const Effects = (() => {
    const smoke = (pageX, pageY) => {
      const particleCount = 15;
      for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
          const p = document.createElement('div');
          p.className = 'smoke-particle';

          const size = (Math.random() * 15 + 15) + 'px';
          p.style.width = size;
          p.style.height = size;

          const ox = (Math.random() - 0.5) * 40;
          const oy = (Math.random() - 0.5) * 20;

          p.style.left = (pageX + ox) + 'px';
          p.style.top  = (pageY + oy) + 'px';

          document.body.appendChild(p);
          setTimeout(() => p.remove(), 2500);
        }, i * 40);
      }
    };

    const burnMark = (clientX, clientY) => {
      if (!EL.person) return;
      const rect = EL.person.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const mark = document.createElement('div');
      mark.className = 'burn-mark';
      mark.style.left = (localX - 20) + 'px';
      mark.style.top  = (localY - 20) + 'px';

      EL.person.appendChild(mark);
      setTimeout(() => mark.remove(), 8000);
    };

    return { smoke, burnMark };
  })();

  // ----------------------------
  // App wiring
  // ----------------------------
  const ABOUT_KEY = 'geegle_about_text';
  const GEEGLE_FOOTER_URL = 'https://github.com/shimseunggi/geegle/'; // keep as-is

  const bindSettings = () => {
    if (!EL.settingsModal) return;

    EL.settingsOpen?.addEventListener('click', () => Overlay.open(EL.settingsModal));
    EL.settingsClose?.addEventListener('click', () => Overlay.close(EL.settingsModal));

    EL.settingsModal.addEventListener('click', (e) => {
      if (e.target === EL.settingsModal) Overlay.close(EL.settingsModal);
    });
  };

  const bindAbout = () => {
    // Currently footer opens URL (kept behavior). About modal stays in DOM for later use.
    EL.footerBtn?.addEventListener('click', () => {
      window.open(GEEGLE_FOOTER_URL, '_blank', 'noopener,noreferrer');
    });

    EL.aboutCancel?.addEventListener('click', () => Overlay.close(EL.aboutOverlay));
    EL.aboutSave?.addEventListener('click', () => {
      const v = (EL.aboutText?.value || '').trim();
      try { localStorage.setItem(ABOUT_KEY, v); } catch {}
      Overlay.close(EL.aboutOverlay);
    });
    EL.aboutOverlay?.addEventListener('click', (e) => {
      if (e.target === EL.aboutOverlay) Overlay.close(EL.aboutOverlay);
    });
  };

  const bindGlobalKeys = () => {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      if (Overlay.isOpen(EL.tutOverlay)) { Tutorial.close(); return; }
      if (Overlay.isOpen(EL.aboutOverlay)) Overlay.close(EL.aboutOverlay);
      if (Overlay.isOpen(EL.settingsModal)) Overlay.close(EL.settingsModal);
    });
  };

  const bindSearch = () => {
    if (!EL.questionInput) return;

    EL.clearBtn?.addEventListener('click', () => {
      EL.questionInput.value = '';
      EL.questionInput.focus();
    });

    EL.questionInput.addEventListener('focus', () => document.body.classList.add('input-active'));
    EL.questionInput.addEventListener('blur',  () => document.body.classList.remove('input-active'));

    const promptToInterrogate = () => {
      Bubble.show('질문을 적었으면… 인두를 달궈 죄인을 지지시오!', 2400);
      if (isMobile()) EL.person?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    EL.btnSearch?.addEventListener('click', () => {
      EL.questionInput.blur();
      promptToInterrogate();
    });

    EL.btnExplain?.addEventListener('click', () => {
      EL.questionInput.blur();
      Tutorial.open();
    });

    EL.questionInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      promptToInterrogate();
    });
  };

  const bindSinner = () => {
    if (!EL.person || !EL.sinner) return;

    // Local timers (kept behavior)
    let burnTimer = null;
    let answerTimer = null;
    let painFailSafe = null;

    EL.person.addEventListener('click', (e) => {
      // Note: settings/about overlay open are considered "blocked"
      if (Overlay.isOpen(EL.settingsModal) || Overlay.isOpen(EL.aboutOverlay) || Overlay.isOpen(EL.tutOverlay)) return;

      const targetPart = e.target.closest('.head, .torso, .thigh');
      if (!targetPart) return;

      const question = (EL.questionInput?.value || '').trim();

      // Clear previous interaction timers
      if (burnTimer) { clearTimeout(burnTimer); burnTimer = null; }
      if (answerTimer) { clearTimeout(answerTimer); answerTimer = null; }
      if (painFailSafe) { clearTimeout(painFailSafe); painFailSafe = null; }

      EL.sinner.classList.remove('pain');

      if (!Heat.isHot()) {
        // coldMockery comes from the preserved answer engine block
        const mock = coldMockery[Math.floor(Math.random() * coldMockery.length)];
        Bubble.show(mock, 2200);
        return;
      }

      // Force restart pain animation
      void EL.sinner.offsetWidth;
      EL.sinner.classList.add('pain');
      painFailSafe = setTimeout(() => {
        EL.sinner.classList.remove('pain');
        painFailSafe = null;
      }, 2000);

      const p = getPointer(e) || {
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.clientX + window.scrollX,
        pageY: e.clientY + window.scrollY,
      };

      Effects.smoke(p.pageX, p.pageY);

      // Immediate scream
      if (EL.bubble) {
        EL.bubble.style.visibility = 'visible';
        EL.bubble.textContent = '으아아악!!!';
      }

      // Burning consumes heat immediately
      Heat.coolDown();

      burnTimer = setTimeout(() => {
        Effects.burnMark(p.clientX, p.clientY);
        burnTimer = null;
      }, 280);

      answerTimer = setTimeout(() => {
  let pick;

  try {
    pick = question ? geegleAnswer(question) : pickOne(noQuestionAnswers);
  } catch (err) {
    console.error("[geegleAnswer error]", err);
    // 에러 나도 비명에서 빠져나오도록 안전 문구
    pick = "전하… 소인의 말이 잠시 엉켰사옵니다. 다시 한 번 지져 주시옵소서.";
    // 또는: pick = hallucinatedFallback(question || "");
  }

  if (EL.bubble) {
    EL.bubble.textContent = pick;
    EL.bubble.style.visibility = 'visible';
  }

  setTimeout(() => {
    EL.sinner.classList.remove('pain');
    if (painFailSafe) { clearTimeout(painFailSafe); painFailSafe = null; }
    Bubble.show(pick, 3200);
  }, 450);

  answerTimer = null;
}, 520);

    });
  };

  const init = () => {
    // Core subsystems
    Theme.init();
    Heat.init();
    Cursor.init();
    Tutorial.init();

    // UI bindings
    bindSettings();
    bindAbout();
    bindGlobalKeys();
    bindSearch();
    bindSinner();
  };

  // ----------------------------
  // Preserve the original rule-based answer engine (verbatim)
  // ----------------------------
// ============================
// A버전: “답만 하는” 규칙 기반 답변 엔진(오프라인)
// - API/모델 없이, 질문 패턴 → 짧은 조선시대 말투 답변
// - 경우의 수(룰)를 많이 넣어두면 자연스럽게 "똑똑한 척" 가능
// ============================

function pickOne(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function normalizeQ(s){
  return (s || '')
    .toString()
    .trim()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ');
}
function lowerQ(s){ return normalizeQ(s).toLowerCase(); }

// ✅ 질문이 없을 때(그대로 유지)
const noQuestionAnswers = [
  "묻는 말이 없사온데, 어찌 답하오리까.",
  "질문을 적으시옵고 지지시옵소서.",
  "무엇을 물으시는지 먼저 적어주시옵소서.",
  "글을 남기시옵소서. 소인이 곧 답하리다.",
  "질문이 없으니, 대답도 없사옵니다요."
];

// ✅ 인두가 차가울 때(그대로 유지)
const coldMockery = [
  "하나도 안 뜨겁사옵니다요.",
  "화로에 다시 달구어 오시옵소서.",
  "식은 인두로는 어림없사옵니다요.",
  "시원하옵니다요. 더 달구시옵소서.",
  "장난은 그만하시옵고, 불을 더 지피시옵소서."
];

// ✅ 규칙(패턴) → 답변 후보들
// - re: 정규식(대소문자 무시 i)
// - replies: 짧은 답변 여러 개(랜덤 선택)
const A_RULES = [
  // 0) 인사/대화
  { re: /\b(안녕|하이|hello|hi|반가워|반갑)\b/i, replies: [
    "반갑사옵니다요.",
    "안녕하시옵니까요.",
    "평안하시옵니까요.",
    "무탈하시옵니까요."
  ]},
  { re: /\b(고마워|감사|thanks|thx)\b/i, replies: [
    "별말씀을요.",
    "소인이 영광이옵니다요.",
    "고맙게 여겨 주시니 다행이옵니다요.",
    "천만에요."
  ]},
  { re: /\b(미안|죄송|sorry)\b/i, replies: [
    "괜찮사옵니다요.",
    "허물은 잊으시옵소서.",
    "마음 쓰지 마시옵소서.",
    "부디 상심치 마시옵소서."
  ]},
  { re: /\b(잘자|굿나잇|good night|취침|자러)\b/i, replies: [
    "편히 쉬시옵소서.",
    "단잠 드시옵소서.",
    "꿈자리가 좋으시길 비옵니다요.",
    "내일을 위해 몸을 아끼시옵소서."
  ]},
  { re: /\b(좋아|사랑|최고|짱)\b/i, replies: [
    "그 마음, 기쁘옵니다요.",
    "고맙사옵니다요.",
    "좋사옵니다요."
  ]},

  // 1) 정체/설명
  { re: /(너 누구|누구냐|정체|너 뭐야|지글|geegle)/i, replies: [
    "소인은 지글이라 하옵니다요.",
    "지글이라 부르시옵소서.",
    "소인은 물음에 답하는 자이옵니다요.",
    "인두로 물어 답을 얻는 장난이옵니다요."
  ]},
  { re: /(사용법|어떻게 써|어케 써|how to use|help|도움)/i, replies: [
    "질문을 적고, 인두를 달군 뒤 죄인을 지지시옵소서.",
    "먼저 물음을 적으시고, 화로에 인두를 달구시옵소서.",
    "적고 → 달구고 → 지지면, 답이 나오옵니다요.",
    "검색을 누르고, 인두를 달구어 지지시옵소서."
  ]},

  // 2) 시간/날짜(로컬 기준)
  { re: /(몇 ?시|시간 알려|time now|지금 시간)/i, replies: ["__TIME__"] },
  { re: /(오늘 날짜|며칠|몇월|몇 일|date today|오늘 몇일)/i, replies: ["__DATE__"] },
  { re: /(요일|무슨 요일|day of week)/i, replies: ["__DOW__"] },

  // 3) 날씨(실측 불가 → 컨셉 답변)
  { re: /(날씨|기온|온도|비 와|비오|눈 와|눈오|미세먼지|황사)/i, replies: [
    "오늘 날씨는 좋습니다요.",
    "오늘 날씨는 무난하옵니다요.",
    "오늘은 바람이 잦사옵니다요.",
    "오늘은 하늘이 밝사옵니다요.",
    "오늘은 바깥이 거칠 수 있사오니 조심하시옵소서."
  ]},
  { re: /(춥|추워|한파)/i, replies: [
    "바람이 매섭사오니 겹겹이 입으시옵소서.",
    "몸을 덥히시옵소서.",
    "따뜻한 차 한 잔이 좋겠사옵니다요.",
    "손발을 먼저 녹이시옵소서."
  ]},
  { re: /(덥|더워|폭염)/i, replies: [
    "바람 잘 통하는 옷이 좋사옵니다요.",
    "물 자주 드시옵소서.",
    "그늘을 찾으시옵소서.",
    "몸을 식히시옵소서."
  ]},
  { re: /(우산|비 맞|장마)/i, replies: [
    "우산을 챙기시옵소서.",
    "빗길은 미끄럽사오니 조심하시옵소서.",
    "비를 맞으면 감기 들기 쉽사옵니다요."
  ]},

  // 4) 옷/코디/꾸밈
  { re: /(뭐 입|옷 추천|코디|스타일|룩|패션)/i, replies: [
    "단정한 옷이 제일 무난하옵니다요.",
    "겉옷 하나는 챙기시옵소서.",
    "색은 두 가지만 맞추면 깔끔하옵니다요."
  ]},

  // 5) 음식/메뉴
  { re: /(뭐 먹|뭐먹|점심|저녁|아침|야식|메뉴 추천|먹을거|배고)/i, replies: [
    "따끈한 국밥이 좋사옵니다요.",
    "면 한 그릇이 속을 달래주옵니다요.",
    "든든하게 밥과 반찬을 챙기시옵소서.",
    "가벼이 드시려면 죽이 무난하옵니다요.",
    "간단히 김밥 한 줄도 좋사옵니다요."
  ]},
  { re: /(매운|매콤)/i, replies: [
    "매운맛은 잠시 마음을 깨우옵니다요.",
    "매콤하게 드시되 속은 살피시옵소서.",
    "매운 것은 적당히가 좋사옵니다요."
  ]},
  { re: /(커피|카페인|아메리카노|라떼)/i, replies: [
    "커피 한 잔은 정신을 맑게 하옵니다요.",
    "카페인은 과하면 잠을 해치옵니다요.",
    "한 잔만으로도 충분하옵니다요."
  ]},
  { re: /(술|음주|소주|맥주)/i, replies: [
    "술은 과하면 몸을 해치옵니다요.",
    "오늘은 한 잔으로 그치시옵소서.",
    "물도 함께 드시옵소서."
  ]},

  // 6) 컨디션/건강(안전형 한 줄)
  { re: /(아파|통증|열나|두통|기침|가래|설사|구토|감기|독감|코막힘|비염)/i, replies: [
    "휴식과 수분이 먼저이옵니다요.",
    "병세가 크면 의관을 찾으시옵소서.",
    "증세가 이어지면 진찰을 받으시옵소서."
  ]},
  { re: /(약|약 먹|처방|복용|부작용)/i, replies: [
    "약은 처방과 설명을 따르시옵소서.",
    "복용은 의관의 뜻을 좇는 것이 옳사옵니다요.",
    "불편이 크면 약사나 의관께 묻는 것이 안전하옵니다요."
  ]},
  { re: /(다이어트|살 빼|체중|몸무게)/i, replies: [
    "적게 먹고 자주 움직이시옵소서.",
    "급히 빼면 급히 돌아오옵니다요.",
    "꾸준함이 이기옵니다요."
  ]},

  // 7) 감정/멘탈
  { re: /(우울|불안|힘들|지쳤|스트레스|멘탈|공허)/i, replies: [
    "오늘은 쉬어 가시옵소서.",
    "숨을 고르고 한 걸음씩 가시옵소서.",
    "지친 날엔 잠시 멈춤도 용기이옵니다요.",
    "말로 풀면 마음이 가벼워지옵니다요."
  ]},
  { re: /(짜증|화나|열받|빡쳐)/i, replies: [
    "잠시 물 한 모금 하고 가시옵소서.",
    "한 걸음 물러나면 길이 보이옵니다요.",
    "성낸다고 일이 풀리진 않사옵니다요."
  ]},

  // 8) 공부/일/동기
  { re: /(공부|과제|시험|레포트|보고서|면접|발표|프레젠|ppt)/i, replies: [
    "먼저 목차를 세우시옵소서.",
    "작게 쪼개면 끝이 보이옵니다요.",
    "오늘 할 몫을 정하고 바로 시작하시옵소서.",
    "마감부터 역산하시옵소서."
  ]},
  { re: /(집중|집중 안돼|딴생각|미루|게으름)/i, replies: [
    "열다섯 숨만큼만 시작하시옵소서.",
    "핸드폰을 잠시 멀리 두시옵소서.",
    "한 번에 한 가지를 하시옵소서.",
    "타이머를 켜고 10분만 해보시옵소서."
  ]},
  { re: /(동기|의욕|의지|귀찮)/i, replies: [
    "하기 싫을 때가 진짜 실력이옵니다요.",
    "작게 시작하면 의욕은 뒤따르옵니다요.",
    "오늘은 최소한만 하시옵소서."
  ]},

  // 9) 운동/루틴
  { re: /(운동|헬스|러닝|수영|스트레칭|근력|유산소|요가)/i, replies: [
    "가볍게 몸을 풀고 천천히 올리시옵소서.",
    "무리하면 탈이 나옵니다요.",
    "꾸준함이 제일이옵니다요.",
    "오늘은 폼을 지키는 게 우선이옵니다요."
  ]},

  // 10) 일정/계획/시간관리
  { re: /(일정|계획|스케줄|루틴|시간표)/i, replies: [
    "오늘 할 일 셋만 적으시옵소서.",
    "큰 일은 쪼개야 움직이옵니다요.",
    "가장 급한 것부터 처리하시옵소서."
  ]},

  // 11) 돈/소비/투자(안전형)
  { re: /(돈|예산|저축|절약|소비|지출)/i, replies: [
    "쓰임을 먼저 정하면 새는 돈이 줄어드옵니다요.",
    "필요와 욕심을 가르시옵소서.",
    "오늘은 지갑을 단단히 여미시옵소서.",
    "한 번 장바구니에 담고 하루를 두시옵소서."
  ]},
  { re: /(투자|주식|코인|비트|etf|리스크|수익률)/i, replies: [
    "수익엔 늘 위험이 따르옵니다요.",
    "잃어도 되는 돈으로만 하시옵소서.",
    "남 말만 믿고 들어가면 후회가 남사옵니다요."
  ]},

  // 12) 여행/어디갈까
  { re: /(여행|어디 가|어디갈|나들이|데이트|갈만한)/i, replies: [
    "가까운 곳부터 다녀오시옵소서.",
    "사람 적은 시간대를 노리시옵소서.",
    "걷기 좋은 곳이 무난하옵니다요."
  ]},

  // 13) 기술/코딩/오류
  { re: /(버그|오류|에러|error|콘솔|console|js|javascript|css|html|프론트|백엔드)/i, replies: [
    "콘솔의 붉은 글을 먼저 살피시옵소서.",
    "최근에 바꾼 부분부터 되짚으시옵소서.",
    "하나씩 끊어가며 원인을 찾으시옵소서.",
    "캐시를 비우고 다시 보시옵소서."
  ]},
  { re: /(깃허브|github|pages|배포|deploy|도메인|호스팅)/i, replies: [
    "정적 파일이면 깃허브 페이지로도 족하옵니다요.",
    "경로와 대소문자를 엄격히 맞추시옵소서.",
    "캐시가 남으면 강력 새로고침을 하시옵소서."
  ]},

  // 14) 요약/정리/번역/해석
  { re: /(요약|정리|핵심|한줄)/i, replies: [
    "원문을 붙여주시면 핵심만 뽑아드리겠사옵니다요.",
    "자료를 주시면 깔끔히 정리하겠사옵니다요.",
    "내용을 보여주셔야 요약이 가능하옵니다요."
  ]},
  { re: /(번역|해석|translate)/i, replies: [
    "원문을 주시면 옮기겠사옵니다요.",
    "문장을 보내주시면 번역해드리겠사옵니다요.",
    "원문이 없으니 번역이 어려우옵니다요."
  ]},
  { re: /(맞춤법|띄어쓰기|오탈자)/i, replies: [
    "문장을 붙여주시면 바로잡아드리겠사옵니다요.",
    "글을 주시면 매만져드리겠사옵니다요."
  ]},

  // 15) 선택/추천/비교
  { re: /(추천|골라|선택|뭐가 좋|어떤게 좋|사야)/i, replies: [
    "무난한 쪽이 길게 가옵니다요.",
    "지금은 간단한 선택이 옳사옵니다요.",
    "가장 자주 쓰는 것을 고르시옵소서.",
    "후회가 적은 쪽을 택하시옵소서."
  ]},
  { re: /(비교|차이|vs|대비)/i, replies: [
    "장점과 단점을 나눠 보시옵소서.",
    "가격·내구·편의 셋만 보면 답이 나오옵니다요.",
    "목적이 분명하면 선택도 쉬워지옵니다요."
  ]},

  // 16) 관계/연애/사람
  { re: /(연애|썸|짝사랑|헤어|이별|고백)/i, replies: [
    "말로 정리하면 길이 트이옵니다요.",
    "상대의 뜻도 살피시옵소서.",
    "마음을 숨기면 후회가 남사옵니다요."
  ]},
  { re: /(친구|사람|관계|소통|대화|오해)/i, replies: [
    "말을 짧고 분명히 하시옵소서.",
    "상대의 말을 끝까지 들으시옵소서.",
    "감정은 낮추고 사실을 올리시옵소서."
  ]},

  // 17) 디자인/감각
  { re: /(디자인|레이아웃|타이포|폰트|그리드|색|컬러|브랜딩|로고)/i, replies: [
    "여백이 곧 품격이옵니다요.",
    "폰트는 두 가지만 쓰시옵소서.",
    "대비를 세우면 읽힘이 좋아지옵니다요.",
    "정렬만 맞춰도 반은 먹고 들어가옵니다요."
  ]},

  // 18) 가격/얼마/비용
  { re: /(얼마|가격|비용|값|견적)/i, replies: [
    "값은 곳마다 다르옵니다요.",
    "정확한 값은 조건을 더 알려주셔야 하옵니다요.",
    "대략은 가능하오나, 세부가 필요하옵니다요."
  ]},

  // 19) 왜/원인/이유
  { re: /(왜|원인|이유|까닭)/i, replies: [
    "대개는 조건이 하나 어긋난 탓이옵니다요.",
    "원인은 하나가 아닐 때가 많사옵니다요.",
    "최근에 바뀐 것이 원인일 가능성이 크옵니다요."
  ]},

  // 20) 방법/어떻게/해야
  { re: /(어떻게|방법|해결|해야|하나)/i, replies: [
    "큰 걸 먼저, 작은 건 나중에 하시옵소서.",
    "한 번에 하나씩 처리하시옵소서.",
    "가장 쉬운 것부터 손대면 길이 트이옵니다요."
  ]},

  // 21) 가능/불가능/해도돼
  { re: /(가능해|가능함|해도 돼|해도되|되나|될까)/i, replies: [
    "가능하옵니다요.",
    "대개는 되옵니다요.",
    "조건만 맞추면 되옵니다요."
  ]},
  { re: /(불가능|안 돼|안되|못해|힘들어)/i, replies: [
    "그 일은 어렵사옵니다요.",
    "지금은 무리이옵니다요.",
    "다른 길을 택하시옵소서."
  ]},

  // 22) 운세/점/미신
  { re: /(운세|사주|점괘|타로)/i, replies: [
    "운은 참고만 하시옵소서.",
    "오늘은 마음가짐이 길흉을 가르옵니다요.",
    "좋은 징조만 취하시옵소서."
  ]},

  // 23) 게임/잡담
  { re: /(게임|스듀|스타듀|stardew|롤|발로|minecraft|포켓몬)/i, replies: [
    "즐길 땐 즐기되, 끝낼 때는 끝내시옵소서.",
    "오늘은 운이 따르옵니다요.",
    "너무 무리하진 마시옵소서."
  ]},

  // 24) 정치/사회(중립 한 줄)
  { re: /(정치|대통령|선거|국회|정당)/i, replies: [
    "그 일은 각자 판단이 필요하옵니다요.",
    "여럿의 말을 듣고 스스로 가르시옵소서.",
    "감정이 아닌 근거를 살피시옵소서."
  ]},

  // 25) 욕설/무례(톤 정리)
  { re: /(ㅅㅂ|시발|씨발|병신|좆|꺼져|닥쳐)/i, replies: [
    "말을 고르시옵소서.",
    "거친 말은 복을 쫓아내옵니다요.",
    "잠시 숨을 고르시옵소서."
  ]},

  // 26) 예/아니오(짧게)
  { re: /^(응|ㅇㅇ|그래|그렇지|맞아|예|yes)\b/i, replies: [
    "그러하옵니다요.",
    "옳사옵니다요.",
    "그리 하시옵소서."
  ]},
  { re: /^(아니|ㄴㄴ|no|아닙|싫)\b/i, replies: [
    "아니옵니다요.",
    "그리 아니하옵니다요.",
    "그 길은 피하시옵소서."
  ]},
];

// ✅ 마지막 폴백(아무 룰에도 안 걸릴 때)
const A_FALLBACK = [
  "그러하옵니다요.",
  "그리 하시면 되옵니다요.",
  "소인이 보기엔 무난하옵니다요.",
  "지금은 그리 하시되, 상황을 보며 바꾸시옵소서.",
  "알 길이 없사오니, 더 자세히 적어주시옵소서."
];

// ✅ "질문에 답한 것처럼" 보이게 하는 폴백/분류기 (정리본)
// - 목표: "잘생겼어는..." 같은 비문 제거 + 6W/평가질문 안정 처리 + 조선톤 유지

function hasJongseong(word){
  const w = String(word || '').trim();
  if (!w) return false;
  const ch = w[w.length - 1];
  const code = ch.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return ((code - 0xAC00) % 28) !== 0;
}
function josa(word, a, b){ return hasJongseong(word) ? a : b; }

// 말풍선은 짧을수록 그럴듯해서, 강제로 한 줄로 압축
function oneLine(text, maxLen = 54){
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? (t.slice(0, maxLen - 1) + "…") : t;
}

function stripEndPunct(s){
  return String(s || '').trim().replace(/[?？!！.。…]+$/g, '').trim();
}
function cleanPhrase(s){
  return stripEndPunct(s).replace(/\s+/g,' ').trim();
}
function stripJosaSuffix(t){
  t = cleanPhrase(t);
  if (t.length <= 1) return t;

  // 조사 1회 제거
  t = t.replace(/(께서|에게|한테|에서|부터|까지|마다|조차|마저|으로|로|은|는|이|가|을|를|와|과|의|에|도|만)$/u, '');
  // 종결/의문 어미 1회 제거(동사/형용사 꼬리 최소화)
  t = t.replace(/(인가요|인가|이야|야|냐|니|임|여|요)$/u, '');
  return t.trim();
}

function formatTwo(n){ return String(n).padStart(2, '0'); }
function getTimeLine(){
  const d = new Date();
  return `지금은 ${d.getHours()}시 ${formatTwo(d.getMinutes())}분이옵니다요.`;
}
function getDateLine(){
  const d = new Date();
  return `오늘은 ${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일이옵니다요.`;
}
function getDowLine(){
  const d = new Date();
  const days = ["일","월","화","수","목","금","토"];
  return `오늘은 ${days[d.getDay()]}요일이옵니다요.`;
}

// ✅ 아주 간단한 산수 처리
function trySimpleMath(raw){
  const s = String(raw || '').replace(/,/g,'').trim();
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;

  const a = Number(m[1]), op = m[2], b = Number(m[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  let r;
  if (op === '+') r = a + b;
  else if (op === '-') r = a - b;
  else if (op === '*') r = a * b;
  else if (op === '/') {
    if (b === 0) return "0으로 나눌 수는 없사옵니다요.";
    r = a / b;
  }

  const pretty = Number.isInteger(r) ? String(r) : String(Math.round(r * 1000) / 1000);
  return `그 값은 ${pretty}이옵니다요.`;
}

// ----------------------------
// 6W/예아니오/평가 질문 분류
// ----------------------------
const STOP_QWORDS = new Set([
  '어디','어딨','어딨어','어디에','어디야','어디있어',
  '언제','누구','누가','뭐','무엇','왜','어떻게','어케','어떡',
  '잘생겼어','예뻐','멋있어','귀여워','괜찮아','좋아','나빠'
]);

function classifySixW(q){
  const s = cleanPhrase(q);
  if (/(어딨|어딨어|어디(에|서)?|어디야|어디있어|위치|장소)/i.test(s)) return "WHERE";
  if (/(언제|몇\s*시|몇시|날짜|며칠|기간|언제까지|시간|몇\s*월|몇\s*일)/i.test(s)) return "WHEN";
  if (/(누구|누가|누굴|누구야)/i.test(s)) return "WHO";
  if (/(왜|이유|원인|까닭|어째서)/i.test(s)) return "WHY";
  if (/(어떻게|어케|어떡|방법|하는\s*법|해결|설정|세팅|고쳐)/i.test(s)) return "HOW";
  if (/(뭐|무엇|뜻|의미|정의|뭔데|뭐야|무슨)/i.test(s)) return "WHAT";
  return null;
}

function extractTopicBefore(q, keywordRe){
  const s = cleanPhrase(q);
  const m = s.match(new RegExp(`^(.+?)\\s*(은|는|이|가)?\\s*${keywordRe.source}`, 'u'));
  if (!m) return { topic: "", particle: "" };
  const topic = cleanPhrase(m[1]);
  const particle = (m[2] || "").trim();
  if (!topic || STOP_QWORDS.has(topic)) return { topic: "", particle: "" };
  return { topic, particle };
}

// ✅ WHERE는 "모르옵니다" 계열로 고정 (원하신 동작)
function answerBySixW(q){
  const s = cleanPhrase(q);
  const type = classifySixW(s);
  if (!type) return null;

  if (type === "WHERE"){
    const { topic, particle } = extractTopicBefore(s, /(어딨|어딨어|어디)/u);
    if (topic){
      const p = (particle === "은" || particle === "는") ? particle : josa(topic, "은", "는");
      return `소인 아뢰오되, ${topic}${p} 어디에 있는지 모르옵니다요.`;
    }
    return "소인 아뢰오되, 무엇의 위치를 묻는지 모르옵니다요.";
  }

  if (type === "WHEN"){
    const { topic, particle } = extractTopicBefore(s, /(언제|몇\s*시|몇시|날짜|기간|며칠|시간)/u);
    if (topic){
      const p = (particle === "은" || particle === "는") ? particle : josa(topic, "은", "는");
      return `소인 아뢰오되, ${topic}${p} 언제인지는 알지 못하옵니다요.`;
    }
    return "소인 아뢰오되, 언제인지는 소인이 알지 못하옵니다요.";
  }

  if (type === "WHO"){
    const { topic, particle } = extractTopicBefore(s, /(누구|누가)/u);
    if (topic){
      const p = (particle === "은" || particle === "는") ? particle : josa(topic, "은", "는");
      return `소인 아뢰오되, ${topic}${p} 누구인지는 알지 못하옵니다요.`;
    }
    return "소인 아뢰오되, 누구인지는 소인이 알지 못하옵니다요.";
  }

  if (type === "WHY"){
    return "소인 아뢰오되, 그 까닭은 단정하기 어렵사옵니다요.";
  }

  if (type === "HOW"){
    return "소인 아뢰오되, 방법은 하나로 못 박기 어렵사옵니다요.";
  }

  if (type === "WHAT"){
    const { topic, particle } = extractTopicBefore(s, /(뭐|무엇|뜻|의미|정의)/u);
    if (topic){
      const p = (particle === "은" || particle === "는") ? particle : josa(topic, "은", "는");
      return `소인 아뢰오되, ${topic}${p} 무엇인지는 알지 못하옵니다요.`;
    }
    return "소인 아뢰오되, 무엇인지는 소인이 알지 못하옵니다요.";
  }

  return null;
}

// ----------------------------
// “평가/감상” 질문 처리 (잘생겼어? 예뻐? 멋있어? 괜찮아?)
// → 여기서 잡아주면 "잘생겼어는..." 같은 비문이 사라짐
// ----------------------------
const JUDGE_RE = /(잘생겼|예쁘|멋있|귀엽|괜찮|좋|나쁘|맛있|재밌|별로)/i;

function parseJudgementQuestion(q){
  const s = cleanPhrase(q);

  // "차은우는 잘생겼어" / "차은우 잘생겼어"
  let m = s.match(/^(.+?)(?:\s*(은|는|이|가))?\s*([가-힣A-Za-z0-9]+)\s*$/u);
  if (m){
    const left = cleanPhrase(m[1]);
    const pred = cleanPhrase(m[3]);
    if (JUDGE_RE.test(pred)){
      // left가 너무 길면 첫 토큰만(안정)
      const subject = stripJosaSuffix(left.split(' ')[0] || left);
      if (subject && !STOP_QWORDS.has(subject)) return { subject, pred };
    }
  }

  // "차은우는 잘생겼어?"처럼 중간에 동사구가 붙는 경우
  m = s.match(/^(.+?)(?:\s*(은|는|이|가))?\s*(잘생겼|예쁘|멋있|귀엽|괜찮|좋|나쁘|맛있|재밌|별로)/i);
  if (m){
    const subject = stripJosaSuffix(m[1]);
    const pred = m[2] ? m[3] : m[3];
    if (subject && !STOP_QWORDS.has(subject)) return { subject, pred: m[3] };
  }

  return null;
}

function answerByJudgement(q){
  const parsed = parseJudgementQuestion(q);
  if (!parsed) return null;

  const { subject, pred } = parsed;
  const EN = josa(subject, "은", "는");

  // 조선톤 + “그럴듯한” 한 줄 (너무 단정/사실 주장 피하고, ‘평’ 형태)
  const variants = [
    `소인 아뢰오되, ${subject}${EN} ${pred}다 평하는 이가 많사옵니다요.`,
    `소인 아뢰오되, ${subject}${EN} ${pred}다 하는 말이 잦사옵니다요.`,
    `소인 아뢰오되, ${subject}${EN} 보는 눈마다 다르나, ${pred}다 하는 편이 많사옵니다요.`
  ];
  return pickOne(variants);
}

// ----------------------------
// 생성형 폴백(룰 미매칭 시) 개선
// - 동사/형용사 토큰을 키워드에서 제외해서 "잘생겼어는..." 방지
// ----------------------------
function isPredicateLikeToken(t){
  // 형용사/동사 느낌 강한 토큰은 폴백 키워드로 쓰지 않음
  return /(하겠|하자|해야|해줘|해요|했다|했어|한다|하는|돼|되|있|없|맞|아니|좋|나쁘|잘생겼|예쁘|멋있|귀엽|괜찮|맛있|재밌|별로)/i.test(t);
}

function extractKeywords(q){
  const raw = (String(q).match(/[가-힣A-Za-z0-9]+/g) || []).map(s => s.trim()).filter(Boolean);
  const stop = new Set([
    "뭐","무엇","왜","어떻게","어떤","가능","되나","돼","되요","해","해줘","해주세요","해야",
    "추천","방법","하는법","해결","이유","원인","때문","까닭",
    "언제","어디","누구","얼마","몇","정도","좀","그냥","진짜",
    "너","나","우리","전하","소인","죄인"
  ]);

  const scored = raw.map((tok, idx) => {
    let t = stripJosaSuffix(tok);

    if (!t || t.length < 2) return null;
    if (stop.has(t.toLowerCase())) return null;
    if (STOP_QWORDS.has(t)) return null;
    if (isPredicateLikeToken(t)) return null;

    let score = t.length;
    if (/(대학교|대학)$/.test(t) || /대$/.test(t)) score += 2;
    return { t, idx, score };
  }).filter(Boolean);

  scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

  const out = [];
  const seen = new Set();
  for (const it of scored) {
    if (seen.has(it.t)) continue;
    seen.add(it.t);
    out.push(it.t);
    if (out.length >= 2) break;
  }
  return out;
}

function hallucinatedFallback(question){
  const q = cleanPhrase(question);
  const [k1, k2] = extractKeywords(q);
  const key = k1 || "그 일";
  const key2 = k2 || "";

  const EUN = josa(key, "은", "는");
  const GWA = josa(key, "과", "와");

  const isCompare = (/(차이|비교|vs|중에|둘 중|더)/i.test(q) && !!key2);
  const isShould  = /(할까|해야|괜찮|가능|추천|골라|선택)/.test(q);

  const prefixes = [
    "소인 아뢰오되,",
    "으윽…",
    "듣자 하니,",
    "짐작컨대,"
  ];

  let s = "";
  if (isCompare) {
    s = `${key}${GWA} ${key2} 중에서는, 대개 ${key} 쪽이 더 무난하옵니다요.`;
  } else if (isShould) {
    s = `${key}${EUN} 지금은 그리 하심이 무난하옵니다요.`;
  } else {
    // ✅ 기존 "그렇게 굴러가옵니다요" 제거 → 자연스러운 정보부족형
    s = `${key}${EUN} 단서가 부족하여 단정하기 어렵사옵니다요.`;
  }

  return oneLine(`${pickOne(prefixes)} ${s}`);
}

// ----------------------------
// 최종: geegleAnswer
// ----------------------------
function geegleAnswer(rawQuestion){
  const raw = normalizeQ(rawQuestion);
  if (!raw) return pickOne(noQuestionAnswers);

  // 1) 산수
  const mathLine = trySimpleMath(raw);
  if (mathLine) return oneLine(mathLine);

  // 2) 평가/감상(잘생겼어? 등) — "잘생겼어는..." 방지 핵심
  const judgeLine = answerByJudgement(raw);
  if (judgeLine) return oneLine(judgeLine);

  // 3) 6W
  const sixWLine = answerBySixW(raw);
  if (sixWLine) return oneLine(sixWLine);

  // 4) 룰 매칭
  const low = lowerQ(raw);
  for (const rule of A_RULES){
    if (rule.re.test(raw) || rule.re.test(low)){
      const picked = pickOne(rule.replies);

      if (picked === "__TIME__") return oneLine(getTimeLine());
      if (picked === "__DATE__") return oneLine(getDateLine());
      if (picked === "__DOW__")  return oneLine(getDowLine());

      return oneLine(picked);
    }
  }

  // 5) 최후 폴백
  return hallucinatedFallback(raw);
}



  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
