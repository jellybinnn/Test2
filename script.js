// --- CONFIGURATION & SUPABASE INITIALIZATION ---
const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase initialization error:", e);
}

// --- DYNAMIC OPEN / CLOSE STATUS CHECKER ---
function updateStoreStatus() {
  const statusText = document.getElementById("statusText") || document.getElementById("cafeStatus");
  const statusDot = document.getElementById("statusDot");
  const statusBadge = document.getElementById("statusBadge") || document.getElementById("cafeStatus");
  const mobileStatusText = document.getElementById("mobileStatusText");
  const mobileStatusDot = document.getElementById("mobileStatusDot");

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinutes;

  const openTimeInMinutes = 9 * 60;  
  const closeTimeInMinutes = 21 * 60; 

  const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;

  if (isOpen) {
    if (statusText) statusText.textContent = "Open Now • Closes at 9:00 PM";
    if (statusDot) {
      statusDot.className = "status-dot w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse";
    }
    if (statusBadge) statusBadge.classList.remove("hidden");

    if (mobileStatusText) mobileStatusText.textContent = "Open Now";
    if (mobileStatusDot) mobileStatusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
  } else {
    if (statusText) statusText.textContent = "Closed Now • Opens at 9:00 AM";
    if (statusDot) {
      statusDot.className = "status-dot w-2.5 h-2.5 rounded-full bg-rose-400";
    }
    if (statusBadge) statusBadge.classList.remove("hidden");

    if (mobileStatusText) mobileStatusText.textContent = "Closed Now";
    if (mobileStatusDot) mobileStatusDot.className = "w-2 h-2 rounded-full bg-rose-400";
  }
}

// --- FETCH & RENDER MENU ITEMS FROM SUPABASE ---
let allMenuData = [];

async function loadFrontendMenu() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*');
    if (error) throw error;
    allMenuData = data || [];
  } catch (err) {
    console.error("Error fetching menu items:", err);
  }
}

