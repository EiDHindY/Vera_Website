/* =====================================================
   VERA PET CARE — CORE JAVASCRIPT
   Market system, price rendering, WhatsApp builder,
   navigation behavior, analytics events
   ===================================================== */

'use strict';

// ---------------------------------------------------------
// DEV UTILS: Block Analytics (Meta Pixel & GA4) on localhost
// ---------------------------------------------------------
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
  console.log('🚧 Dev Mode: Analytics tracking is disabled on localhost.');
  window.fbq = function () { console.log('Blocked fbq:', arguments); };
  window.gtag = function () { console.log('Blocked gtag:', arguments); };
}

/* =====================================================
   BRAND CONFIGURATION
   All prices are HARDCODED — never convert currencies
   ===================================================== */
const VERA_CONFIG = {
  markets: {
    egypt: {
      name_ar: 'مصر',
      name_en: 'Egypt',
      flag: '🇪🇬',
      currency_ar: 'جنيه',
      currency_en: 'EGP',
      whatsapp: '201288649908',
      delivery_ar: 'التوصيل: جميع محافظات مصر',
      delivery_en: 'Delivery: All over Egypt (nationwide)',
      payment_ar: 'الدفع: كاش عند الاستلام | فوري | بطاقة',
      payment_en: 'Payment: Cash on Delivery | Fawry | Card',
      payments: ['Cash on Delivery', 'Fawry', 'Card'],
    },
    uae: {
      name_ar: 'الإمارات',
      name_en: 'UAE',
      flag: '🇦🇪',
      currency_ar: 'درهم',
      currency_en: 'AED',
      whatsapp: '971551884387',
      delivery_ar: '',
      delivery_en: '',
      payment_ar: 'الدفع: تابي | تمارا | بطاقة',
      payment_en: 'Payment: Tabby | Tamara | Card',
      payments: ['Tabby', 'Tamara', 'Card'],
    }
  },
  products: {
    spray: {
      slug_ar: 'spray',
      slug_en: 'spray',
      name_ar: 'سبراي كونتاكت كيلر',
      name_en: 'Contact Killer Spray',
      prices: { egypt: 240, uae: 60 }
    },
    spray70: {
      slug_ar: 'spray',
      slug_en: 'spray',
      name_ar: 'سبراي كونتاكت كيلر 60مل',
      name_en: 'Contact Killer Spray 60ml',
      prices: { egypt: 150, uae: 30 }
    },
    spray35: {
      slug_ar: 'spray',
      slug_en: 'spray',
      name_ar: 'سبراي كونتاكت كيلر 35مل',
      name_en: 'Contact Killer Spray 35ml',
      prices: { egypt: 75, uae: 15 }
    },
    shampoo: {
      slug_ar: 'shampoo',
      slug_en: 'shampoo',
      name_ar: 'الشامبو',
      name_en: 'VERA Shampoo',
      prices: { egypt: 220, uae: 50 }
    },
    shampoo125: {
      slug_ar: 'shampoo',
      slug_en: 'shampoo',
      name_ar: 'الشامبو الطبي 120مل',
      name_en: 'Clinical Shampoo 120ml',
      prices: { egypt: 180, uae: 38 }
    },
    deo: {
      slug_ar: 'deo',
      slug_en: 'deo',
      name_ar: 'بخاخ التعطير المخملي',
      name_en: 'Velvet Deodorizing Mist',
      prices: { egypt: 185, uae: 45 }
    },
    deo20: {
      slug_ar: 'deo',
      slug_en: 'deo',
      name_ar: 'بخاخ التعطير المخملي 20مل',
      name_en: 'Velvet Deodorizing Mist 20ml',
      prices: { egypt: 50, uae: 15 }
    },
    tick_powder: {
      slug_ar: 'tick_powder',
      slug_en: 'tick_powder',
      name_ar: 'بودرة القراد والبراغيث',
      name_en: 'Tick & Flea Powder',
      prices: { egypt: 150, uae: 35 }
    },
    powder: {
      slug_ar: 'powder',
      slug_en: 'powder',
      name_ar: 'بودرة تنظيف جاف',
      name_en: 'Dry Shampoo Powder',
      prices: { egypt: 120, uae: 30 }
    },
    bundle: {
      name_ar: 'باقة الحماية الكاملة',
      name_en: 'Complete Protection Bundle',
      prices: { egypt: 570, uae: 133 },
      savings: { egypt: 0, uae: 0 }
    }
  }
};

/* =====================================================
   MARKET & LANGUAGE STATE
   ===================================================== */
const STORAGE_MARKET = 'vera_market';
const STORAGE_LANG = 'vera_lang';
const STORAGE_UTM = 'vera_utm';

/* =====================================================
   UTM CAPTURE
   Persist campaign params from the landing URL so the
   WhatsApp handoff carries attribution (Expert 24)
   ===================================================== */
function captureUTMParams() {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utm = {};
  let found = false;

  keys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
      found = true;
    }
  });

  if (found) {
    localStorage.setItem(STORAGE_UTM, JSON.stringify(utm));
  }
}

