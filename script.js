const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';
const DEFAULT_BANNER_URL = 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner';

const CATEGORY_ICONS = {
  'Must Try!': '⭐',
  'Dessert': '🍰',
  'Coffee': '☕',
  'Non-Coffee': '🧋',
  'Refreshment': '🍹',
  'Appetizers': '🍟',
  'Pasta': '🍝',
  'Sandwich': '🥪',
  'Rice Meal': '🍛',
  'Salad': '🥗',
  'Waffle': '🧇',
  'Ramen': '🍜',
  'Cocktails': '🍸'
};

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (err) {
  console.error('Supabase initialization error:', err);
}

let allMenuData = [];
let isMenuLoading = true;
let renderedEvents = [];
let activeCategory = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(url, fallback = '') {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.href : fallback;
  } catch (_) {
    return fallback;
  }
}

function normalizeGalleryImages(images) {
  if (Array.isArray(images)) {
    return images.map((url) => safeUrl(url, '')).filter(Boolean);
  }
  if (typeof images === 'string' && images.trim() !== '') {
    return images.split(',').map((url) => safeUrl(url, '')).filter(Boolean);
  }
  return [];
}

function parseNumericPrice(price) {
  return parseFloat(String(price ?? '').replace(/[^0-9.]/g, '')) || 0;
}

function parseEventDate(dateStr) {
  if (!dateStr) return new Date(8640000000000);
  const firstPart = String(dateStr).split(',')[0].trim().replace(/(\d+)\s*-\s*\d+/, '$1');
  const parsed = new Date(firstPart);
  return Number.isNaN(parsed.getTime()) ? new Date(8640000000000) : parsed;
}

function getWalkingCatLoaderHtml(message = 'Loading...', { compact = false, dark = false } = {}) {
  const sizeStyle = compact ? 'style="width:54px;height:38px;"' : '';
  const textClass = dark ? 'text-gray-300' : 'text-brand-muted';

  return `
    <div role="status" aria-live="polite" class="hmc-cat-loader py-4">
      <svg class="hmc-cat-walk-svg" ${sizeStyle} viewBox="0 0 84 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect class="hmc-leg-back-b" x="24" y="30" width="5" height="15" rx="2.5" fill="#D97724"/>
        <rect class="hmc-leg-front-b" x="48" y="30" width="5" height="15" rx="2.5" fill="#D97724"/>
        <path class="hmc-cat-tail" d="M22 25C13 23 10 13 15 9" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>
        <g class="hmc-cat-body">
          <rect x="21" y="20" width="35" height="15" rx="7.5" fill="#F59E0B"/>
          <path d="M33 20.5V25M39 20.5V25.5M45 20.5V25" stroke="#B45309" stroke-width="2" stroke-linecap="round"/>
          <circle cx="58" cy="20" r="10" fill="#F59E0B"/>
          <polygon points="50,13 52,5 57,11" fill="#F59E0B"/>
          <polygon points="60,11 65,5 66,13" fill="#F59E0B"/>
          <polygon points="51.5,12 52.5,7.5 55.5,11" fill="#FDBA74"/>
          <polygon points="61,11 64,7.5 64.5,12" fill="#FDBA74"/>
          <circle cx="61.5" cy="19" r="1.4" fill="#1F2937"/>
          <circle cx="66.5" cy="21.5" r="1.3" fill="#FB7185"/>
          <path d="M62 23.5C63.5 24.8 65.5 24.8 67 23.5" stroke="#78350F" stroke-width="1.4" stroke-linecap="round"/>
          <rect x="49" y="24" width="11" height="2.6" rx="1.3" fill="#00A896"/>
        </g>
        <rect class="hmc-leg-back-a" x="28" y="30" width="5.5" height="16" rx="2.75" fill="#FBBF24"/>
        <rect class="hmc-leg-front-a" x="52" y="30" width="5.5" height="16" rx="2.75" fill="#FBBF24"/>
      </svg>
      <div class="hmc-paw-trail flex items-center gap-1.5" aria-hidden="true">
        <span>🐾</span><span>🐾</span><span>🐾</span>
      </div>
      <p class="text-xs font-semibold ${textClass}">${escapeHtml(message)}</p>
    </div>
  `;
}

function dismissPageOpenLoader() {
  const loader = document.getElementById('pageOpenLoader');
  if (!loader || loader.dataset.dismissed === 'true') return;
  loader.dataset.dismissed = 'true';
  loader.classList.add('opacity-0', 'pointer-events-none');
  window.setTimeout(() => {
    loader.classList.add('hidden');
  }, 320);
}

window.addEventListener('load', () => {
  window.setTimeout(dismissPageOpenLoader, 300);
});
window.setTimeout(dismissPageOpenLoader, 1500);