// --- FETCH & RENDER EVENTS FROM SUPABASE (CHRONOLOGICAL SORTING) ---
async function loadFrontendEvents() {
  const eventsContainer = document.getElementById("eventsGrid");
  const eventCountBadge = document.getElementById("eventCountBadge");
  if (!eventsContainer) return;

  let events = [];
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('events').select('*');
      if (!error && data && data.length > 0) {
        events = data;
      }
    } catch (err) {
      console.error("Error fetching events from Supabase:", err);
    }
  }

  if (events.length === 0) {
    events = JSON.parse(localStorage.getItem("hmc_local_events") || "[]");
  }

  if (events.length === 0) {
    events = [
      {
        title: "Kapon event",
        date: "Aug 8, 2026",
        image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
        description: "Community spay and neuter (Kapon) outreach event.",
        images: []
      },
      {
        title: "HMC Anniversary 2026",
        date: "Aug 8, 2026",
        image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
        description: "Celebrating our official Hello Meow Cafe anniversary!",
        images: []
      },
      {
        title: "Apo Whang Od tattoo",
        date: "Oct 2-4, 2026",
        image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
        description: "Special event session with Apo Whang Od.",
        images: []
      },
      {
        title: "Wedding Booth",
        date: "March 8, 2026, Sept 23, 2026, Oct 12, 2026",
        image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
        description: "Hello Meow Cafe special wedding booth setup.",
        images: []
      }
    ];
  }

  function parseEventDate(dateStr) {
    if (!dateStr) return new Date(8640000000000); 
    let firstPart = dateStr.split(',')[0].trim();
    firstPart = firstPart.replace(/(\d+)\s*-\s*\d+/, '$1');
    const parsed = new Date(firstPart);
    return isNaN(parsed) ? new Date(8640000000000) : parsed;
  }

  events.sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));

  if (eventCountBadge) eventCountBadge.textContent = `${events.length} Upcoming Events`;

  eventsContainer.innerHTML = events.map(ev => {
    let galleryImages = [];
    if (Array.isArray(ev.images)) {
      galleryImages = ev.images;
    } else if (typeof ev.images === 'string' && ev.images.trim() !== '') {
      galleryImages = ev.images.split(',').map(s => s.trim()).filter(Boolean);
    }

    return `
      <div onclick='openEventModal(${JSON.stringify(ev).replace(/'/g, "&#39;")})' class="bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100 hover:shadow-soft transition-all flex flex-col justify-between cursor-pointer group">
        <div class="relative h-52 overflow-hidden">
          <img src="${ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner'}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-4 left-4 px-3.5 py-1 rounded-full text-xs font-bold bg-brand-orange text-white shadow-md uppercase tracking-wider">${ev.date}</span>
          ${galleryImages.length > 0 ? `<span class="absolute bottom-4 right-4 px-2.5 py-1 bg-brand-turquoise text-white text-[10px] font-bold rounded-full shadow-md">+${galleryImages.length} Photos</span>` : ''}
        </div>
        <div class="p-6 flex flex-col justify-between flex-grow">
          <div>
            <h3 class="font-heading font-bold text-xl text-gray-900 mb-2 group-hover:text-brand-turquoise transition-colors">${ev.title}</h3>
            <p class="text-xs text-brand-muted leading-relaxed line-clamp-2">${ev.description || ''}</p>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-brand-turquoise">
            <span>Click to view gallery & details →</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- LIGHTBOX MODAL CONTROLLERS ---
window.openEventModal = function(ev) {
  const modal = document.getElementById("eventDetailModal");
  const content = document.getElementById("modalEventContent");
  if (!modal || !content) return;

  let galleryImages = [];
  if (Array.isArray(ev.images)) {
    galleryImages = ev.images;
  } else if (typeof ev.images === 'string' && ev.images.trim() !== '') {
    galleryImages = ev.images.split(',').map(s => s.trim()).filter(Boolean);
  }

  content.innerHTML = `
    <div class="text-center sm:text-left">
      <span class="inline-block px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full mb-3">${ev.date}</span>
      <h2 class="font-heading font-extrabold text-2xl text-brand-dark mb-3">${ev.title}</h2>
      <p class="text-brand-muted text-sm leading-relaxed mb-6">${ev.description || ''}</p>
    </div>

    <div class="space-y-4">
      <h4 class="font-heading font-bold text-sm text-brand-dark uppercase tracking-wider">Event Banner & Gallery Photos</h4>
      <div class="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
        <img src="${ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner'}" class="w-full h-64 object-cover cursor-pointer" onclick="openLightbox('${ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner'}')">
      </div>
      
      ${galleryImages.length > 0 ? `
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
          ${galleryImages.map(imgUrl => `
            <div onclick="openLightbox('${imgUrl}')" class="block rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:opacity-90 transition-opacity aspect-square cursor-pointer">
              <img src="${imgUrl}" class="w-full h-full object-cover">
            </div>
          `).join('')}
        </div>
        <p class="text-[11px] text-gray-400 italic text-center">Click any thumbnail to view full size here.</p>
      ` : '<p class="text-xs text-gray-400 italic">No additional gallery photos uploaded for this event.</p>'}
    </div>
  `;

  modal.classList.remove("hidden");
};

window.closeEventModal = function() {
  const modal = document.getElementById("eventDetailModal");
  if (modal) modal.classList.add("hidden");
};

// --- INTERACTIVE UI LOGIC & INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);

  loadFrontendMenu();
  loadFrontendEvents();

  const header = document.getElementById("mainHeader");
  const handleScroll = () => {
    if (!header) return;
    if (window.scrollY > 30) {
      header.classList.add("bg-brand-dark/95", "backdrop-blur-md", "shadow-md", "py-3");
      header.classList.remove("bg-transparent", "py-4");
    } else {
      header.classList.remove("bg-brand-dark/95", "backdrop-blur-md", "shadow-md", "py-3");
      header.classList.add("bg-transparent", "py-4");
    }
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  const mobileToggle = document.getElementById("mobileMenuToggle");
  const mobileOverlay = document.getElementById("mobileMenuOverlay");
  const mobileDrawer = document.getElementById("mobileMenuDrawer");
  const mobileClose = document.getElementById("mobileMenuClose");

  function openMobileMenu() {
    if (mobileOverlay && mobileDrawer) {
      mobileOverlay.classList.remove("opacity-0", "pointer-events-none");
      mobileDrawer.classList.remove("translate-x-full");
    }
  }

  function closeMobileMenu() {
    if (mobileOverlay && mobileDrawer) {
      mobileOverlay.classList.add("opacity-0", "pointer-events-none");
      mobileDrawer.classList.add("translate-x-full");
    }
  }

  mobileToggle?.addEventListener("click", openMobileMenu);
  mobileClose?.addEventListener("click", closeMobileMenu);
  mobileOverlay?.addEventListener("click", (e) => {
    if (e.target === mobileOverlay) closeMobileMenu();
  });

  document.querySelectorAll(".mobile-nav-link, #mobileReserveBtn").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });

  const welcomePopup = document.getElementById("welcomePopup");
  const popupCard = document.getElementById("popupCard");
  const popupAboutBtn = document.getElementById("popupAboutBtn");

  setTimeout(() => {
    if (welcomePopup && popupCard) {
      welcomePopup.classList.remove("opacity-0", "pointer-events-none");
      popupCard.classList.remove("scale-90");
      popupCard.classList.add("scale-100");
    }
  }, 600);

  function closeWelcomePopup() {
    if (welcomePopup && popupCard) {
      welcomePopup.classList.add("opacity-0", "pointer-events-none");
      popupCard.classList.remove("scale-100");
      popupCard.classList.add("scale-90");
    }
  }

  welcomePopup?.addEventListener("click", (e) => {
    if (e.target === welcomePopup) closeWelcomePopup();
  });

  popupAboutBtn?.addEventListener("click", () => {
    closeWelcomePopup();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const menuBubbles = document.querySelectorAll(".menu-bubble");
  const menuDrawerContainer = document.getElementById("menuDrawerContainer");
  const drawerCategoryTitle = document.getElementById("drawerCategoryTitle");
  const drawerCategoryIcon = document.getElementById("drawerCategoryIcon");
  const drawerItemsGrid = document.getElementById("drawerItemsGrid");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const priceSortSelect = document.getElementById("priceSortSelect");

  let activeCategory = null;

  const categoryIcons = {
    "Must Try!": "⭐",
    "Dessert": "🍰",
    "Coffee": "☕",
    "Non-Coffee": "🧋",
    "Refreshment": "🍹",
    "Appetizers": "🍟",
    "Pasta": "🍝",
    "Sandwich": "🥪",
    "Rice Meal": "🍛",
    "Salad": "🥗",
    "Waffle": "🧇",
    "Ramen": "🍜",
    "Cocktails": "🍸"
  };

  function renderDrawerItems(items, sortOrder = "default") {
    if (!drawerItemsGrid) return;
    
    let sorted = [...items];
    if (sortOrder === "low-high") {
      sorted.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
    } else if (sortOrder === "high-low") {
      sorted.sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, '')));
    }

    if (sorted.length === 0) {
      drawerItemsGrid.innerHTML = '<p class="text-center text-gray-400 text-xs py-8 col-span-2">No items found in this category.</p>';
      return;
    }

    drawerItemsGrid.innerHTML = sorted.map(item => `
      <div class="bg-brand-cream/60 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between hover:border-brand-turquoise transition-all">
        <div class="flex justify-between items-start gap-2 mb-1">
          <h4 class="font-heading font-bold text-gray-900 text-sm">${item.name}</h4>
          <span class="font-heading font-extrabold text-brand-orange text-sm whitespace-nowrap">${item.price}</span>
        </div>
        <p class="text-xs text-brand-muted leading-relaxed">${item.description || ''}</p>
      </div>
    `).join("");
  }

  menuBubbles.forEach(bubble => {
    bubble.addEventListener("click", () => {
      const category = bubble.getAttribute("data-category");
      activeCategory = category;
      
      if (drawerCategoryTitle) drawerCategoryTitle.textContent = category;
      if (drawerCategoryIcon) drawerCategoryIcon.textContent = categoryIcons[category] || "🍽️";

      const filtered = allMenuData.filter(item => item.category && item.category.toLowerCase() === category.toLowerCase());
      renderDrawerItems(filtered, priceSortSelect?.value || "default");

      if (menuDrawerContainer) {
        menuDrawerContainer.style.maxHeight = "1000px";
        menuDrawerContainer.style.opacity = "1";
        menuDrawerContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  closeDrawerBtn?.addEventListener("click", () => {
    if (menuDrawerContainer) {
      menuDrawerContainer.style.maxHeight = "0";
      menuDrawerContainer.style.opacity = "0";
    }
  });

  priceSortSelect?.addEventListener("change", (e) => {
    if (!activeCategory) return;
    const filtered = allMenuData.filter(item => item.category && item.category.toLowerCase() === activeCategory.toLowerCase());
    renderDrawerItems(filtered, e.target.value);
  });

  document.querySelectorAll("#reserveBtn, #loungeReserveBtn, #footerBookBtn").forEach(btn => {
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("cat-lounge")?.scrollIntoView({ behavior: "smooth" });
    });
  });
});

// --- LIGHTBOX FULL IMAGE VIEWER ---
window.openLightbox = function(imgUrl) {
  let lb = document.getElementById("imgLightboxModal");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "imgLightboxModal";
    lb.className = "fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 cursor-pointer";
    lb.innerHTML = `<div class="relative max-w-4xl max-h-[90vh]"><button onclick="closeLightbox()" class="absolute -top-10 right-0 text-white font-bold text-2xl cursor-pointer">✕</button><img id="lightboxImg" src="" class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"></div>`;
    lb.onclick = (e) => { if (e.target === lb) closeLightbox(); };
    document.body.appendChild(lb);
  }
  document.getElementById("lightboxImg").src = imgUrl;
  lb.classList.remove("hidden");
};

window.closeLightbox = function() {
  const lb = document.getElementById("imgLightboxModal");
  if (lb) lb.classList.add("hidden");
};