function captureFBCLID() {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (fbclid) {
    // Check if _fbc cookie already exists
    const match = document.cookie.match(/(^| )_fbc=([^;]+)/);
    if (!match) {
      // Create _fbc cookie. Format: fb.subdomainIndex.creationTime.fbclid
      // subdomainIndex is usually 1 for root domain.
      const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString(); // 90 days
      document.cookie = `_fbc=${fbcValue}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }
}

function getUTMParams() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_UTM)) || {};
  } catch (e) {
    return {};
  }
}

function getMarket() {
  return localStorage.getItem(STORAGE_MARKET) || 'egypt';
}

/*  Toast Notification Helper
    ===================================================== */
function showVeraToast(message, type = 'error') {
  const isAr = document.documentElement.lang === 'ar';
  const bg = type === 'error' ? '#e74c3c' : (type === 'success' ? '#25D366' : '#c5a880');
  
  const toast = document.createElement('div');
  toast.innerHTML = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bg};
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    font-weight: bold;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    font-family: inherit;
    text-align: center;
    direction: ${isAr ? 'rtl' : 'ltr'};
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.top = '-20px'; }, 2500);
  setTimeout(() => toast.remove(), 3000);
}

function getLang() {
  const htmlLang = document.documentElement.lang;
  if (htmlLang === 'en' || htmlLang === 'ar') {
    return htmlLang;
  }
  return localStorage.getItem(STORAGE_LANG) || 'ar';
}

function setMarket(market) {
  localStorage.setItem(STORAGE_MARKET, market);
}

function setLang(lang) {
  localStorage.setItem(STORAGE_LANG, lang);
}

/* =====================================================
   FACEBOOK CONVERSIONS API (SERVER-SIDE)
   ===================================================== */
async function sendCapiEvent(eventName, userData = null, customData = null) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') return;
  try {
    const url = window.location.href;
    const body = {
      event_name: eventName,
      event_url: url,
      custom_data: customData
    };
    if (userData) {
      body.user_data = userData;
    }

    // Attempt to grab fbp and fbc from cookies if they exist
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');

    if (fbp || fbc) {
      body.user_data = body.user_data || {};
      if (fbp) body.user_data.fbp = fbp;
      if (fbc) body.user_data.fbc = fbc;
    }

    await fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('CAPI Error:', err);
  }
}

/* =====================================================
   WHATSAPP LINK BUILDER
   Never hardcode WhatsApp URLs — always use this function
   ===================================================== */
function buildWhatsAppLink(productKey, market, lang) {
  const m = market || getMarket();
  const l = lang || getLang();
  const number = VERA_CONFIG.markets[m].whatsapp;

  let sizeTextAr = '';
  let sizeTextEn = '';
  const sizeSelector = document.getElementById(productKey + '-size-selector');
  if (sizeSelector) {
    const activeSizeBtn = sizeSelector.querySelector('.size-btn-active');
    if (activeSizeBtn) {
      const size = activeSizeBtn.getAttribute('data-size');
      sizeTextAr = ' - ' + size + 'مل';
      sizeTextEn = ' - ' + size + 'ml';
    }
  }

  const messages = {
    ar: {
      spray: `أرغب في طلب: سبراي كونتاكت كيلر${sizeTextAr}\nالكمية: \nالمدينة: `,
      shampoo: `أرغب في طلب: الشامبو الطبي${sizeTextAr}\nالكمية: \nالمدينة: `,
      deo: 'أرغب في طلب: بخاخ التعطير المخملي\nالكمية: \nالمدينة: ',
      bundle: 'أرغب في طلب: باقة الحماية الكاملة\n(سبراي 125مل + شامبو 120مل + بودرة القراد 70جم)\nالكمية: \nالمدينة: ',
      general: 'أرغب في الاستفسار عن منتجات ڤيرا\n',
    },
    en: {
      spray: `I'd like to order: Contact Killer Spray${sizeTextEn}\nQty: \nCity: `,
      shampoo: `I'd like to order: Clinical Shampoo${sizeTextEn}\nQty: \nCity: `,
      deo: "I'd like to order: Velvet Deodorizing Mist\nQty: \nCity: ",
      bundle: "I'd like to order: Complete Protection Bundle\n(125ml Spray + 120ml Shampoo + 70g Tick Powder)\nQty: \nCity: ",
      general: "I'd like to inquire about VERA products\n",
    }
  };

  let text = messages[l][productKey] || messages[l].general;

  // Append campaign attribution if present (Expert 24: UTM-to-WhatsApp bridge)
  const utm = getUTMParams();
  if (utm.utm_source) {
    const refLabel = l === 'ar' ? '\nمصدر: ' : '\nSource: ';
    text += refLabel + [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ');
  }

  const msg = encodeURIComponent(text);
  return `https://wa.me/${number}?text=${msg}`;
}

/* =====================================================
   PRICE FORMATTING
   Arabic pages: Arabic-Indic numerals via locale
   English pages: plain Western numerals
   ===================================================== */
function formatPrice(amount, market, lang) {
  const m = market || getMarket();
  const l = lang || getLang();
  const cfg = VERA_CONFIG.markets[m];

  if (l === 'ar') {
    return `${amount} ${cfg.currency_ar}`;
  } else {
    return `${cfg.currency_en} ${amount}`;
  }
}

/* =====================================================
   PRICE RENDERER
   Updates all [data-product] elements on the page
   without a page reload. Called on market toggle.
   ===================================================== */
function renderPrices() {
  const market = getMarket();
  const lang = getLang();

  document.querySelectorAll('[data-product]').forEach(el => {
    const productKey = el.dataset.product;

    // Check if there is an active size selector for this product
    const sizeSelector = document.getElementById(productKey + '-size-selector');
    if (sizeSelector) {
      const activeSizeBtn = sizeSelector.querySelector('.size-btn-active');
      if (activeSizeBtn) {
        const price = parseInt(activeSizeBtn.getAttribute('data-price-' + market));
        el.textContent = formatPrice(price, market, lang);
        return;
      }
    }

    const cfg = VERA_CONFIG.products[productKey];
    if (!cfg) return;

    const price = cfg.prices[market];
    if (price === undefined) return;

    el.textContent = formatPrice(price, market, lang);
  });

  // Update bundle savings (shown as percentage)
  document.querySelectorAll('[data-bundle-save]').forEach(el => {
    const save = VERA_CONFIG.products.bundle.savings[market];
    const indivTotal = market === 'egypt' ? (240 + 180 + 150) : (60 + 38 + 35);
    const pct = Math.round((save / indivTotal) * 100);
    if (lang === 'ar') {
      el.textContent = `احصل على الشحن مجاناً مع الباقة`;
    } else {
      el.textContent = `Get free shipping with the bundle`;
    }
  });

  // Update bundle total
  document.querySelectorAll('[data-bundle-individual]').forEach(el => {
    const total = 240 + 180 + 150; // Egypt individual total
    const uaeTotal = 60 + 38 + 35;
    const amount = market === 'egypt' ? total : uaeTotal;
    el.textContent = formatPrice(amount, market, lang);
  });

  // Update crossed-out individual prices
  document.querySelectorAll('[data-product-orig]').forEach(el => {
    const productKey = el.dataset.productOrig;
    const cfg = VERA_CONFIG.products[productKey];
    if (!cfg) return;
    const price = cfg.prices[market];
    if (price === undefined) return;
    el.textContent = formatPrice(price, market, lang);
  });

  // Update WhatsApp links
  updateWhatsAppLinks(market, lang);

  // Update delivery & payment info
  updateMarketInfo(market, lang);

  // Hide WA CTAs for UAE (not primary channel)
  updateWAVisibility(market);
}

function updateWhatsAppLinks(market, lang) {
  document.querySelectorAll('[data-wa-product]').forEach(el => {
    const productKey = el.dataset.waProduct;
    el.href = buildWhatsAppLink(productKey, market, lang);
  });
}

function updateMarketInfo(market, lang) {
  const cfg = VERA_CONFIG.markets[market];

  document.querySelectorAll('[data-delivery]').forEach(el => {
    el.textContent = lang === 'ar' ? cfg.delivery_ar : cfg.delivery_en;
  });

  document.querySelectorAll('[data-payment]').forEach(el => {
    el.textContent = lang === 'ar' ? cfg.payment_ar : cfg.payment_en;
  });

  document.querySelectorAll('[data-payment-badges]').forEach(el => {
    el.innerHTML = cfg.payments.map(p => `<span class="payment-badge">${p}</span>`).join('');
  });
}

function updateWAVisibility(market) {
  // WA CTAs are available in both markets — VERA_CONFIG provides a
  // dedicated WhatsApp number for each market (Egypt + UAE), so
  // ordering via WhatsApp should not be blocked for UAE visitors.
  document.querySelectorAll('.btn-wa, .float-wa, .sticky-cta, .footer-wa-link').forEach(el => {
    el.style.display = '';
  });
  // Market-specific content (data-market-show="uae" or "egypt")
  document.querySelectorAll('[data-market-show]').forEach(el => {
    el.style.display = (el.dataset.marketShow === market) ? '' : 'none';
  });
}

/* =====================================================
   MARKET TOGGLE
   Cycles between egypt ↔ uae without page reload
   ===================================================== */
function toggleMarket() {
  const current = getMarket();
  const next = current === 'egypt' ? 'uae' : 'egypt';
  const lang = getLang();

  // Analytics
  trackEvent('market_switch', { from: current, to: next });

  setMarket(next);
  renderPrices();
  updateMarketToggles(next, lang);
}

function updateMarketToggles(market, lang) {
  const cfg = VERA_CONFIG.markets[market];
  document.querySelectorAll('.market-toggle').forEach(btn => {
    btn.innerHTML = `${cfg.flag} ${lang === 'ar' ? cfg.name_ar : cfg.name_en} &bull; ${cfg.currency_en}`;
  });
}

/* =====================================================
   NAVIGATION — HIDE ON SCROLL DOWN
   ===================================================== */
function initNavScroll() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 100) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastY = y;
  }, { passive: true });
}