async function logVisitorInteraction(eventType, details = '') {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('analytics_logs').insert([{
      event_type: String(eventType).slice(0, 60),
      details: String(details).slice(0, 200)
    }]);
  } catch (err) {
    console.error('Error logging interaction:', err);
  }
}

function updateStoreStatus() {
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');
  const statusBadge = document.getElementById('statusBadge');
  const mobileStatusText = document.getElementById('mobileStatusText');
  const mobileStatusDot = document.getElementById('mobileStatusDot');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = currentMinutes >= 9 * 60 && currentMinutes < 21 * 60;

  if (statusText) {
    statusText.textContent = isOpen ? 'Open Now • Closes at 9:00 PM' : 'Closed Now • Opens at 9:00 AM';
  }
  if (statusDot) {
    statusDot.className = isOpen
      ? 'status-dot w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse'
      : 'status-dot w-2.5 h-2.5 rounded-full bg-rose-400';
  }
  if (statusBadge) {
    statusBadge.classList.remove('hidden');
  }
  if (mobileStatusText) {
    mobileStatusText.textContent = isOpen ? 'Open Now' : 'Closed Now';
  }
  if (mobileStatusDot) {
    mobileStatusDot.className = isOpen
      ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse'
      : 'w-2 h-2 rounded-full bg-rose-400';
  }
}

async function loadFrontendMenu() {
  isMenuLoading = true;
  if (!supabaseClient) {
    isMenuLoading = false;
    return;
  }
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*');
    if (error) throw error;
    allMenuData = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching menu items:', err);
  } finally {
    isMenuLoading = false;
  }
}

async function fetchEventsList() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('events').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error('Error fetching events from Supabase:', err);
    }
  }

  try {
    const parsedLocal = JSON.parse(localStorage.getItem('hmc_local_events') || '[]');
    return Array.isArray(parsedLocal) ? parsedLocal : [];
  } catch (err) {
    console.error('Error reading local events:', err);
    return [];
  }
}

async function loadFrontendEvents() {
  const eventsContainer = document.getElementById('eventsGrid');
  const eventCountBadge = document.getElementById('eventCountBadge');
  if (!eventsContainer) return;

  if (eventCountBadge) eventCountBadge.textContent = 'Loading events...';
  eventsContainer.innerHTML = `<div class="col-span-full flex justify-center py-8">${getWalkingCatLoaderHtml('Gathering events...')}</div>`;

  const events = await fetchEventsList();
  events.sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
  renderedEvents = events;

  if (eventCountBadge) eventCountBadge.textContent = `${events.length} Events`;

  if (events.length === 0) {
    eventsContainer.innerHTML = '<p class="col-span-full text-center text-gray-400 text-sm py-8">No events posted yet.</p>';
    return;
  }

  eventsContainer.innerHTML = events.map((ev, index) => {
    const bannerUrl = safeUrl(ev.image, DEFAULT_BANNER_URL);
    const galleryImages = normalizeGalleryImages(ev.images);

    return `
      <div data-event-index="${index}" class="event-card bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100 hover:shadow-soft transition-all flex flex-col justify-between cursor-pointer group">
        <div class="relative h-52 overflow-hidden">
          <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(ev.title || 'Event')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-4 left-4 px-3.5 py-1 rounded-full text-xs font-bold bg-brand-orange text-white shadow-md uppercase tracking-wider">${escapeHtml(ev.date || '')}</span>
          ${galleryImages.length > 0 ? `<span class="absolute bottom-4 right-4 px-2.5 py-1 bg-brand-turquoise text-white text-[10px] font-bold rounded-full shadow-md">+${galleryImages.length} Photos</span>` : ''}
        </div>
        <div class="p-6 flex flex-col justify-between flex-grow">
          <div>
            <h3 class="font-heading font-bold text-xl text-gray-900 mb-2 group-hover:text-brand-turquoise transition-colors">${escapeHtml(ev.title || '')}</h3>
            <p class="text-xs text-brand-muted leading-relaxed line-clamp-2">${escapeHtml(ev.description || '')}</p>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-brand-turquoise">
            <span>Click to view gallery &amp; details →</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openEventModal = function openEventModal(evOrIndex) {
  const ev = typeof evOrIndex === 'number' ? renderedEvents[evOrIndex] : evOrIndex;
  if (!ev) return;

  logVisitorInteraction('event_view', ev.title || 'Event Modal');
  const modal = document.getElementById('eventDetailModal');
  const content = document.getElementById('modalEventContent');
  if (!modal || !content) return;

  const bannerUrl = safeUrl(ev.image, DEFAULT_BANNER_URL);
  const galleryImages = normalizeGalleryImages(ev.images);

  content.innerHTML = `
    <div class="text-center sm:text-left">
      <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-3">${escapeHtml(ev.date || '')}</span>
      <h2 class="font-heading font-extrabold text-2xl text-brand-dark mb-3">${escapeHtml(ev.title || '')}</h2>
      <p class="text-brand-muted text-sm leading-relaxed mb-6">${escapeHtml(ev.description || '')}</p>
    </div>

    <div class="space-y-4">
      <h4 class="font-heading font-bold text-sm text-brand-dark uppercase tracking-wider">Event Banner &amp; Gallery Photos</h4>
      <div class="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
        <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(ev.title || 'Event Banner')}" data-lightbox-url="${escapeHtml(bannerUrl)}" class="lightbox-trigger w-full h-64 object-cover cursor-pointer">
      </div>

      ${galleryImages.length > 0 ? `
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
          ${galleryImages.map((imgUrl) => `
            <div data-lightbox-url="${escapeHtml(imgUrl)}" class="lightbox-trigger block rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:opacity-90 transition-opacity aspect-square cursor-pointer">
              <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(ev.title || 'Event Photo')}" class="w-full h-full object-cover">
            </div>
          `).join('')}
        </div>
        <p class="text-[11px] text-gray-400 italic text-center">Click any thumbnail to view full size here.</p>
      ` : '<p class="text-xs text-gray-400 italic">No additional gallery photos uploaded for this event.</p>'}
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeEventModal = function closeEventModal() {
  document.getElementById('eventDetailModal')?.classList.add('hidden');
};

window.openLightbox = function openLightbox(imgUrl) {
  const cleanUrl = safeUrl(imgUrl, DEFAULT_BANNER_URL);
  let lb = document.getElementById('imgLightboxModal');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'imgLightboxModal';
    lb.className = 'fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 cursor-pointer';
    lb.innerHTML = `
      <div class="relative max-w-4xl max-h-[90vh]">
        <button type="button" onclick="closeLightbox()" aria-label="Close image preview" class="absolute -top-10 right-0 text-white font-bold text-2xl cursor-pointer">✕</button>
        <img id="lightboxImg" src="" alt="Full size preview" class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl">
      </div>
    `;
    lb.addEventListener('click', (e) => {
      if (e.target === lb) window.closeLightbox();
    });
    document.body.appendChild(lb);
  }
  document.getElementById('lightboxImg').src = cleanUrl;
  lb.classList.remove('hidden');
};

