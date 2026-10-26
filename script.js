const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase init error:", e);
}

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Operating Status ---
  try {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 9 && hour < 21;
    const dotClass = isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500';
    const textVal = isOpen ? 'Open Now • Closes 9 PM' : 'Closed • Opens 9 AM';

    const sDot = document.getElementById('statusDot');
    const sText = document.getElementById('statusText');
    if (sDot && sText) {
      sDot.className = `status-dot w-2.5 h-2.5 rounded-full ${dotClass}`;
      sText.textContent = textVal;
    }

    const mDot = document.getElementById('mobileStatusDot');
    const mText = document.getElementById('mobileStatusText');
    const mBadge = document.getElementById('mobileStatusBadge');
    if (mDot && mText) {
      mDot.className = `w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`;
      mText.textContent = isOpen ? 'Open Now' : 'Closed';
      if (mBadge) {
        mBadge.className = `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`;
      }
    }
  } catch (e) {
    console.error("Status error:", e);
  }

  // --- 2. Welcome Popup Controls ---
  try {
    const popup = document.getElementById('welcomePopup');
    const card = document.getElementById('popupCard');
    const popupAboutBtn = document.getElementById('popupAboutBtn');
    const popupLinks = document.querySelectorAll('.popup-link');

    if (popup && card) {
      setTimeout(() => {
        popup.classList.remove('opacity-0', 'pointer-events-none');
        popup.classList.add('opacity-100');
        card.classList.remove('scale-90');
        card.classList.add('scale-100');
      }, 300);
    }

    function closeWelcomePopup() {
      if (popup && card) {
        popup.classList.remove('opacity-100');
        popup.classList.add('opacity-0', 'pointer-events-none');
        card.classList.remove('scale-100');
        card.classList.add('scale-90');
      }
      const heroVideo = document.getElementById('heroGif');
      if (heroVideo) {
        heroVideo.load();
        heroVideo.play().catch(() => {});
      }
    }

    popup?.addEventListener('click', (e) => {
      if (e.target.id === 'welcomePopup') closeWelcomePopup();
    });

    popupAboutBtn?.addEventListener('click', () => {
      closeWelcomePopup();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    popupLinks.forEach(link => {
      link.addEventListener('click', closeWelcomePopup);
    });

    document.addEventListener('click', () => {
      const heroVideo = document.getElementById('heroGif');
      if (heroVideo && heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }
    }, { once: true });
  } catch (e) {
    console.error("Popup error:", e);
  }

  // --- 3. Menu Data, Caching & Supabase Fetching ---
  let menuData = {
    'Must Try!': [],
    'Dessert': [],
    'Coffee': [],
    'Non-Coffee': [],
    'Refreshment': [],
    'Appetizers': [],
    'Pasta': [],
    'Sandwich': [],
    'Rice Meal': [],
    'Salad': [],
    'Waffle': [],
    'Ramen': [],
    'Cocktails': []
  };
  let activeCategory = null;

  // Load from LocalStorage first for instant rendering
  const cachedMenu = localStorage.getItem('hmc_menu_cache');
  if (cachedMenu) {
    try {
      menuData = JSON.parse(cachedMenu);
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  async function fetchMenuItemsFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('menu_items').select('*');
      if (error) {
        console.error('Supabase fetch error:', error);
        return;
      }
      if (data && data.length > 0) {
        Object.keys(menuData).forEach(cat => { menuData[cat] = []; });
        data.forEach(item => {
          if (menuData[item.category]) {
            menuData[item.category].push({
              name: item.name,
              price: item.price,
              desc: item.description || ''
            });
          }
        });
        
        // Save fresh data to localStorage
        localStorage.setItem('hmc_menu_cache', JSON.stringify(menuData));

        if (activeCategory) renderCategoryItems();
      }
    } catch (err) {
      console.error('Fetch connection error:', err);
    }
  }
  fetchMenuItemsFromSupabase();

  function parsePrice(priceStr) {
    return parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) || 0;
  }

  function renderCategoryItems() {
    if (!activeCategory) return;
    const drawerGrid = document.getElementById('drawerItemsGrid');
    const sortValue = document.getElementById('priceSortSelect')?.value || 'default';
    let items = [...(menuData[activeCategory] || [])];

    if (sortValue === 'low-high') {
      items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortValue === 'high-low') {
      items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    if (!drawerGrid) return;
    drawerGrid.innerHTML = '';
    
    if (items.length === 0) {
      drawerGrid.innerHTML = '<p class="text-brand-muted text-sm col-span-2 py-4 text-center">No items listed in this category yet.</p>';
    } else {
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-brand-cream/60 border border-gray-100 flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start gap-2 mb-1">
              <h4 class="font-heading font-bold text-sm text-brand-dark">${item.name}</h4>
              <span class="font-heading font-extrabold text-xs text-brand-orange bg-brand-orange-light px-2.5 py-1 rounded-full whitespace-nowrap">${item.price}</span>
            </div>
            <p class="text-xs text-brand-muted leading-relaxed">${item.desc}</p>
          </div>
        `;
        drawerGrid.appendChild(card);
      });
    }
  }

  function selectCategory(categoryName) {
    const bubbles = document.querySelectorAll('.menu-bubble');
    const drawerContainer = document.getElementById('menuDrawerContainer');
    const drawerTitle = document.getElementById('drawerCategoryTitle');
    const drawerIcon = document.getElementById('drawerCategoryIcon');
    const sortSelect = document.getElementById('priceSortSelect');

    if (activeCategory === categoryName) {
      closeMenuDrawer();
      return;
    }

    activeCategory = categoryName;
    if (sortSelect) sortSelect.value = 'default';

    bubbles.forEach(bubble => {
      const catVal = bubble.getAttribute('data-category');
      if (catVal === categoryName) {
        bubble.className = 'menu-bubble group p-5 rounded-2xl bg-brand text-white shadow-md hover:shadow-lg transition-all text-center flex flex-col items-center justify-center gap-2 border border-transparent';
      } else {
        bubble.className = 'menu-bubble group p-5 rounded-2xl bg-white text-brand-dark shadow-card hover:shadow-soft hover:border-brand-turquoise transition-all text-center flex flex-col items-center justify-center gap-2 border border-gray-100';
      }
    });

    let currentEmoji = '🍽️';
    bubbles.forEach(b => {
      if (b.getAttribute('data-category') === categoryName) {
        currentEmoji = b.querySelector('span:first-child').textContent;
      }
    });

    if (drawerTitle) drawerTitle.textContent = categoryName;
    if (drawerIcon) drawerIcon.textContent = currentEmoji;

    renderCategoryItems();

    if (drawerContainer) {
      drawerContainer.classList.remove('max-h-0', 'opacity-0');
      drawerContainer.classList.add('max-h-[800px]', 'opacity-100');
      setTimeout(() => {
        drawerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }

  function closeMenuDrawer() {
    const drawerContainer = document.getElementById('menuDrawerContainer');
    const bubbles = document.querySelectorAll('.menu-bubble');
    if (drawerContainer) {
      drawerContainer.classList.remove('max-h-[800px]', 'opacity-100');
      drawerContainer.classList.add('max-h-0', 'opacity-0');
    }
    activeCategory = null;
    bubbles.forEach(bubble => {
      bubble.className = 'menu-bubble group p-5 rounded-2xl bg-white text-brand-dark shadow-card hover:shadow-soft hover:border-brand-turquoise transition-all text-center flex flex-col items-center justify-center gap-2 border border-gray-100';
    });
  }

  document.querySelectorAll('.menu-bubble').forEach(button => {
    button.addEventListener('click', () => {
      selectCategory(button.getAttribute('data-category'));
    });
  });

  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeMenuDrawer);
  document.getElementById('priceSortSelect')?.addEventListener('change', renderCategoryItems);

  // --- 4. Events Gallery with Clickable Photo Albums ---
  try {
    const defaultEvents = [
      {
        title: "Paws & Coffee Meetup",
        date: "September 20, 2026",
        image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
        description: "A wonderful afternoon gathering with local cat parents, sharing tips on feline wellness and enjoying fresh artisanal brews.",
        photos: [
          "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
          "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_logo",
          "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner"
        ]
      }
    ];

    const grid = document.getElementById('eventsGrid');
    const badge = document.getElementById('eventCountBadge');
    if (badge) badge.textContent = `${defaultEvents.length} Events Displayed`;

    if (grid) {
      grid.innerHTML = '';
      defaultEvents.forEach((ev) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100 flex flex-col justify-between group hover:shadow-soft transition-all cursor-pointer';
        card.innerHTML = `
          <div>
            <div class="relative h-56 overflow-hidden bg-gray-100">
              <img src="${ev.image}" loading="lazy" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <span class="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">${ev.date}</span>
              <span class="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-brand/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                <span>📸</span> View Album (${ev.photos.length})
              </span>
            </div>
            <div class="p-6">
              <h3 class="font-heading font-bold text-xl text-brand-dark mb-2">${ev.title}</h3>
              <p class="text-xs text-brand-muted leading-relaxed">${ev.description}</p>
            </div>
          </div>
          <div class="px-6 pb-6 pt-2 flex justify-between items-center border-t border-gray-50">
            <span class="text-[11px] font-bold text-brand-turquoise uppercase">Click to open photo album</span>
          </div>
        `;

        card.addEventListener('click', () => {
          openEventAlbumModal(ev);
        });

        grid.appendChild(card);
      });
    }

    function openEventAlbumModal(ev) {
      const modal = document.getElementById('actionModal');
      const modalContentWrapper = document.getElementById('modalContentWrapper');
      const modalBody = document.getElementById('modalBody');
      if (!modal || !modalBody || !modalContentWrapper) return;

      let photoGridHTML = ev.photos.map(photo => `
        <div class="rounded-2xl overflow-hidden shadow-sm h-48 bg-gray-100 group">
          <img src="${photo}" loading="lazy" alt="Album photo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
      `).join('');

      modalBody.innerHTML = `
        <div class="mb-4">
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-brand-turquoise-light text-brand">${ev.date}</span>
          <h2 class="font-heading font-extrabold text-2xl text-brand-dark mt-2 mb-2">${ev.title}</h2>
          <p class="text-sm text-brand-muted mb-6">${ev.description}</p>
        </div>
        <h4 class="font-heading font-bold text-sm text-brand-dark mb-3 uppercase tracking-wider">Event Photo Album (${ev.photos.length} Photos)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          ${photoGridHTML}
        </div>
      `;

      modal.classList.remove('opacity-0', 'pointer-events-none');
      modalContentWrapper.classList.remove('scale-95');
    }
  } catch (e) {
    console.error("Events error:", e);
  }

  // --- 5. Mobile Nav & Header Scroll ---
  try {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobileDrawer = document.getElementById('mobileMenuDrawer');
    const mobileClose = document.getElementById('mobileMenuClose');
    const mainHeader = document.getElementById('mainHeader');

    function toggleMobileMenu(open) {
      if (open) {
        mobileOverlay?.classList.remove('opacity-0', 'pointer-events-none');
        mobileDrawer?.classList.remove('translate-x-full');
      } else {
        mobileOverlay?.classList.add('opacity-0', 'pointer-events-none');
        mobileDrawer?.classList.add('translate-x-full');
      }
    }

    mobileToggle?.addEventListener('click', () => toggleMobileMenu(true));
    mobileClose?.addEventListener('click', () => toggleMobileMenu(false));
    mobileOverlay?.addEventListener('click', (e) => {
      if (e.target === mobileOverlay) toggleMobileMenu(false);
    });

    document.querySelectorAll('.mobile-nav-link, #mobileReserveBtn').forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    window.addEventListener('scroll', () => {
      if (!mainHeader) return;
      const logoTitle = mainHeader.querySelector('.logo-title');
      const logoSub = mainHeader.querySelector('.logo-subtitle');
      const navLinks = mainHeader.querySelectorAll('nav a');

      if (window.scrollY > 50) {
        mainHeader.classList.add('bg-white/95', 'shadow-md', 'py-3', 'backdrop-blur-md');
        mainHeader.classList.remove('bg-transparent', 'py-4');
        if (logoTitle) logoTitle.className = 'logo-title text-brand-dark';
        if (logoSub) logoSub.className = 'logo-subtitle text-brand-turquoise';
        navLinks.forEach(link => {
          link.className = 'hover:text-brand-turquoise transition-colors font-semibold text-sm text-brand-dark';
        });
      } else {
        mainHeader.classList.remove('bg-white/95', 'shadow-md', 'py-3', 'backdrop-blur-md');
        mainHeader.classList.add('bg-transparent', 'py-4');
        if (logoTitle) logoTitle.className = 'logo-title text-white drop-shadow-sm';
        if (logoSub) logoSub.className = 'logo-subtitle text-brand-turquoise-light drop-shadow-sm';
        navLinks.forEach(link => {
          link.className = 'hover:text-brand-turquoise-light transition-colors drop-shadow-sm font-semibold text-sm text-gray-200';
        });
      }
    });
  } catch (e) {
    console.error("Navigation error:", e);
  }

  // --- 6. Action Modal Controls ---
  try {
    const modal = document.getElementById('actionModal');
    const modalContentWrapper = document.getElementById('modalContentWrapper');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.getElementById('closeModalBtn');

    function openModal(type) {
      if (!modal || !modalBody || !modalContentWrapper) return;
      let content = '';
      if (type === 'visit') {
        content = `
          <h2 class="font-heading font-extrabold text-2xl text-brand-dark mb-3">Cat Lounge Reservation</h2>
          <p class="text-sm text-brand-muted mb-6">Come relax with our friendly rescue cats! Walk-ins are welcome, but reservations guarantee your slot.</p>
          <div class="space-y-4 text-left bg-brand-cream p-4 rounded-2xl mb-6">
            <div class="flex justify-between text-sm"><span class="font-bold text-brand-dark">Status:</span> <span class="text-brand-turquoise font-semibold">Walk-ins &amp; Reservations Welcome</span></div>
            <div class="flex justify-between text-sm"><span class="font-bold text-brand-dark">Hours:</span> <span class="text-brand-muted">9:00 AM – 9:00 PM Daily</span></div>
          </div>
          <a href="https://www.facebook.com/hellomeowcafe" target="_blank" class="w-full py-3.5 rounded-xl bg-brand-orange text-white font-heading font-bold uppercase text-sm tracking-wider block shadow-lg shadow-brand-orange/30 hover:bg-brand-orange-hover transition-all text-center">
            Visit Facebook Page
          </a>
        `;
      }
      modalBody.innerHTML = content;
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modalContentWrapper.classList.remove('scale-95');
    }

    function closeModal() {
      if (!modal || !modalContentWrapper) return;
      modal.classList.add('opacity-0', 'pointer-events-none');
      modalContentWrapper.classList.add('scale-95');
    }

    document.getElementById('reserveBtn')?.addEventListener('click', () => openModal('visit'));
    document.getElementById('loungeReserveBtn')?.addEventListener('click', () => openModal('visit'));
    document.getElementById('footerBookBtn')?.addEventListener('click', () => openModal('visit'));

    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  } catch (e) {
    console.error("Modal error:", e);
  }
});
