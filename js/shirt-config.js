/* ══════════════════════════════════════════════════════════════════
   GFA SUPPORTER SHIRT — CONFIGURATION
   ──────────────────────────────────────────────────────────────────
   This is the ONLY file you need to edit to change the price,
   the shipping rate, or which sizes are available.

   It is loaded by BOTH the shirt section on index.html AND the
   checkout page (gfa-payment-form.html), so the two can never
   disagree about the price.

   After editing, commit and push — GitHub Pages does the rest.
   ══════════════════════════════════════════════════════════════════ */

window.GFA_SHIRT = {

  /* ── NAME & COPY ──────────────────────────────────────────────
     What the shirt is called on the page, and the paragraph that
     sits under the price. Change these freely; nothing else in the
     site depends on the wording. */
  name:  'GFA Supporter Shirt',
  blurb: 'Wear it around town and show your support for the crew. Proceeds from every shirt support GFA programs, firefighter training, equipment, and community initiatives.',

  /* ── PRICE ────────────────────────────────────────────────────
     Price per shirt, in dollars. All-in — no tax or fee added. */
  price: 20.00,

  /* ── FULFILLMENT ──────────────────────────────────────────────
     pickupEnabled   — offer free local pickup
     shippingEnabled — offer mail delivery for shippingFlatRate
     shippingFlatRate — charged ONCE per order, not per shirt.
     To turn shipping off entirely, set shippingEnabled to false;
     the choice disappears and every order becomes a pickup. */
  pickupEnabled:    true,
  shippingEnabled:  true,
  shippingFlatRate: 6.00,

  /* Shown to the buyer on the confirmation screen after they pay. */
  pickupNote: 'We will email you within a couple of days to arrange pickup in Gaylord.',
  shipNote:   'We will get your shirt in the mail within about a week.',

  /* ── INVENTORY ────────────────────────────────────────────────
     trackInventory: false  →  every size below is selectable and the
                               "stock" numbers are ignored. This is the
                               safe default while you count the boxes.

     trackInventory: true   →  a size with stock 0 shows as "Sold out"
                               and cannot be selected, and a buyer can
                               never add more of a size than you have.

     NOTE: these counts do NOT decrease on their own. The site is a
     static page with no database, so nothing can write back to this
     file. Treat it as a switch you flip by hand — lower the number
     (or set it to 0) as stock runs down. */
  trackInventory: false,

  sizes: [
    { size: 'S',   stock: 0 },
    { size: 'M',   stock: 0 },
    { size: 'L',   stock: 0 },
    { size: 'XL',  stock: 0 },
    { size: '2XL', stock: 0 },
    { size: '3XL', stock: 0 }
  ],

  /* Most shirts anyone can buy in one order. */
  maxPerOrder: 10,

  /* ── PHOTOS ───────────────────────────────────────────────────
     'main' is the large image on the shop. If the file is not there
     yet the page shows a tidy placeholder instead of a broken image,
     so nothing looks wrong before you add it. */
  photos: {
    main: {
      src: 'images/shirt.jpg',
      alt: "Charcoal Gaylord Firefighters' Association shirt, showing the full back print and the left-breast fire department cross"
    }

    /* Optional second photo. Uncomment it, drop the file in images/,
       and a thumbnail strip appears under the main image by itself. */
    // , seconds: { src: 'images/shirt-2.jpg', alt: 'Another view of the shirt' }
  }

};
