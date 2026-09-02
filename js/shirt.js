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

  /* Spoken-aloud size names for the dropdown. A size in the config
     that is not listed here just shows its own code. */
  var LONG = {
    S: 'Small', M: 'Medium', L: 'Large',
    XL: 'X-Large', '2XL': '2X-Large', '3XL': '3X-Large'
  };

  var order    = {};                /* size -> qty already in the order */
  var mode     = modes()[0];
  var pendSize = null;              /* what the dropdown is showing */
  var pendQty  = 1;                 /* what the stepper is showing */

  var elSizes  = document.getElementById('shop-sizes');
  var elPicked = document.getElementById('shop-picked');
  var elFul    = document.getElementById('shop-fulfillment');
  var elSum    = document.getElementById('shop-summary');
  var elBtn    = document.getElementById('shop-checkout');
  var elPrice  = document.getElementById('shop-price');
  var elTitle  = document.getElementById('shop-title');
  var elBlurb  = document.getElementById('shop-blurb');

  function lines() {
    return sizes()
      .filter(function (r) { return order[r.size] > 0; })
      .map(function (r) { return { size: r.size, qty: order[r.size] }; });
  }

  function orderCount() {
    return Object.keys(order).reduce(function (n, k) { return n + order[k]; }, 0);
  }

  /* How many more of this size the order can still take. */
  function roomFor(size) {
    if (!size) return 0;
    return Math.max(0, Math.min(capFor(size) - (order[size] || 0), MAX - orderCount()));
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

  /* ── The picker: one dropdown, a quantity, and Add ────────────── */
  var sel, qtyMinus, qtyPlus, qtyCount, addBtn, capNote;

  function buildPicker() {
    if (!elSizes) return;
    elSizes.innerHTML = '';

    if (!anythingInStock()) {
      var msg = document.createElement('p');
      msg.className = 'shop-soldout';
      msg.textContent = 'Sold out for now. Check back soon, or email us to be told when more arrive.';
      elSizes.appendChild(msg);
      return;
    }

    var picker = document.createElement('div');
    picker.className = 'shop-picker';

    /* Size dropdown */
    sel = document.createElement('select');
    sel.className = 'shop-select';
    sel.setAttribute('aria-label', 'Shirt size');
    sizes().forEach(function (r) {
      var o = document.createElement('option');
      var name = LONG[r.size] || r.size;
      o.value = r.size;
      o.textContent = inStock(r.size) ? name : name + ' — sold out';
      o.disabled = !inStock(r.size);
      sel.appendChild(o);
    });
    /* Open on the first size that can actually be bought. */
    pendSize = (sizes().filter(function (r) { return inStock(r.size); })[0] || {}).size || null;
    sel.value = pendSize;
    sel.addEventListener('change', function () {
      pendSize = sel.value;
      pendQty  = 1;
      paintPicker();
    });
    picker.appendChild(sel);

    /* Quantity + Add */
    var right = document.createElement('div');
    right.className = 'shop-addrow';

    var stepper = document.createElement('div');
    stepper.className = 'shop-stepper';

    qtyMinus = document.createElement('button');
    qtyMinus.type = 'button';
    qtyMinus.className = 'shop-step';
    qtyMinus.textContent = '−';
    qtyMinus.setAttribute('aria-label', 'One fewer');
    qtyMinus.addEventListener('click', function () {
      pendQty = Math.max(1, pendQty - 1);
      paintPicker();
    });

    qtyCount = document.createElement('span');
    qtyCount.className = 'shop-count';

    qtyPlus = document.createElement('button');
    qtyPlus.type = 'button';
    qtyPlus.className = 'shop-step';
    qtyPlus.textContent = '+';
    qtyPlus.setAttribute('aria-label', 'One more');
    qtyPlus.addEventListener('click', function () {
      pendQty = Math.min(roomFor(pendSize) || 1, pendQty + 1);
      paintPicker();
    });

    stepper.appendChild(qtyMinus);
    stepper.appendChild(qtyCount);
    stepper.appendChild(qtyPlus);

    addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'shop-add';
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', function () {
      if (!pendSize || roomFor(pendSize) < 1) return;
      order[pendSize] = (order[pendSize] || 0) + Math.min(pendQty, roomFor(pendSize));
      pendQty = 1;
      update();
    });

    right.appendChild(stepper);
    right.appendChild(addBtn);
    picker.appendChild(right);
    elSizes.appendChild(picker);

    capNote = document.createElement('p');
    capNote.className = 'shop-cap';
    elSizes.appendChild(capNote);

    paintPicker();
  }

  /* Keep the stepper and Add button honest about what is left. */
  function paintPicker() {
    if (!sel) return;
    var room = roomFor(pendSize);

    if (pendQty > room) pendQty = Math.max(1, room);
    qtyCount.textContent = pendQty;
    qtyMinus.disabled = pendQty <= 1;
    qtyPlus.disabled  = pendQty >= room;
    addBtn.disabled   = room < 1;

    /* Say why Add is dead, rather than leaving a grey button. */
    var full = orderCount() >= MAX;
    addBtn.textContent = room < 1 && !full ? 'None left' : 'Add';
    capNote.textContent = full
      ? 'That is ' + MAX + ' shirts, the most in one order. Email us for a bigger order.'
      : '';
    capNote.style.display = full ? 'block' : 'none';
  }

  /* ── What is already in the order, as removable chips ─────────── */
  function drawPicked() {
    if (!elPicked) return;
    elPicked.innerHTML = '';
    var picked = lines();
    elPicked.classList.toggle('visible', picked.length > 0);

    picked.forEach(function (l) {
      var chip = document.createElement('span');
      chip.className = 'shop-chip';

      var text = document.createElement('span');
      text.textContent = (LONG[l.size] || l.size) + ' × ' + l.qty;
      chip.appendChild(text);

      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'shop-chip-x';
      x.innerHTML = '&times;';
      x.setAttribute('aria-label', 'Remove ' + (LONG[l.size] || l.size));
      x.addEventListener('click', function () {
        delete order[l.size];
        update();
      });
      chip.appendChild(x);

      elPicked.appendChild(chip);
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
    paintPicker();
    drawPicked();

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
  }

  if (elBtn) {
    elBtn.addEventListener('click', function () {
      var picked = lines();
      if (!picked.length) return;
      window.location.href = 'gfa-payment-form.html?' + encode(picked, mode);
    });
  }

  buildPicker();
  drawFulfillment();
  update();
})();