/* =====================================================
   FLOATING WHATSAPP BUTTON VISIBILITY
   ===================================================== */
function initFloatWA() {
  const btn = document.querySelector('.float-wa');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 0.6) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
}

/* =====================================================
   HAMBURGER MENU
   ===================================================== */
function initHamburger() {
  const ham = document.querySelector('.nav-hamburger');
  const overlay = document.querySelector('.nav-overlay');
  const close = document.querySelector('.nav-close');

  if (!ham || !overlay) return;

  ham.addEventListener('click', () => {
    if (overlay.classList.contains('open')) {
      closeMenu();
    } else {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      ham.classList.add('active');
    }
  });

  function closeMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    ham.classList.remove('active');
  }

  if (close) close.addEventListener('click', closeMenu);

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
}

/* =====================================================
   ACCORDION (INGREDIENTS + BENEFITS)
   ===================================================== */
function initAccordions() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all others in same group
      const group = trigger.closest('[data-accordion-group]');
      if (group) {
        group.querySelectorAll('.accordion-item.open').forEach(openItem => {
          if (openItem !== item) openItem.classList.remove('open');
        });
      }

      item.classList.toggle('open', !isOpen);
    });
  });
}

/* =====================================================
   FAQ ACCORDION
   ===================================================== */
function initFAQs() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
}

/* =====================================================
   ANALYTICS EVENTS
   GA4 + Meta Pixel event tracking
   ===================================================== */
function generateEventID() {
  return 'evt_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
}

function trackEvent(eventName, params = {}) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') return;
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

function trackWAClick(productName, market) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') return;
  const eventId = generateEventID();
  trackEvent('whatsapp_click', { product: productName, market: market });

  if (typeof fbq === 'function') {
    // Fire InitiateCheckout event for WhatsApp clicks, include eventID for deduplication
    fbq('track', 'InitiateCheckout', { content_name: productName }, { eventID: eventId });
  }
}

function trackPageView(pageName) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') return;
  const eventId = generateEventID();
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', { content_name: pageName }, { eventID: eventId });
  }
}

/* =====================================================
   WHATSAPP CLICK TRACKING
   Attach to all WA links on the page
   ===================================================== */
function initWATracking() {
  document.querySelectorAll('[data-wa-product]').forEach(link => {
    link.addEventListener('click', () => {
      const product = link.dataset.waProduct;
      const market = getMarket();
      trackWAClick(product, market);
    });
  });
}

/* =====================================================
   LANGUAGE SWITCH
   ===================================================== */
function switchLanguage(targetLang, targetPath) {
  trackEvent('language_switch', { to: targetLang });
  setLang(targetLang);

  const root = window.VERA_ROOT || '';
  if (targetPath.startsWith('/')) {
    const cleanPath = targetPath.substring(1);
    const target = (cleanPath === '' || cleanPath.endsWith('/')) ? (cleanPath + 'index.html') : cleanPath;
    window.location.href = root + target;
  } else {
    window.location.href = targetPath;
  }
}

/* =====================================================
   COOKIE CONSENT BANNER
   Informational notice — Egypt/UAE markets.
   Stored in localStorage key 'vera_cookie_consent'.
   ===================================================== */
function initCookieConsent() {
  if (localStorage.getItem('vera_cookie_consent')) return;

  const lang = getLang();
  const isAr = lang === 'ar';
  const root = window.VERA_ROOT || '';
  const privacyPath = isAr ? root + 'ar/privacy/index.html' : root + 'en/privacy/index.html';

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', isAr ? 'إشعار الخصوصية' : 'Privacy notice');

  if (isAr) {
    banner.innerHTML =
      '<p>نستخدم أدوات تحليلية وإعلانية (Google Analytics و Meta Pixel) لتحسين تجربتك. ' +
      '<a href="' + privacyPath + '">سياسة الخصوصية</a></p>' +
      '<button class="btn-cookie-accept" onclick="veraAcceptCookies()">موافق</button>';
  } else {
    banner.innerHTML =
      '<p>We use analytics and advertising tools (Google Analytics &amp; Meta Pixel) to improve your experience. ' +
      '<a href="' + privacyPath + '">Privacy Policy</a></p>' +
      '<button class="btn-cookie-accept" onclick="veraAcceptCookies()">Accept</button>';
  }

  document.body.appendChild(banner);
}

function veraAcceptCookies() {
  localStorage.setItem('vera_cookie_consent', '1');
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    banner.style.animation = 'slideUpBanner 0.3s ease reverse';
    setTimeout(() => banner.remove(), 280);
  }
}

/* =====================================================
   CHANGE REGION (SPLASH)
   ===================================================== */
function changeRegion() {
  trackEvent('region_change', { from: getMarket() });
  localStorage.removeItem(STORAGE_MARKET);
  localStorage.removeItem(STORAGE_LANG);
  const root = window.VERA_ROOT || '';
  window.location.href = root + 'index.html';
}

/* =====================================================
   SPLASH PAGE: SELECT MARKET + REDIRECT
   ===================================================== */
function splashSelectMarket(market, lang) {
  trackEvent('market_select', { market: market, lang: lang });
  setMarket(market);
  setLang(lang);
  const root = window.VERA_ROOT || '';
  window.location.href = lang === 'ar' ? root + 'ar/index.html' : root + 'en/index.html';
}

/* =====================================================
   SPLASH PAGE: AUTO-REDIRECT IF ALREADY SET
   ===================================================== */
