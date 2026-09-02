/* ══════════════════════════════════════════════════════════════════
   GFA SUPPORTER SHIRT — SHOP LOGIC
   ──────────────────────────────────────────────────────────────────
   Loaded by BOTH index.html (draws the shop section) and
   gfa-payment-form.html (reads the order back off the URL).

   You should not need to edit this file. Price, sizes, shipping
   and photos all live in js/shirt-config.js.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cfg = window.GFA_SHIRT;
  if (!cfg) return;

  /* ── Money ────────────────────────────────────────────────────
     All arithmetic is done in whole cents. Dollars are floats and
     0.1 + 0.2 is famously not 0.3, so prices only become dollars
     again at the moment they are printed or handed to PayPal. */
  function toCents(dollars) { return Math.round(Number(dollars) * 100); }
  function money(c)         { return '$' + (c / 100).toFixed(2); }
  function dollars(c)       { return (c / 100).toFixed(2); }

  var PRICE_C = toCents(cfg.price);
  var SHIP_C  = toCents(cfg.shippingFlatRate);
  var MAX     = Math.max(1, cfg.maxPerOrder || 10);

  /* ── Inventory ───────────────────────────────────────────────── */
  function sizes() { return cfg.sizes || []; }

  function row(size) {
    return sizes().filter(function (r) { return r.size === size; })[0] || null;
  }

  function inStock(size) {
    if (!cfg.trackInventory) return true;
    var r = row(size);
    return !!r && r.stock > 0;
  }

  /* Most of this size a single order may contain. */
  function capFor(size) {
    if (!cfg.trackInventory) return MAX;
    var r = row(size);
    return Math.min(r ? r.stock : 0, MAX);
  }

  function anythingInStock() {
    return sizes().some(function (r) { return inStock(r.size); });
  }

  /* ── Fulfillment ─────────────────────────────────────────────── */
  function modes() {
    var m = [];
    if (cfg.pickupEnabled)   m.push('pickup');
    if (cfg.shippingEnabled) m.push('ship');
    if (!m.length) m.push('pickup');   /* never leave a buyer with no way to receive it */
    return m;
  }

  function modeLabel(mode) {
    return mode === 'ship' ? 'Mail it to me' : 'Pick up in Gaylord';
  }

  function modeNote(mode) {
    return mode === 'ship' ? (cfg.shipNote || '') : (cfg.pickupNote || '');
  }

  /* ── Totals ──────────────────────────────────────────────────── */
  function totals(lines, mode) {
    var count = lines.reduce(function (n, l) { return n + l.qty; }, 0);
    var sub   = count * PRICE_C;
    var ship  = (mode === 'ship' && count > 0) ? SHIP_C : 0;
    return { count: count, subtotalC: sub, shippingC: ship, totalC: sub + ship };
  }

  /* ── The order, as it travels in the URL ─────────────────────── */
  function encode(lines, mode) {
    var s = lines.filter(function (l) { return l.qty > 0; })
                 .map(function (l) { return l.size + ':' + l.qty; })
                 .join(',');
    return 'item=shirt&s=' + encodeURIComponent(s) + '&f=' + mode;
  }

  /* Read an order back off the URL. Everything is re-checked against
     the config here: an edited URL can change what sizes and how many,
     but it can never change the price — that is always read fresh
     from shirt-config.js on the checkout page. */
  function decode(search) {
    var p;
    try { p = new URLSearchParams(search || ''); } catch (e) { return null; }
    if (p.get('item') !== 'shirt') return null;

    var mode = p.get('f') === 'ship' ? 'ship' : 'pickup';
    if (modes().indexOf(mode) === -1) mode = modes()[0];

    var lines = [], running = 0;
    (p.get('s') || '').split(',').forEach(function (part) {
      var bits = part.split(':');
      var size = (bits[0] || '').trim();
      var qty  = parseInt(bits[1], 10);
      if (!size || !(qty > 0) || !row(size)) return;
      qty = Math.min(qty, capFor(size), MAX - running);
      if (qty > 0) { lines.push({ size: size, qty: qty }); running += qty; }
    });

    return lines.length ? { lines: lines, mode: mode } : null;
  }

  /* Short human summary, e.g. "2 shirts (M x1, L x1)". PayPal caps
     description and custom_id at 127 characters, so this is trimmed. */
  function summarize(lines) {
    var count = lines.reduce(function (n, l) { return n + l.qty; }, 0);
    var parts = lines.map(function (l) { return l.size + ' x' + l.qty; }).join(', ');
    var text  = count + (count === 1 ? ' shirt (' : ' shirts (') + parts + ')';
    return text.length > 120 ? text.slice(0, 119) + '…' : text;
  }

  window.GFA_SHIRT_LIB = {
    priceC: PRICE_C, shippingC: SHIP_C, maxPerOrder: MAX,
    money: money, dollars: dollars,
    sizes: sizes, inStock: inStock, capFor: capFor, anythingInStock: anythingInStock,
    modes: modes, modeLabel: modeLabel, modeNote: modeNote,
    totals: totals, encode: encode, decode: decode, summarize: summarize
  };

  /* ══════════════════════════════════════════════════════════════
     SHOP SECTION (index.html only)
     Everything below is skipped on any page without #shop.
     ══════════════════════════════════════════════════════════════ */
  var section = document.getElementById('shop');
  if (!section) return;

  var order   = {};                 /* size -> qty */
  var mode    = modes()[0];
  var elSizes = document.getElementById('shop-sizes');
  var elFul   = document.getElementById('shop-fulfillment');
  var elSum   = document.getElementById('shop-summary');
  var elBtn   = document.getElementById('shop-checkout');
  var elPrice = document.getElementById('shop-price');
  var elTitle = document.getElementById('shop-title');
  var elBlurb = document.getElementById('shop-blurb');

  function lines() {
    return sizes()
      .filter(function (r) { return order[r.size] > 0; })
      .map(function (r) { return { size: r.size, qty: order[r.size] }; });
  }

  function orderCount() {
    return Object.keys(order).reduce(function (n, k) { return n + order[k]; }, 0);
  }

  /* ── Copy from the config ── */
  if (elTitle && cfg.name)  elTitle.textContent = cfg.name;
  if (elBlurb && cfg.blurb) elBlurb.textContent = cfg.blurb;
  if (elPrice) elPrice.textContent = money(PRICE_C);

  /* ── Photos ── */
  (function () {
    var stage  = document.getElementById('shop-photo');
    var img    = document.getElementById('shop-photo-img');
    var thumbs = document.getElementById('shop-thumbs');
    if (!stage || !img) return;

    var photos = [];
    ['main', 'seconds'].forEach(function (k) {
      var p = cfg.photos && cfg.photos[k];
      if (p && p.src) photos.push(p);
    });
    if (!photos.length) { stage.classList.add('missing'); return; }

    /* A photo the association has not added yet must not render as a
       broken image icon — fall back to the placeholder instead. */
    img.addEventListener('error', function () { stage.classList.add('missing'); });
    img.addEventListener('load',  function () { stage.classList.remove('missing'); });

    function show(i) {
      img.src = photos[i].src;
      img.alt = photos[i].alt || 'GFA supporter shirt';
      Array.prototype.forEach.call(thumbs ? thumbs.children : [], function (b, n) {
        b.classList.toggle('active', n === i);
      });
    }

    if (thumbs && photos.length > 1) {
      photos.forEach(function (p, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'shop-thumb';
        b.setAttribute('aria-label', p.alt || ('View photo ' + (i + 1)));
        var t = document.createElement('img');
        t.src = p.src; t.alt = '';
        t.addEventListener('error', function () { b.classList.add('missing'); });
        b.appendChild(t);
        b.addEventListener('click', function () { show(i); });
        thumbs.appendChild(b);
      });
    }
    show(0);
  })();

  /* ── Size rows ── */
  function drawSizes() {
    if (!elSizes) return;
    elSizes.innerHTML = '';

    if (!anythingInStock()) {
      var msg = document.createElement('p');
      msg.className = 'shop-soldout';
      msg.textContent = 'Sold out for now. Check back soon, or email us to be told when more arrive.';
      elSizes.appendChild(msg);
      return;
    }

    sizes().forEach(function (r) {
      var open = inStock(r.size);
      var wrap = document.createElement('div');
      wrap.className = 'shop-size-row' + (open ? '' : ' out');

      var label = document.createElement('div');
      label.className = 'shop-size-name';
      label.textContent = r.size;
      wrap.appendChild(label);

      if (!open) {
        var out = document.createElement('div');
        out.className = 'shop-size-out';
        out.textContent = 'Sold out';
        wrap.appendChild(out);
        elSizes.appendChild(wrap);
        return;
      }

      var step = document.createElement('div');
      step.className = 'shop-stepper';

      var minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'shop-step';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'One fewer size ' + r.size);

      var count = document.createElement('span');
      count.className = 'shop-count';

      var plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'shop-step';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'One more size ' + r.size);

      function paint() {
        var q = order[r.size] || 0;
        count.textContent = q;
        wrap.classList.toggle('chosen', q > 0);
        minus.disabled = q === 0;
        /* Stop at this size's own cap, or at the order-wide cap. */
        plus.disabled = q >= capFor(r.size) || orderCount() >= MAX;
      }

      minus.addEventListener('click', function () {
        order[r.size] = Math.max(0, (order[r.size] || 0) - 1);
        update();
      });
      plus.addEventListener('click', function () {
        if (orderCount() >= MAX) return;
        order[r.size] = Math.min(capFor(r.size), (order[r.size] || 0) + 1);
        update();
      });

      step.appendChild(minus); step.appendChild(count); step.appendChild(plus);
      wrap.appendChild(step);
      elSizes.appendChild(wrap);
      wrap._paint = paint;
      paint();
    });
  }

  /* ── Pickup / ship ── */
  function drawFulfillment() {
    if (!elFul) return;
    var available = modes();
    elFul.innerHTML = '';

    if (available.length < 2) {
      /* Only one way to get it — state it, do not ask. */
      var only = document.createElement('p');
      only.className = 'shop-ful-single';
      only.textContent = modeLabel(available[0]) + '. ' + modeNote(available[0]);
      elFul.appendChild(only);
      return;
    }

    var head = document.createElement('div');
    head.className = 'shop-sub-label';
    head.textContent = 'How would you like it?';
    elFul.appendChild(head);

    available.forEach(function (m) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'shop-ful' + (m === mode ? ' active' : '');
      opt.setAttribute('aria-pressed', m === mode ? 'true' : 'false');

      var name = document.createElement('span');
      name.className = 'shop-ful-name';
      name.textContent = modeLabel(m);

      var cost = document.createElement('span');
      cost.className = 'shop-ful-cost';
      cost.textContent = m === 'ship' ? '+' + money(SHIP_C) : 'Free';

      opt.appendChild(name); opt.appendChild(cost);
      opt.addEventListener('click', function () { mode = m; drawFulfillment(); update(); });
      elFul.appendChild(opt);
    });

    var note = document.createElement('p');
    note.className = 'shop-ful-note';
    note.textContent = modeNote(mode);
    elFul.appendChild(note);
  }

  /* ── Running total + button state ── */
  function update() {
    Array.prototype.forEach.call(elSizes ? elSizes.children : [], function (w) {
      if (w._paint) w._paint();
    });

    var picked = lines();
    var t = totals(picked, mode);

    if (elSum) {
      if (!t.count) {
        elSum.innerHTML = '';
        elSum.classList.remove('visible');
      } else {
        var rows = picked.map(function (l) {
          return '<div><span>' + l.size + ' × ' + l.qty + '</span><span>' +
                 money(l.qty * PRICE_C) + '</span></div>';
        }).join('');
        if (t.shippingC) {
          rows += '<div><span>Shipping</span><span>' + money(t.shippingC) + '</span></div>';
        }
        elSum.innerHTML = rows +
          '<div class="shop-total"><span>Total</span><span>' + money(t.totalC) + '</span></div>';
        elSum.classList.add('visible');
      }
    }

    if (elBtn) {
      elBtn.disabled = !t.count;
      elBtn.textContent = t.count
        ? 'Checkout · ' + money(t.totalC) + ' →'
        : 'Choose a size to continue';
    }

    /* The order-wide cap needs saying out loud, or the + buttons
       just go dead with no explanation. */
    var cap = elSizes ? elSizes.querySelector('.shop-cap') : null;
    if (elSizes && orderCount() >= MAX) {
      if (!cap) {
        cap = document.createElement('p');
        cap.className = 'shop-cap';
        cap.textContent = 'That is ' + MAX + ' shirts, the most in one order. Email us for a bigger order.';
        elSizes.appendChild(cap);
      }
    } else if (cap) {
      cap.remove();
    }
  }

  if (elBtn) {
    elBtn.addEventListener('click', function () {
      var picked = lines();
      if (!picked.length) return;
      window.location.href = 'gfa-payment-form.html?' + encode(picked, mode);
    });
  }

  drawSizes();
  drawFulfillment();
  update();
})();