window.closeLightbox = function closeLightbox() {
  document.getElementById('imgLightboxModal')?.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
  logVisitorInteraction('page_view', window.location.pathname);
  updateStoreStatus();
  window.setInterval(updateStoreStatus, 60000);

  loadFrontendMenu();
  loadFrontendEvents();

  // Header scroll state
  const header = document.getElementById('mainHeader');
  const heroSection = document.getElementById('home');
  const handleScroll = () => {
    if (!header) return;
    const pastHero = heroSection
      ? window.scrollY >= heroSection.offsetTop + heroSection.offsetHeight - header.offsetHeight
      : window.scrollY > 30;
    header.classList.toggle('scrolled', pastHero);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu drawer
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileOverlay = document.getElementById('mobileMenuOverlay');
  const mobileDrawer = document.getElementById('mobileMenuDrawer');
  const mobileClose = document.getElementById('mobileMenuClose');

  function setMobileMenuOpen(isOpen) {
    if (!mobileOverlay || !mobileDrawer) return;
    mobileOverlay.classList.toggle('opacity-0', !isOpen);
    mobileOverlay.classList.toggle('pointer-events-none', !isOpen);
    mobileDrawer.classList.toggle('translate-x-full', !isOpen);
  }

  mobileToggle?.addEventListener('click', () => setMobileMenuOpen(true));
  mobileClose?.addEventListener('click', () => setMobileMenuOpen(false));
  mobileOverlay?.addEventListener('click', (e) => {
    if (e.target === mobileOverlay) setMobileMenuOpen(false);
  });
  document.querySelectorAll('.mobile-nav-link, #mobileReserveBtn').forEach((link) => {
    link.addEventListener('click', () => setMobileMenuOpen(false));
  });

  // Welcome popup
  const welcomePopup = document.getElementById('welcomePopup');
  const popupCard = document.getElementById('popupCard');
  const popupAboutBtn = document.getElementById('popupAboutBtn');
  const closeWelcomePopupBtn = document.getElementById('closeWelcomePopupBtn');

  function closeWelcomePopup() {
    if (!welcomePopup || !popupCard) return;
    welcomePopup.classList.add('opacity-0', 'pointer-events-none');
    popupCard.classList.remove('scale-100');
    popupCard.classList.add('scale-90');
  }

  window.setTimeout(() => {
    dismissPageOpenLoader();
    if (welcomePopup && popupCard) {
      welcomePopup.classList.remove('opacity-0', 'pointer-events-none');
      popupCard.classList.remove('scale-90');
      popupCard.classList.add('scale-100');
    }
  }, 600);

  closeWelcomePopupBtn?.addEventListener('click', closeWelcomePopup);
  welcomePopup?.addEventListener('click', (e) => {
    if (e.target === welcomePopup) closeWelcomePopup();
  });
  popupAboutBtn?.addEventListener('click', () => {
    logVisitorInteraction('popup_interaction', 'About Us');
    closeWelcomePopup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.querySelectorAll('.popup-link').forEach((link) => {
    link.addEventListener('click', () => {
      logVisitorInteraction('popup_interaction', link.textContent.trim());
    });
  });

  // Menu category drawer
  const menuBubbles = document.querySelectorAll('.menu-bubble');
  const menuDrawerContainer = document.getElementById('menuDrawerContainer');
  const drawerCategoryTitle = document.getElementById('drawerCategoryTitle');
  const drawerCategoryIcon = document.getElementById('drawerCategoryIcon');
  const drawerItemsGrid = document.getElementById('drawerItemsGrid');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const priceSortSelect = document.getElementById('priceSortSelect');

  function renderDrawerItems(items, sortOrder = 'default') {
    if (!drawerItemsGrid) return;

    if (isMenuLoading && allMenuData.length === 0) {
      drawerItemsGrid.innerHTML = `<div class="col-span-2 flex justify-center py-8">${getWalkingCatLoaderHtml('Fetching menu treats...', { compact: true })}</div>`;
      return;
    }

    const sorted = [...items];
    if (sortOrder === 'low-high') {
      sorted.sort((a, b) => parseNumericPrice(a.price) - parseNumericPrice(b.price));
    } else if (sortOrder === 'high-low') {
      sorted.sort((a, b) => parseNumericPrice(b.price) - parseNumericPrice(a.price));
    }

    if (sorted.length === 0) {
      drawerItemsGrid.innerHTML = '<p class="text-center text-gray-400 text-xs py-8 col-span-2">No items found in this category.</p>';
      return;
    }

    drawerItemsGrid.innerHTML = sorted.map((item) => `
      <div class="bg-brand-cream/60 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between hover:border-brand-turquoise transition-all">
        <div class="flex justify-between items-start gap-2 mb-1">
          <h4 class="font-heading font-bold text-gray-900 text-sm">${escapeHtml(item.name || '')}</h4>
          <span class="font-heading font-extrabold text-brand-orange text-sm whitespace-nowrap">${escapeHtml(item.price || '')}</span>
        </div>
        <p class="text-xs text-brand-muted leading-relaxed">${escapeHtml(item.description || '')}</p>
      </div>
    `).join('');
  }

  function showCategoryItems(category) {
    const filtered = allMenuData.filter(
      (item) => item.category && item.category.toLowerCase() === category.toLowerCase()
    );
    renderDrawerItems(filtered, priceSortSelect?.value || 'default');
  }

  menuBubbles.forEach((bubble) => {
    bubble.addEventListener('click', async () => {
      const category = bubble.getAttribute('data-category');
      activeCategory = category;
      logVisitorInteraction('menu_click', category);

      if (drawerCategoryTitle) drawerCategoryTitle.textContent = category;
      if (drawerCategoryIcon) drawerCategoryIcon.textContent = CATEGORY_ICONS[category] || '🍽️';

      if (menuDrawerContainer) {
        menuDrawerContainer.style.maxHeight = '1000px';
        menuDrawerContainer.style.opacity = '1';
        menuDrawerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (isMenuLoading && allMenuData.length === 0) {
        renderDrawerItems([], priceSortSelect?.value || 'default');
        await loadFrontendMenu();
        if (activeCategory !== category) return;
      }

      showCategoryItems(category);
    });
  });

  closeDrawerBtn?.addEventListener('click', () => {
    if (!menuDrawerContainer) return;
    menuDrawerContainer.style.maxHeight = '0';
    menuDrawerContainer.style.opacity = '0';
  });

  priceSortSelect?.addEventListener('change', () => {
    if (activeCategory) showCategoryItems(activeCategory);
  });

  // Events grid & modal lightbox delegation
  document.getElementById('eventsGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-event-index]');
    if (!card) return;
    const idx = Number(card.getAttribute('data-event-index'));
    if (!Number.isNaN(idx)) window.openEventModal(idx);
  });

  document.getElementById('modalEventContent')?.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox-url]');
    const url = trigger?.getAttribute('data-lightbox-url');
    if (url) window.openLightbox(url);
  });

  // Booking CTA tracking
  document.querySelectorAll('#reserveBtn, #footerBookBtn, #mobileReserveBtn').forEach((btn) => {
    btn?.addEventListener('click', (e) => {
      logVisitorInteraction('reservation_click', btn.id || 'Booking Button');
      if (btn.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        document.getElementById('cat-lounge')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});