function splashAutoRedirect() {
  const market = localStorage.getItem(STORAGE_MARKET);
  const lang = localStorage.getItem(STORAGE_LANG);
  if (market && lang) {
    const root = window.VERA_ROOT || '';
    window.location.href = lang === 'ar' ? root + 'ar/index.html' : root + 'en/index.html';
  }
}

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // 1. Enable Admin Mode if requested
  if (urlParams.get('admin') === 'true' || urlParams.get('admin') === '1') {
    localStorage.setItem('vera_admin_mode', '1');
    
    // Non-blocking, beautiful UI toast
    setTimeout(() => {
      const toast = document.createElement('div');
      toast.innerHTML = '🛡️ Admin Mode Activated';
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#25D366;color:white;padding:12px 24px;border-radius:30px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:all 0.3s ease;';
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.top = '0'; }, 2500);
      setTimeout(() => toast.remove(), 3000);
    }, 100);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get('admin') === 'false' || urlParams.get('admin') === '0') {
    localStorage.removeItem('vera_admin_mode');
    
    // Non-blocking toast for exit
    setTimeout(() => {
      const toast = document.createElement('div');
      toast.innerHTML = '👋 Admin Mode Disabled';
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#e74c3c;color:white;padding:12px 24px;border-radius:30px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:all 0.3s ease;';
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.top = '0'; }, 2500);
      setTimeout(() => toast.remove(), 3000);
    }, 100);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // 2. Parse Custom Checkout Link (if any)
  const customCartParam = urlParams.get('c');
  if (customCartParam) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(customCartParam)));
      const fullCart = decoded.map(item => ({
        productKey: item.pk,
        size: item.s,
        price: item.p,
        name: item.n,
        image: item.i,
        qty: item.q
      }));
      saveCart(fullCart);
      
      // Clean URL so refreshing doesn't duplicate things
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Open the cart drawer immediately
      setTimeout(() => {
        openCartDrawer();
        showCheckoutScreen();
      }, 500);
    } catch (e) {
      console.error('Failed to parse custom cart link:', e);
    }
  }

  const market = getMarket();
  const lang = getLang();

  // Capture campaign attribution for WhatsApp handoff
  captureUTMParams();

  // Capture fbclid for Meta Conversions API (EMQ improvement)
  captureFBCLID();

  // Set initial state
  renderPrices();
  updateMarketToggles(market, lang);

  // Wire up market toggles
  document.querySelectorAll('.market-toggle').forEach(btn => {
    btn.addEventListener('click', toggleMarket);
  });

  // Wire up "change region" links
  document.querySelectorAll('.change-region').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      changeRegion();
    });
  });

  // Behavior modules
  initNavScroll();
  initFloatWA();
  initHamburger();
  initAccordions();
  initFAQs();
  initWATracking();
  // initCookieConsent(); // Disabled based on user request
  updateWAVisibility(market);

  // Set float WA href
  const floatBtn = document.querySelector('.float-wa');
  if (floatBtn) {
    const product = floatBtn.dataset.waProduct || 'general';
    floatBtn.href = buildWhatsAppLink(product, market, lang);
    floatBtn.addEventListener('click', () => {
      trackWAClick(product, market);
    });
  }

  // Initialize E-Commerce Cart
  injectCartUI();
  initAddToCartBtn();
});

/* =====================================================
   SHOPPING CART & CHECKOUT DRAWER SYSTEM
   ===================================================== */
const CART_STORAGE_KEY = 'vera_cart';

function getCart() {
  try {
    let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    cart = cart.filter(item => item && item.price && item.name);
    return cart;
  } catch (e) {
    return [];
  }
}

function saveCart(cartData) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  updateCartUI();
}

function addToCart(productKey, size, price, name, image) {
  let cartData = getCart();
  const existingIndex = cartData.findIndex(item => item.productKey === productKey && item.size === size);

  if (existingIndex > -1) {
    cartData[existingIndex].qty += 1;
  } else {
    cartData.push({
      productKey: productKey,
      size: size,
      price: price,
      name: name,
      image: image,
      qty: 1
    });
  }
  saveCart(cartData);
  openCartDrawer();

  // Track Meta Pixel & GA
  trackEvent('add_to_cart', { product: productKey, size: size, price: price });
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      content_ids: [productKey + '_' + size],
      content_type: 'product',
      value: price,
      currency: getMarket() === 'egypt' ? 'EGP' : 'AED'
    });
  }

  sendCapiEvent('AddToCart', null, {
    content_ids: [productKey + '_' + size],
    content_type: 'product',
    value: price,
    currency: getMarket() === 'egypt' ? 'EGP' : 'AED'
  });
}

function updateCartQty(productKey, size, delta) {
  let cartData = getCart();
  const index = cartData.findIndex(item => item.productKey === productKey && item.size == size);
  if (index > -1) {
    cartData[index].qty += delta;
    if (cartData[index].qty <= 0) {
      cartData.splice(index, 1);
    }
    saveCart(cartData);
  }
}

function removeFromCart(productKey, size) {
  let cartData = getCart();
  const index = cartData.findIndex(item => item.productKey === productKey && item.size == size);
  if (index > -1) {
    cartData.splice(index, 1);
    saveCart(cartData);
  }
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer.classList.contains('active')) {
    closeCartDrawer();
  } else {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  drawer.classList.add('active');
  overlay.classList.add('active');
  document.getElementById('cart-drawer-overlay').classList.add('active');
  document.getElementById('cart-drawer').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.body.classList.add('cart-open');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer-overlay').classList.remove('active');
  document.getElementById('cart-drawer').classList.remove('active');
  document.body.style.overflow = '';
  document.body.classList.remove('cart-open');
}

function showItemsScreen() {
  document.getElementById('cart-screen-items').classList.add('active');
  document.getElementById('cart-screen-checkout').classList.remove('active');

  const isAr = getLang() === 'ar';
  const actionBtn = document.getElementById('cart-action-btn');
  actionBtn.innerHTML = `
    <span>${isAr ? 'إتمام الطلب' : 'Proceed to Checkout'}</span>
    <i class="fa-solid fa-arrow-right-to-bracket"></i>
  `;
}

function showCheckoutScreen() {
  const cartData = getCart();
  if (cartData.length === 0) return;

  document.getElementById('cart-screen-items').classList.remove('active');
  document.getElementById('cart-screen-checkout').classList.add('active');

  const isAr = getLang() === 'ar';
  const actionBtn = document.getElementById('cart-action-btn');
  actionBtn.innerHTML = `
    <span>${isAr ? 'تأكيد الطلب عبر واتساب' : 'Confirm Order via WhatsApp'}</span>
    <i class="fa-brands fa-whatsapp"></i>
  `;

  // Track InitiateCheckout
  const total = getCartTotal();
  const market = getMarket();
  const currency = market === 'egypt' ? 'EGP' : 'AED';
  const activeDiscountPct = parseInt(localStorage.getItem('vera_active_discount_pct') || '0');
  const finalTotal = activeDiscountPct > 0 ? total - Math.round(total * (activeDiscountPct / 100)) : total;

  trackEvent('initiate_checkout', { value: finalTotal, currency: currency });
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', {
      value: finalTotal,
      currency: currency,
      num_items: getCartCount()
    });
  }

  sendCapiEvent('InitiateCheckout', null, {
    value: finalTotal,
    currency: currency,
    num_items: getCartCount()
  });
}

