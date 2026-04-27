/* Email links */
  (function() {
    const u = 'info', d = 'gaylordfire.org', addr = u+'@'+d;
    ['contact-email-link','footer-email-link'].forEach(function(id){
      var el = document.getElementById(id);
      if(el){ el.href='mailto:'+addr; el.textContent=addr; }
    });
  })();

function toggleMenu() {
    const menu = document.getElementById('nav-links');
    const btn = document.getElementById('hamburger');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  }
  function closeMenu() {
    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
    document.body.style.overflow = '';
  }

// Lazy-load hero slides 2-4 before they appear in the animation cycle
(function () {
  var slides = document.querySelectorAll('.hero-slide[data-bg]');
  var delays = [8000, 21000, 34000];
  slides.forEach(function (slide, i) {
    setTimeout(function () {
      slide.style.backgroundImage = slide.getAttribute('data-bg');
    }, delays[i] || 8000);
  });
})();

// Hero slideshow is handled entirely by CSS keyframe animations

  // Flyer carousel
  (function () {
    const flyerSlides = Array.from(document.querySelectorAll('.flyer-slide'));
    const flyerDots   = Array.from(document.querySelectorAll('.flyer-dot'));
    let currentFlyer  = 0;
    let autoTimer     = null;

    function goToFlyer(n) {
      const total = flyerSlides.length;
      const next  = ((n % total) + total) % total; // wrap around
      // Hide current
      flyerSlides[currentFlyer].style.opacity = '0';
      flyerSlides[currentFlyer].style.pointerEvents = 'none';
      if (flyerDots[currentFlyer]) flyerDots[currentFlyer].style.background = 'rgba(255,255,255,0.15)';
      // Show next
      flyerSlides[next].style.opacity = '1';
      flyerSlides[next].style.pointerEvents = 'auto';
      if (flyerDots[next]) flyerDots[next].style.background = 'var(--red)';
      currentFlyer = next;
    }

    window.nextFlyer = function () {
      clearInterval(autoTimer);
      goToFlyer(currentFlyer + 1);
      startAuto();
    };
    window.prevFlyer = function () {
      clearInterval(autoTimer);
      goToFlyer(currentFlyer - 1);
      startAuto();
    };
    window.goToFlyer = function (n) {
      clearInterval(autoTimer);
      goToFlyer(n);
      startAuto();
    };

    function startAuto() {
      autoTimer = setInterval(() => goToFlyer(currentFlyer + 1), 6000);
    }

    // Only auto-advance if there's more than one slide
    if (flyerSlides.length > 1) startAuto();

    // Hide dot controls if only one slide
    const dotWrap = document.getElementById('flyer-dots');
    const prevBtn = document.getElementById('flyer-prev');
    const nextBtn = document.getElementById('flyer-next');
    if (flyerSlides.length <= 1) {
      if (dotWrap) dotWrap.style.display = 'none';
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  })();

  // Pancake flyer image loader with filename fallbacks
  (function () {
    const pancakeImg = document.getElementById('flyer-pancake-image');
    const fallback   = document.getElementById('flyer-pancake-fallback');
    if (!pancakeImg) return;

    const candidates = [
      'images/Pancake Breakfast Flyer.webp',
      'images/Pancake Breakfast Flyer.png',
      'images/Pancake Breakfast Flyer.jpg',
      'images/pancake-breakfast-flyer.webp',
      'images/pancake-breakfast-flyer.png',
      'images/pancake-breakfast-flyer.jpg',
    ];

    function tryImage(index) {
      if (index >= candidates.length) return;
      const probe = new Image();
      probe.onload = function () {
        pancakeImg.src = candidates[index];
        pancakeImg.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      };
      probe.onerror = function () {
        tryImage(index + 1);
      };
      probe.src = candidates[index];
    }

    tryImage(0);
  })();

  function selectTier(el) {
    document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  }

  // ── CONTACT FORM ──────────────────────────────────────────────
  (function () {
    const fields = {
      name:    { el: null, msg: null, validate: v => v.trim().length >= 2 ? null : 'Please enter your name.' },
      email:   { el: null, msg: null, validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address.' },
      subject: { el: null, msg: null, validate: v => v.trim().length >= 3 ? null : 'Please add a subject.' },
      message: { el: null, msg: null, validate: v => v.trim().length >= 20 ? null : `At least 20 characters needed (${v.trim().length} so far).` },
    };
    const submitBtn  = document.getElementById('cf-submit');
    const formWrap   = document.getElementById('contact-form-wrap');
    const successBox = document.getElementById('form-success');

    // Wire up field references
    fields.name.el    = document.getElementById('cf-name');
    fields.name.msg   = document.getElementById('cf-name-msg');
    fields.email.el   = document.getElementById('cf-email');
    fields.email.msg  = document.getElementById('cf-email-msg');
    fields.subject.el = document.getElementById('cf-subject');
    fields.subject.msg= document.getElementById('cf-subject-msg');
    fields.message.el = document.getElementById('cf-message');
    fields.message.msg= document.getElementById('cf-message-msg');

    function setFieldState(key, error) {
      const { el, msg } = fields[key];
      if (error) {
        el.classList.add('field-error'); el.classList.remove('field-ok');
        msg.textContent = error; msg.className = 'field-msg error';
      } else {
        el.classList.remove('field-error'); el.classList.add('field-ok');
        msg.textContent = ''; msg.className = 'field-msg hint';
      }
    }

    // Live message counter
    fields.message.el.addEventListener('input', () => {
      const len = fields.message.el.value.trim().length;
      const err = fields.message.validate(fields.message.el.value);
      if (err) {
        fields.message.el.classList.remove('field-ok');
        fields.message.msg.textContent = `${len} / 20 characters minimum`;
        fields.message.msg.className = len > 0 ? 'field-msg error' : 'field-msg hint';
      } else {
        fields.message.el.classList.remove('field-error'); fields.message.el.classList.add('field-ok');
        fields.message.msg.textContent = '✓ Looks good';
        fields.message.msg.className = 'field-msg hint';
      }
    });

    // Validate on blur (after user leaves a field)
    Object.keys(fields).forEach(key => {
      fields[key].el.addEventListener('blur', () => {
        const err = fields[key].validate(fields[key].el.value);
        setFieldState(key, err);
      });
    });

    submitBtn.addEventListener('click', () => {
      // Validate all fields
      let valid = true;
      Object.keys(fields).forEach(key => {
        const err = fields[key].validate(fields[key].el.value);
        setFieldState(key, err);
        if (err) valid = false;
      });
      if (!valid) {
        // Shake the first errored field
        const firstErr = Object.values(fields).find(f => f.el.classList.contains('field-error'));
        if (firstErr) { firstErr.el.focus(); }
        return;
      }

      // Simulate sending (swap button for spinner)
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending…';

      // ── EmailJS integration ──
      const templateParams = {
        name:    fields.name.el.value.trim(),
        email:   fields.email.el.value.trim(),
        message: `Subject: ${fields.subject.el.value.trim()}\n\n${fields.message.el.value.trim()}`,
      };
      emailjs.send('service_rkdd1ic', 'template_k5u2iy4', templateParams)
        .then(() => {
          showSuccess();
        })
        .catch((err) => {
          console.error('EmailJS error:', err);
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Message →';
          const errBox = document.getElementById('cf-send-error');
          if (errBox) { errBox.style.display = 'block'; }
        });
    });

    function showSuccess() {
      formWrap.style.display = 'none';
      successBox.classList.add('visible');
    }

    emailjs.init({ publicKey: 'lMnYifikFQ3nVFJDg' });

  window.resetContactForm = function () {
      Object.keys(fields).forEach(key => {
        fields[key].el.value = '';
        fields[key].el.classList.remove('field-error', 'field-ok');
        fields[key].msg.textContent = key === 'message' ? '0 / 20 characters minimum' : '';
        fields[key].msg.className = 'field-msg hint';
      });
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message →';
      formWrap.style.display = 'flex';
      successBox.classList.remove('visible');
    };
  })();

function toggleMenu() {
    const menu = document.getElementById('nav-links');
    const btn = document.getElementById('hamburger');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  }
  function closeMenu() {
    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
    document.body.style.overflow = '';
  }

const donateOuter = document.querySelector('.donate-card-outer');
  const donateCard  = document.querySelector('.donate-card');
  const SPIN_DURATION = 4500;
  const SPOT_ANGLE_DEG = (88.5 / 100) * 360;
  let running = false;
  let startTime = null;
  let sparkleTimeout = null;

  function getSpotBorderPos() {
    const elapsed = performance.now() - startTime;
    const angleDeg = ((elapsed % SPIN_DURATION) / SPIN_DURATION * 360 + SPOT_ANGLE_DEG) % 360;
    const w = donateCard.offsetWidth;
    const h = donateCard.offsetHeight;
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const tRight  = cos > 0 ? (w/2)/cos : Infinity;
    const tLeft   = cos < 0 ? (-w/2)/cos : Infinity;
    const tBottom = sin > 0 ? (h/2)/sin : Infinity;
    const tTop    = sin < 0 ? (-h/2)/sin : Infinity;
    const t = Math.min(tRight, tLeft, tBottom, tTop);
    return { x: w/2 + cos*t, y: h/2 + sin*t };
  }

  function createSparkle() {
    if (!running) return;
    const pos = getSpotBorderPos();
    const tier = Math.random();
    const size = tier < 0.5  ? Math.random() * 10 + 18 :
                 tier < 0.8  ? Math.random() * 16 + 32 :
                               Math.random() * 24 + 56;
    const colors = ['#ffffff', '#f0f0f0', '#d8d8d8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = 1400;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute; width:${size}px; height:${size}px; pointer-events:none; z-index:100; animation:sparklePulse ${duration}ms ease-in-out forwards; transform-origin:center; left:${pos.x}px; top:${pos.y}px; margin-left:-${size/2}px; margin-top:-${size/2}px;`;
    el.innerHTML = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="24" rx="2" ry="22" fill="${color}" opacity="0.95"/>
      <ellipse cx="24" cy="24" rx="22" ry="2" fill="${color}" opacity="0.95"/>
      <ellipse cx="24" cy="24" rx="1.2" ry="11" fill="${color}" opacity="0.45" transform="rotate(45 24 24)"/>
      <ellipse cx="24" cy="24" rx="1.2" ry="11" fill="${color}" opacity="0.45" transform="rotate(-45 24 24)"/>
      <circle cx="24" cy="24" r="3" fill="white" opacity="1"/>
    </svg>`;
    donateOuter.appendChild(el);
    setTimeout(() => el.remove(), duration);
    sparkleTimeout = setTimeout(createSparkle, Math.random() * 1200 + 800);
  }

  if (donateOuter) {
    donateOuter.addEventListener('mouseenter', () => {
      running = true;
      startTime = performance.now();
      clearTimeout(sparkleTimeout);
      createSparkle();
    });
    donateOuter.addEventListener('mouseleave', () => {
      running = false;
      clearTimeout(sparkleTimeout);
    });
    donateOuter.addEventListener('touchstart', () => {
      running = true;
      startTime = performance.now();
      clearTimeout(sparkleTimeout);
      createSparkle();
    }, { passive: true });
    donateOuter.addEventListener('touchend', () => {
      running = false;
      clearTimeout(sparkleTimeout);
    }, { passive: true });
  }