function handleCartActionClick() {
  const checkoutScreen = document.getElementById('cart-screen-checkout');
  if (checkoutScreen.classList.contains('active')) {
    const form = document.getElementById('checkout-form');
    const isAr = getLang() === 'ar';
    
    // Custom validation for custom dropdowns (hidden inputs)
    const gov = document.getElementById('checkout-gov').value;
    if (!gov) {
      showVeraToast(isAr ? '⚠️ يرجى اختيار المحافظة' : '⚠️ Please select a Governorate', 'error');
      return;
    }
    const city = document.getElementById('checkout-city').value;
    if (!city) {
      showVeraToast(isAr ? '⚠️ يرجى اختيار المدينة' : '⚠️ Please select a City', 'error');
      return;
    }

    if (form.reportValidity()) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  } else {
    showCheckoutScreen();
  }
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('checkout-name').value;
  const phone = document.getElementById('checkout-phone').value;
  const gov = document.getElementById('checkout-gov').value;
  const city = document.getElementById('checkout-city').value;
  const streetAddress = document.getElementById('checkout-address').value;
  const building = document.getElementById('checkout-building').value;
  const floor = document.getElementById('checkout-floor').value;
  const apartment = document.getElementById('checkout-apartment').value;
  const altPhone = document.getElementById('checkout-alt-phone').value;
  const landmark = document.getElementById('checkout-landmark').value;
  const userNotes = document.getElementById('checkout-notes').value.trim();
  
  // Save to localStorage for auto-fill next time
  localStorage.setItem('vera_customer_name', name);
  localStorage.setItem('vera_customer_phone', phone);
  localStorage.setItem('vera_customer_gov', gov);
  localStorage.setItem('vera_customer_city', city);
  localStorage.setItem('vera_customer_address', streetAddress);
  localStorage.setItem('vera_customer_building', building);
  localStorage.setItem('vera_customer_floor', floor);
  localStorage.setItem('vera_customer_apartment', apartment);
  localStorage.setItem('vera_customer_alt_phone', altPhone);
  localStorage.setItem('vera_customer_landmark', landmark);
  localStorage.setItem('vera_customer_notes', userNotes);
  
  let addressDetailsAr = streetAddress;
  let addressDetailsEn = streetAddress;
  if (building) { addressDetailsAr += ` - مبنى ${building}`; addressDetailsEn += `, Bldg ${building}`; }
  if (floor) { addressDetailsAr += ` - دور ${floor}`; addressDetailsEn += `, Floor ${floor}`; }
  if (apartment) { addressDetailsAr += ` - شقة ${apartment}`; addressDetailsEn += `, Apt ${apartment}`; }
  
  const fullAddress = `${gov} - ${city} - ${addressDetailsAr}`;

  const cartData = getCart();
  const total = getCartTotal();
  const market = getMarket();
  const lang = getLang();
  const currency = market === 'egypt' ? 'EGP' : 'AED';

  const activeDiscountCode = localStorage.getItem('vera_active_discount_code');
  const activeDiscountPct = parseInt(localStorage.getItem('vera_active_discount_pct') || '0');
  let discountAmount = 0;
  let finalTotal = total;

  if (activeDiscountPct > 0) {
    discountAmount = Math.round(total * (activeDiscountPct / 100));
    finalTotal = total - discountAmount;
  }

  const hasBundle = cartData.some(item => item.productKey === 'bundle');
  const shipping = market === 'egypt' && total > 0 && !hasBundle ? 80 : 0;
  finalTotal += shipping;

  // Track Purchase
  trackEvent('purchase', { value: finalTotal, currency: currency });
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids: cartData.map(item => item.productKey + '_' + item.size),
      content_type: 'product',
      value: finalTotal,
      currency: currency,
      num_items: getCartCount()
    });
  }

  let userData = null;
  if (phone) {
    userData = { ph: phone.replace(/\D/g, '') }; // Send digits only for phone
  }

  sendCapiEvent('Purchase', userData, {
    content_ids: cartData.map(item => item.productKey + '_' + item.size),
    content_type: 'product',
    value: finalTotal,
    currency: currency,
    num_items: getCartCount()
  });


  // Format WhatsApp message
  let msg = '';
  if (lang === 'ar') {
    msg += `طلب جديد من الموقع 🐾\n`;
    msg += `---------------------------\n`;
    msg += `الاسم: ${name}\n`;
    msg += `الهاتف: ${phone}\n`;
    msg += `المحافظة: ${gov}\n`;
    msg += `المدينة: ${city}\n`;
    msg += `العنوان: ${addressDetailsAr}\n`;
    msg += `---------------------------\n`;
    msg += `المنتجات المطلوبة:\n`;
    cartData.forEach(item => {
      const sizeStr = (item.size && item.size !== 'bundle') ? ` (${item.size}مل)` : '';
      const nameStr = item.productKey === 'bundle' ? 'باقة الحماية الكاملة (سبراي 120مل + شامبو 120مل + معطر 120مل)' : item.name;
      msg += `- ${nameStr}${sizeStr} × ${item.qty} (${item.price * item.qty} ${currency})\n`;
    });
    msg += `---------------------------\n`;
    if (activeDiscountPct > 0) {
      msg += `قيمة المنتجات: ${total} ${currency}\n`;
      msg += `كود الخصم: ${activeDiscountCode} (-${activeDiscountPct}%)\n`;
      msg += `قيمة الخصم: ${discountAmount} ${currency}\n`;
    } else {
      msg += `قيمة المنتجات: ${total} ${currency}\n`;
    }
    if (shipping > 0) {
      msg += `مصاريف الشحن: ${shipping} ${currency}\n`;
    } else if (hasBundle) {
      msg += `مصاريف الشحن: مجاني\n`;
    }
    msg += `الإجمالي النهائي: *${finalTotal} ${currency}*\n`;
  } else {
    msg += `New Website Order 🐾\n`;
    msg += `---------------------------\n`;
    msg += `Name: ${name}\n`;
    msg += `Phone: ${phone}\n`;
    msg += `Gov: ${gov}\n`;
    msg += `City: ${city}\n`;
    msg += `Address: ${addressDetailsEn}\n`;
    msg += `---------------------------\n`;
    msg += `Requested Products:\n`;
    cartData.forEach(item => {
      const sizeStr = (item.size && item.size !== 'bundle') ? ` (${item.size}ml)` : '';
      const nameStr = item.productKey === 'bundle' ? 'Complete Protection Bundle (120ml Spray + 120ml Shampoo + 120ml Deodorizing)' : item.name;
      msg += `- ${nameStr}${sizeStr} x ${item.qty} (${item.price * item.qty} ${currency})\n`;
    });
    msg += `---------------------------\n`;
    if (activeDiscountPct > 0) {
      msg += `Products Total: ${total} ${currency}\n`;
      msg += `Discount Code: ${activeDiscountCode} (-${activeDiscountPct}%)\n`;
      msg += `Discount Amount: ${discountAmount} ${currency}\n`;
    } else {
      msg += `Products Total: ${total} ${currency}\n`;
    }
    if (shipping > 0) {
      msg += `Shipping: ${shipping} ${currency}\n`;
    } else if (hasBundle) {
      msg += `Shipping: FREE\n`;
    }
    msg += `Final Total: *${finalTotal} ${currency}*\n`;
  }

  // Append campaign attribution if present
  const utm = getUTMParams();
  if (utm.utm_source) {
    const refLabel = lang === 'ar' ? 'مصدر: ' : 'Source: ';
    msg += `---------------------------\n`;
    msg += refLabel + [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ');
  }

  const number = VERA_CONFIG.markets[market].whatsapp;
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;

  // Clear cart and redirect
  localStorage.removeItem(CART_STORAGE_KEY);
  if (activeDiscountCode) {
    localStorage.setItem('vera_discount_used', activeDiscountCode);
    localStorage.removeItem('vera_active_discount_code');
    localStorage.removeItem('vera_active_discount_pct');
  }
  updateCartUI();
  closeCartDrawer();
  showItemsScreen();
  document.getElementById('checkout-form').reset();

  // reset discount code field state
  const statusMsg = document.getElementById('discount-status-msg');
  if (statusMsg) statusMsg.textContent = '';

  // Calculate items sum
  const totalItems = cartData.reduce((sum, item) => sum + item.qty, 0);
  const productsText = cartData.map(item => `${item.name} (${item.size || ''}) x${item.qty}`).join(', ');

  // Webhook payload for Turbo Google Sheet
  const payload = {
    sub_sender: "Vera",
    sender_number: "01288649908",
    follow_up_number: "01288649908",
    shipment_type: "Pet Products",
    recipient_name: name,
    recipient_number: phone,
    governorate: gov,
    city: city,
    address: addressDetailsAr,
    building: building,
    floor: floor,
    apartment: apartment,
    alt_phone: altPhone,
    landmark: landmark,
    notes: userNotes ? `يرجى الاتصال قبل التسليم - ${userNotes}` : "يرجى الاتصال قبل التسليم",
    shipment_contents: productsText,
    items_count: totalItems,
    amount_to_collect: finalTotal,
    country: "مصر"
  };

  // The Google Apps Script Webhook URL
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbx_0HTn-EMRPNN7CPruR_aATvaX7R2k9zlzODJlR0eOG48rSl_EWezvcGRqNWl5kPL1/exec';

  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // no-cors so we don't block the user if it fails
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(e => console.error('Webhook error:', e));
  }

  window.open(waUrl, '_blank');
}

function updateCartUI() {
  const cartData = getCart();
  const count = getCartCount();
  const total = getCartTotal();
  const lang = getLang();
  const market = getMarket();
  const isAr = lang === 'ar';
  const currency = market === 'egypt' ? (isAr ? 'جنيه' : 'EGP') : (isAr ? 'درهم' : 'AED');

  // Update floating badge count & hide floating button if empty
  const badge = document.getElementById('cart-count-badge');
  const floatBtn = document.querySelector('.cart-icon-floating');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  if (floatBtn) {
    floatBtn.style.display = count > 0 ? 'flex' : 'none';
  }

  // Update total price display
  const totalVal = document.getElementById('cart-total-val');
  const activeDiscountPct = parseInt(localStorage.getItem('vera_active_discount_pct') || '0');
  const hasBundle = cartData.some(item => item.productKey === 'bundle');
  const shipping = market === 'egypt' && total > 0 && !hasBundle ? 80 : 0;

  if (totalVal) {
    let finalTotal = total;
    let discountAmount = 0;
    if (activeDiscountPct > 0 && total > 0) {
      discountAmount = Math.round(total * (activeDiscountPct / 100));
    }
    finalTotal = total - discountAmount + shipping;

    let html = '';
    if (activeDiscountPct > 0 && total > 0) {
      html += `<span style="text-decoration: line-through; font-size: 0.8em; opacity: 0.7; margin-right: 5px;">${total}</span> `;
    }
    html += isAr ? `${finalTotal} ${currency}` : `${currency} ${finalTotal}`;

    if (shipping > 0) {
      html += `<div style="font-size: 0.75em; opacity: 0.8; margin-top: 4px; font-weight: normal;">${isAr ? '(شامل 80 جنيه مصاريف شحن)' : '(Includes 80 EGP shipping)'}</div>`;
    }
    totalVal.innerHTML = html;
  }

  // Update list
  const list = document.getElementById('cart-items-list');
  if (!list) return;

  if (cartData.length === 0) {
    list.innerHTML = `<div class="cart-empty-msg">${isAr ? 'سلة المشتريات فارغة' : 'Your cart is empty'}</div>`;
    const actionBtn = document.getElementById('cart-action-btn');
    if (actionBtn) actionBtn.style.display = 'none';
    const adminBtn = document.getElementById('admin-generate-link-btn');
    if (adminBtn) adminBtn.style.display = 'none';
    showItemsScreen();
  } else {
    const actionBtn = document.getElementById('cart-action-btn');
    if (actionBtn) actionBtn.style.display = 'flex';
    const adminBtn = document.getElementById('admin-generate-link-btn');
    const adminExitBtn = document.getElementById('admin-exit-wrapper');
    if (localStorage.getItem('vera_admin_mode') === '1') {
      if (adminBtn) adminBtn.style.display = 'flex';
      if (adminExitBtn) adminExitBtn.style.display = 'block';
    } else {
      if (adminBtn) adminBtn.style.display = 'none';
      if (adminExitBtn) adminExitBtn.style.display = 'none';
    }

    list.innerHTML = cartData.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-size">${item.size ? (isAr ? `${item.size} مل` : `${item.size} ml`) : ''}</div>
          <div class="cart-item-price">${isAr ? `${item.price * item.qty} ${currency}` : `${currency} ${item.price * item.qty}`}</div>
          
          <div class="cart-item-actions">
            <div class="cart-qty-control">
              <button class="cart-qty-btn" onclick="updateCartQty('${item.productKey}', '${item.size}', -1)">&minus;</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn" onclick="updateCartQty('${item.productKey}', '${item.size}', 1)">&plus;</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.productKey}', '${item.size}')">
              ${isAr ? 'إزالة' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function injectCartUI() {
  if (document.getElementById('cart-drawer')) return;

  const lang = getLang();
  const isAr = lang === 'ar';

  // Inject floating cart button
  const cartBtn = document.createElement('div');
  cartBtn.id = 'cart-icon-floating';
  cartBtn.className = 'cart-icon-floating';
  cartBtn.innerHTML = `
    <i class="fa-solid fa-cart-shopping"></i>
    <span class="cart-count-badge" id="cart-count-badge">0</span>
  `;
  document.body.appendChild(cartBtn);

  // Inject drawer overlay
  const overlay = document.createElement('div');
  overlay.id = 'cart-drawer-overlay';
  overlay.className = 'cart-drawer-overlay';
  document.body.appendChild(overlay);

  // Inject drawer
  const drawer = document.createElement('div');
  drawer.id = 'cart-drawer';
  drawer.className = 'cart-drawer';
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3>${isAr ? 'سلة المشتريات' : 'Shopping Cart'}</h3>
      <button class="cart-drawer-close" id="cart-drawer-close">&times;</button>
    </div>
    
    <div class="cart-drawer-content">
      <!-- Screen 1: Cart Items -->
      <div class="cart-drawer-screen active" id="cart-screen-items">
        <div id="cart-items-list"></div>
      </div>
      
      <!-- Screen 2: Checkout Form -->
      <div class="cart-drawer-screen" id="cart-screen-checkout">
        <button class="checkout-back-btn" id="checkout-back-btn">
          <i class="fa-solid ${isAr ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
          ${isAr ? 'العودة للسلة' : 'Back to Cart'}
        </button>
        <form class="checkout-form" id="checkout-form">
          <div class="checkout-field">
            <label for="checkout-discount-code" style="display: flex; justify-content: space-between;">
              <span>${isAr ? 'كود الخصم (اختياري)' : 'Discount Code (Optional)'}</span>
              <span id="discount-status-msg" style="font-size: 0.85em; font-weight: normal;"></span>
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="checkout-discount-code" class="checkout-input" placeholder="${isAr ? 'أدخل كود الخصم' : 'Enter discount code'}" style="margin-bottom: 0;">
              <button type="button" id="apply-discount-btn" style="padding: 0 15px; background: #c5a880; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-family: inherit;">${isAr ? 'تطبيق' : 'Apply'}</button>
            </div>
          </div>
          <div class="checkout-field">
            <label for="checkout-name">${isAr ? 'الاسم بالكامل' : 'Full Name'}</label>
            <input type="text" id="checkout-name" class="checkout-input" required placeholder="${isAr ? 'ادخل اسمك بالكامل' : 'Enter your full name'}" value="${localStorage.getItem('vera_customer_name') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-phone">${isAr ? 'رقم الهاتف (يفضل واتساب)' : 'Phone Number (WhatsApp preferred)'}</label>
            <input type="tel" id="checkout-phone" class="checkout-input" required placeholder="${isAr ? 'مثال: 01012345678' : 'e.g. 01012345678'}" value="${localStorage.getItem('vera_customer_phone') || ''}">
          </div>
          <div class="checkout-field">
            <label id="checkout-gov-label">${isAr ? 'المحافظة' : 'Governorate'}</label>
            <div id="checkout-gov-wrapper" class="custom-select-container"></div>
            <input type="hidden" id="checkout-gov">
          </div>
          <div class="checkout-field">
            <label id="checkout-city-label">${isAr ? 'المدينة' : 'City'}</label>
            <div id="checkout-city-wrapper" class="custom-select-container"></div>
            <input type="hidden" id="checkout-city">
          </div>
          <div class="checkout-field">
            <label for="checkout-address">${isAr ? 'العنوان' : 'Address'}</label>
            <input type="text" id="checkout-address" class="checkout-input" required placeholder="${isAr ? 'اسم الشارع' : 'Street name'}" value="${localStorage.getItem('vera_customer_address') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-building">${isAr ? 'رقم المبنى' : 'Building No'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <input type="text" id="checkout-building" class="checkout-input" placeholder="${isAr ? 'مثال: 5' : 'e.g. 5'}" value="${localStorage.getItem('vera_customer_building') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-floor">${isAr ? 'الدور' : 'Floor'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <input type="text" id="checkout-floor" class="checkout-input" placeholder="${isAr ? 'مثال: 3' : 'e.g. 3'}" value="${localStorage.getItem('vera_customer_floor') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-apartment">${isAr ? 'الشقة' : 'Apartment'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <input type="text" id="checkout-apartment" class="checkout-input" placeholder="${isAr ? 'مثال: 12' : 'e.g. 12'}" value="${localStorage.getItem('vera_customer_apartment') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-alt-phone">${isAr ? 'رقم هاتف إضافي' : 'Alternative Phone'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <input type="tel" id="checkout-alt-phone" class="checkout-input" placeholder="${isAr ? 'رقم احتياطي للتواصل' : 'Backup number'}" value="${localStorage.getItem('vera_customer_alt_phone') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-landmark">${isAr ? 'علامة مميزة' : 'Landmark'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <input type="text" id="checkout-landmark" class="checkout-input" placeholder="" value="${localStorage.getItem('vera_customer_landmark') || ''}">
          </div>
          <div class="checkout-field">
            <label for="checkout-notes">${isAr ? 'ملاحظات التوصيل' : 'Delivery Notes'} <span style="font-size:0.75em;opacity:0.6">(${isAr ? 'اختياري' : 'optional'})</span></label>
            <textarea id="checkout-notes" class="checkout-input" rows="2" placeholder="${isAr ? 'أي ملاحظات إضافية للمندوب...' : 'Any extra notes for the courier...'}">${localStorage.getItem('vera_customer_notes') || ''}</textarea>
          </div>
        </form>
      </div>
    </div>
    
    <div class="cart-drawer-footer">
      <div class="cart-total-row">
        <span>${isAr ? 'الإجمالي:' : 'Total:'}</span>
        <span class="cart-total-val" id="cart-total-val">0 EGP</span>
      </div>
      <button class="cart-btn-primary" id="cart-action-btn">
        <span>${isAr ? 'إتمام الطلب' : 'Proceed to Checkout'}</span>
        <i class="fa-solid fa-arrow-right-to-bracket"></i>
      </button>
      <button class="cart-btn-primary" id="admin-generate-link-btn" style="display: none; background: #25D366; color: white; margin-top: 10px; border: none;">
        <span><i class="fa-solid fa-link"></i> ${isAr ? 'نسخ رابط الدفع المباشر' : 'Copy Direct Link'}</span>
      </button>
      <div id="admin-exit-wrapper" style="display: none; text-align: center; margin-top: 10px;">
        <a href="#" id="admin-exit-btn" style="color: #888; font-size: 0.85em; text-decoration: underline;">${isAr ? 'إلغاء وضع الأدمن' : 'Exit Admin Mode'}</a>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  // Wire up events
  cartBtn.addEventListener('click', toggleCartDrawer);
  overlay.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-close').addEventListener('click', closeCartDrawer);
  document.getElementById('checkout-back-btn').addEventListener('click', showItemsScreen);

  const actionBtn = document.getElementById('cart-action-btn');
  actionBtn.addEventListener('click', handleCartActionClick);

  document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);
  document.getElementById('apply-discount-btn').addEventListener('click', handleApplyDiscount);

  // Admin Link Generator Event Listener
  const adminBtn = document.getElementById('admin-generate-link-btn');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      const cartData = getCart();
      if (cartData.length === 0) {
        showVeraToast(isAr ? '⚠️ السلة فارغة!' : '⚠️ Cart is empty!', 'error');
        return;
      }
      const simpleCart = cartData.map(item => ({
        pk: item.productKey, s: item.size, p: item.price, n: item.name, i: item.image, q: item.qty
      }));
      const b64 = btoa(encodeURIComponent(JSON.stringify(simpleCart)));
      const url = window.location.origin + window.location.pathname + '?c=' + b64;
      
      navigator.clipboard.writeText(url).then(() => {
        const originalText = adminBtn.innerHTML;
        adminBtn.innerHTML = '<span><i class="fa-solid fa-check"></i> ' + (isAr ? 'تم النسخ بنجاح!' : 'Copied successfully!') + '</span>';
        setTimeout(() => { adminBtn.innerHTML = originalText; }, 2000);
      });
    });
  }

  // Admin Exit Event Listener
  const adminExit = document.getElementById('admin-exit-btn');
  if (adminExit) {
    adminExit.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('vera_admin_mode');
      updateCartUI(); // This will instantly hide the admin buttons
    });
  }

  // Load Regions JSON and populate dropdowns
  loadRegionsForCheckout();

  updateCartUI();
}

let loadedRegions = null;

function createCustomSelect(containerId, inputId, options, placeholder, onChangeCallback, defaultValue = '') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const hiddenInput = document.getElementById(inputId);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'checkout-input custom-select-input';
  input.placeholder = placeholder;
  
  if (defaultValue && options.includes(defaultValue)) {
    input.value = defaultValue;
    hiddenInput.value = defaultValue;
  }

  const arrow = document.createElement('i');
  arrow.className = 'fa-solid fa-chevron-down custom-select-arrow';

  const list = document.createElement('ul');
  list.className = 'custom-select-list';

  function normalizeArabic(text) {
    return text.replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  }

  function renderList(filterText = '') {
    list.innerHTML = '';
    const normalizedFilter = normalizeArabic(filterText.toLowerCase());

    const filtered = options.filter(opt =>
      normalizeArabic(opt.toLowerCase()).includes(normalizedFilter)
    );

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'custom-select-empty';
      empty.textContent = getLang() === 'ar' ? 'لا توجد نتائج' : 'No results found';
      list.appendChild(empty);
    } else {
      filtered.forEach(opt => {
        const li = document.createElement('li');
        li.textContent = opt;
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          input.value = opt;
          hiddenInput.value = opt;
          list.classList.remove('active');
          if (onChangeCallback) onChangeCallback(opt);
        });
        list.appendChild(li);
      });
    }
  }

  input.addEventListener('focus', () => {
    list.classList.add('active');
    renderList('');
  });

  input.addEventListener('input', (e) => {
    list.classList.add('active');
    renderList(e.target.value);
    hiddenInput.value = ''; // invalidate if they type without selecting
  });

  const documentClickHandler = (e) => {
    // If the input was replaced/removed from DOM, remove this listener
    if (!document.body.contains(container) || !container.contains(input)) {
      document.removeEventListener('click', documentClickHandler);
      return;
    }
    
    if (!container.contains(e.target)) {
      list.classList.remove('active');
      // If they click out and it doesn't match an exact option, clear it
      if (!options.includes(input.value)) {
        input.value = '';
        hiddenInput.value = '';
      } else {
        hiddenInput.value = input.value; // Valid text typed manually
      }
    }
  };
  document.addEventListener('click', documentClickHandler);

  container.appendChild(input);
  container.appendChild(arrow);
  container.appendChild(list);

  renderList('');
  
  if (defaultValue && options.includes(defaultValue) && onChangeCallback) {
    // Timeout ensures it runs after current call stack, avoiding layout jump glitches
    setTimeout(() => onChangeCallback(defaultValue), 10);
  }

  // Return a way to disable/enable it
  return {
    setDisabled: (disabled, newPlaceholder = null) => {
      input.disabled = disabled;
      if (newPlaceholder) input.placeholder = newPlaceholder;
      if (disabled) {
        input.value = '';
        hiddenInput.value = '';
        container.style.opacity = '0.6';
      } else {
        container.style.opacity = '1';
      }
    }
  };
}

function loadRegionsForCheckout() {
  const isAr = getLang() === 'ar';

  // Initialize empty state
  const savedGov = localStorage.getItem('vera_customer_gov') || '';
  const savedCity = localStorage.getItem('vera_customer_city') || '';
  
  let citySelectController = createCustomSelect(
    'checkout-city-wrapper',
    'checkout-city',
    [],
    isAr ? 'اختر المحافظة أولاً' : 'Select Governorate first',
    null
  );
  if (citySelectController) citySelectController.setDisabled(true);

  fetch('/assets/regions.json')
    .then(res => res.json())
    .then(data => {
      loadedRegions = data;
      const govOptions = Object.keys(data);

      createCustomSelect(
        'checkout-gov-wrapper',
        'checkout-gov',
        govOptions,
        isAr ? 'اختر المحافظة' : 'Select Governorate',
        (selectedGov) => {
          // When governorate changes, setup city dropdown
          const cities = data[selectedGov] || [];
          citySelectController = createCustomSelect(
            'checkout-city-wrapper',
            'checkout-city',
            cities,
            isAr ? 'اختر المدينة' : 'Select City',
            null,
            savedCity // Pass saved city if it exists
          );
          if (citySelectController) citySelectController.setDisabled(false);
        },
        savedGov // Pass saved gov if it exists
      );
    })
    .catch(err => console.error("Could not load regions.json", err));
}

function handleApplyDiscount() {
  const codeInput = document.getElementById('checkout-discount-code').value.trim().toUpperCase();
  const statusMsg = document.getElementById('discount-status-msg');
  const isAr = getLang() === 'ar';

  if (codeInput === 'VERA5') {
    if (localStorage.getItem('vera_discount_used') === 'VERA5') {
      statusMsg.textContent = isAr ? 'تم استخدام هذا الكود من قبل' : 'This code was already used';
      statusMsg.style.color = '#dc3545';
      return;
    }
    localStorage.setItem('vera_active_discount_code', 'VERA5');
    localStorage.setItem('vera_active_discount_pct', '5');
    statusMsg.textContent = isAr ? 'تم تطبيق الخصم بنجاح! (-5%)' : 'Discount applied! (-5%)';
    statusMsg.style.color = '#28a745';
    updateCartUI();
  } else if (codeInput === '') {
    statusMsg.textContent = '';
  } else {
    statusMsg.textContent = isAr ? 'كود غير صحيح' : 'Invalid code';
    statusMsg.style.color = '#dc3545';
    localStorage.removeItem('vera_active_discount_code');
    localStorage.removeItem('vera_active_discount_pct');
    updateCartUI();
  }
}

function initAddToCartBtn() {
  const addBtn = document.getElementById('btn-add-to-cart');
  if (!addBtn) return;

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();

    let productKey = '';
    const path = window.location.pathname;
    if (path.includes('/spray')) productKey = 'spray';
    else if (path.includes('/shampoo')) productKey = 'shampoo';
    else if (path.includes('/deo')) productKey = 'deo';
    else return;

    const market = getMarket();
    const lang = getLang();
    const cfg = VERA_CONFIG.products[productKey];

    let size = '';
    let price = cfg.prices[market];

    const activeSizeBtn = document.querySelector('#' + productKey + '-size-selector .size-btn-active');
    if (activeSizeBtn) {
      size = activeSizeBtn.getAttribute('data-size');
      price = parseInt(activeSizeBtn.getAttribute('data-price-' + market));
    } else {
      if (productKey === 'shampoo') size = '250';
      else if (productKey === 'deo') size = '125';
    }

    let image = '';
    const imgEl = document.querySelector('.product-img-wrap img');
    if (imgEl) image = imgEl.src;

    const name = lang === 'ar' ? cfg.name_ar : cfg.name_en;

    addToCart(productKey, size, price, name, image);
  });
}

// Bind to window to allow inline onclick bindings in injected HTML
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.openCartDrawer = openCartDrawer;

