const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';

const CLOUDINARY_CLOUD_NAME = 'tfk63bnl';
const CLOUDINARY_UPLOAD_PRESET = 'hmc_cats';

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase initialization error:", e);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener("DOMContentLoaded", async () => {
  const isAuth = sessionStorage.getItem("hmc_admin_auth");
  if (isAuth !== "true") {
    document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
    return;
  }
  initAdminDashboard();
});

function handleInternalLogin(e) {
  e.preventDefault();
  const pass = document.getElementById("internalPassword").value;
  if (pass === "hellomeow2026" || pass === "admin123" || pass === "hmcadmin") {
    sessionStorage.setItem("hmc_admin_auth", "true");
    document.getElementById("adminLoginOverlay")?.classList.add("hidden");
    initAdminDashboard();
  } else {
    document.getElementById("internalErrorMsg")?.classList.remove("hidden");
  }
}

async function adminLogout() {
  sessionStorage.removeItem("hmc_admin_auth");
  location.reload();
}

function initAdminDashboard() {
  loadAdminMenu();
  loadAdminEvents();
  loadAdminCats();
  loadAdminAnalytics();
}

let adminAnalyticsData = { visits: 0, interactions: 0 };

async function loadAdminAnalytics() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('analytics_logs').select('*');
    if (error) throw error;
    
    const logs = data || [];
    const visits = logs.filter(l => l.event_type === 'page_view').length;
    const interactions = logs.filter(l => l.event_type !== 'page_view').length;

    adminAnalyticsData = { visits, interactions };
    renderAdminChart();
  } catch (err) {
    console.error("Error loading analytics:", err);
  }
}

let adminStatsChart = null;

function renderAdminChart() {
  const ctx = document.getElementById('adminStatsChart');

  const menuCount = adminMenuList.length;
  const eventsCount = adminEventsList.length;
  const catsCount = adminCatsList.length;
  const totalVisits = adminAnalyticsData.visits;
  const totalInteractions = adminAnalyticsData.interactions;

  if (document.getElementById('statMenuCount')) document.getElementById('statMenuCount').textContent = menuCount;
  if (document.getElementById('statEventCount')) document.getElementById('statEventCount').textContent = eventsCount;
  if (document.getElementById('statCatCount')) document.getElementById('statCatCount').textContent = catsCount;
  if (document.getElementById('statTrafficCount')) document.getElementById('statTrafficCount').textContent = totalVisits.toLocaleString();
  if (document.getElementById('statInteractionCount')) document.getElementById('statInteractionCount').textContent = totalInteractions.toLocaleString();

  if (!ctx) return;

  if (adminStatsChart) {
    adminStatsChart.destroy();
  }

  adminStatsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Menu Items', 'Events', 'Cat Roster', 'Website Visits', 'Interactions'],
      datasets: [{
        label: 'Live Database & Traffic Metrics',
        data: [menuCount, eventsCount, catsCount, totalVisits, totalInteractions],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(20, 184, 166)',
          'rgb(168, 85, 247)',
          'rgb(52, 211, 153)',
          'rgb(236, 72, 153)'
        ],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', precision: 0 }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

const TAB_ACTIVE_CLASS = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all cursor-pointer";
const TAB_INACTIVE_CLASS = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all cursor-pointer";

function switchTab(tab) {
  const tabs = {
    menu:   { section: "menuSection",   button: "navMenuBtn" },
    events: { section: "eventsSection", button: "navEventsBtn" },
    cats:   { section: "catsSection",   button: "navCatsBtn" },
    graphs: { section: "graphsSection", button: "navGraphsBtn" }
  };

  Object.entries(tabs).forEach(([name, ids]) => {
    const section = document.getElementById(ids.section);
    const button = document.getElementById(ids.button);
    if (!section || !button) return;
    if (name === tab) {
      section.classList.remove("hidden");
      button.className = TAB_ACTIVE_CLASS;
      if (tab === 'graphs') {
        loadAdminAnalytics();
        renderAdminChart();
      }
    } else {
      section.classList.add("hidden");
      button.className = TAB_INACTIVE_CLASS;
    }
  });
}

let adminMenuList = [];

async function loadAdminMenu() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*').order('category');
    if (error) throw error;
    adminMenuList = data || [];
    renderAdminMenuTable();
    renderAdminChart();
  } catch (err) {
    console.error("Error loading menu:", err);
  }
}

function renderAdminMenuTable() {
  const tbody = document.getElementById("menuTableBody");
  const badge = document.getElementById("menuCountBadge");
  if (badge) badge.textContent = adminMenuList.length;
  if (!tbody) return;

  if (adminMenuList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs">No menu items found in Supabase.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminMenuList.map(item => `
    <tr class="hover:bg-gray-800/50 transition-colors">
      <td class="p-4 font-semibold text-brand-turquoise text-xs">${escapeHtml(item.category)}</td>
      <td class="p-4 font-bold text-white">${escapeHtml(item.name)}</td>
      <td class="p-4 text-brand-orange font-bold">${escapeHtml(item.price)}</td>
      <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${escapeHtml(item.description || '')}</td>
      <td class="p-4 text-right space-x-2">
        <button onclick="editMenuItem('${escapeHtml(item.id)}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
        <button onclick="deleteMenuItem('${escapeHtml(item.id)}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
      </td>
    </tr>
  `).join("");
}

async function handleMenuSubmit(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const id = document.getElementById("editMenuId").value;
  const category = document.getElementById("menuFormCategory").value;
  const name = document.getElementById("menuFormName").value;
  const price = document.getElementById("menuFormPrice").value;
  const description = document.getElementById("menuFormDesc").value;

  try {
    if (id) {
      const { error } = await supabaseClient.from('menu_items').update({ category, name, price, description }).eq('id', id);
      if (error) throw error;
      alert("Menu item updated successfully!");
    } else {
      const { error } = await supabaseClient.from('menu_items').insert([{ category, name, price, description }]);
      if (error) throw error;
      alert("Menu item added to Supabase successfully!");
    }
    resetMenuForm();
    loadAdminMenu();
  } catch (err) {
    console.error("Error saving menu item:", err);
    alert("Error saving menu item: " + err.message);
  }
}

function editMenuItem(id) {
  const item = adminMenuList.find(m => String(m.id) === String(id));
  if (!item) return;

  document.getElementById("editMenuId").value = item.id;
  document.getElementById("menuFormCategory").value = item.category || 'Must Try!';
  document.getElementById("menuFormName").value = item.name || '';
  document.getElementById("menuFormPrice").value = item.price || '';
  document.getElementById("menuFormDesc").value = item.description || '';

  document.getElementById("menuFormTitle").textContent = "✏️ Edit Menu Item";
  document.getElementById("menuSubmitBtn").textContent = "Update Supabase Record";
  document.getElementById("menuCancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetMenuForm() {
  document.getElementById("menuForm").reset();
  document.getElementById("editMenuId").value = "";
  document.getElementById("menuFormTitle").textContent = "➕ Add New Menu Item";
  document.getElementById("menuSubmitBtn").textContent = "Save to Supabase";
  document.getElementById("menuCancelEditBtn").classList.add("hidden");
}

async function deleteMenuItem(id) {
  if (!confirm("Are you sure you want to delete this menu item from Supabase?")) return;
  try {
    const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    alert("Menu item deleted.");
    loadAdminMenu();
  } catch (err) {
    console.error("Error deleting menu item:", err);
    alert("Error deleting: " + err.message);
  }
}

let adminEventsList = [];

async function loadAdminEvents() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('events').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      adminEventsList = data;
    } else {
      adminEventsList = JSON.parse(localStorage.getItem("hmc_local_events") || "[]");
    }
    renderAdminEventsTable();
    renderAdminChart();
  } catch (err) {
    console.error("Error loading events:", err);
    adminEventsList = JSON.parse(localStorage.getItem("hmc_local_events") || "[]");
    renderAdminEventsTable();
    renderAdminChart();
  }
}

function renderAdminEventsTable() {
  const tbody = document.getElementById("eventsTableBody");
  const navBadge = document.getElementById("navEventCountBadge");
  const tableBadge = document.getElementById("tableEventCountBadge");
  
  if (navBadge) navBadge.textContent = adminEventsList.length;
  if (tableBadge) tableBadge.textContent = adminEventsList.length;
  if (!tbody) return;

  if (adminEventsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 text-xs">No events found.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminEventsList.map((ev, index) => {
    let imgCount = 0;
    if (Array.isArray(ev.images)) imgCount = ev.images.length;
    else if (typeof ev.images === 'string' && ev.images.trim() !== '') imgCount = ev.images.split(',').length;

    return `
      <tr class="hover:bg-gray-800/50 transition-colors">
        <td class="p-4 font-bold text-white flex items-center gap-3">
          <img src="${escapeHtml(ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner')}" class="w-10 h-10 rounded-lg object-cover">
          <div>
            <span>${escapeHtml(ev.title)}</span>
            ${imgCount > 0 ? `<span class="block text-[10px] text-brand-turquoise font-semibold">+${imgCount} gallery photos</span>` : ''}
          </div>
        </td>
        <td class="p-4 text-brand-orange font-semibold text-xs">${escapeHtml(ev.date)}</td>
        <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${escapeHtml(ev.description || '')}</td>
        <td class="p-4 text-right space-x-2">
          <button onclick="editEventItem(${index})" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
          <button onclick="deleteEventItem(${index})" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const index = document.getElementById("editEventIndex").value;
  const title = document.getElementById("eventFormTitle").value;
  const date = document.getElementById("eventFormDate").value;
  const image = document.getElementById("eventFormImage").value || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner';
  const galleryInput = document.getElementById("eventFormGalleryUrls").value;
  const description = document.getElementById("eventFormDesc").value;

  const imagesArray = galleryInput ? galleryInput.split(',').map(url => url.trim()).filter(Boolean) : [];
  const newEventObj = { title, date, image, description, images: imagesArray };

  if (supabaseClient) {
    try {
      if (index !== "" && adminEventsList[index]?.id) {
        const { error } = await supabaseClient.from('events').update(newEventObj).eq('id', adminEventsList[index].id);
        if (error) throw error;
        alert("Event updated successfully!");
      } else {
        const { error } = await supabaseClient.from('events').insert([newEventObj]);
        if (error) throw error;
        alert("Event saved successfully!");
      }
      loadAdminEvents();
    } catch (err) {
      console.error("Supabase events error, saving locally:", err);
      saveEventLocally(newEventObj, index);
    }
  } else {
    saveEventLocally(newEventObj, index);
  }
  resetEventForm();
}

function saveEventLocally(newEventObj, index) {
  if (index !== "") adminEventsList[index] = newEventObj;
  else adminEventsList.unshift(newEventObj);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  alert("Event saved successfully!");
  renderAdminEventsTable();
  renderAdminChart();
}

function editEventItem(index) {
  const ev = adminEventsList[index];
  if (!ev) return;

  document.getElementById("editEventIndex").value = index;
  document.getElementById("eventFormTitle").value = ev.title || '';
  document.getElementById("eventFormDate").value = ev.date || '';
  document.getElementById("eventFormImage").value = ev.image || '';
  document.getElementById("eventFormDesc").value = ev.description || '';

  let galleryUrlsStr = "";
  if (Array.isArray(ev.images)) galleryUrlsStr = ev.images.join(', ');
  else if (typeof ev.images === 'string') galleryUrlsStr = ev.images;
  document.getElementById("eventFormGalleryUrls").value = galleryUrlsStr;

  document.getElementById("eventFormTitleText").textContent = "✏️ Edit Event";
  document.getElementById("eventSubmitBtn").textContent = "Update Event";
  document.getElementById("eventCancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEventForm() {
  document.getElementById("eventForm").reset();
  document.getElementById("editEventIndex").value = "";
  document.getElementById("eventFormTitleText").textContent = "➕ Add New Event";
  document.getElementById("eventSubmitBtn").textContent = "Save Event";
  document.getElementById("eventCancelEditBtn").classList.add("hidden");
}

async function deleteEventItem(index) {
  if (!confirm("Are you sure you want to delete this event?")) return;
  const ev = adminEventsList[index];
  if (supabaseClient && ev?.id) {
    try { await supabaseClient.from('events').delete().eq('id', ev.id); } catch (err) { console.error(err); }
  }
  adminEventsList.splice(index, 1);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  renderAdminEventsTable();
  renderAdminChart();
  alert("Event deleted.");
}

let adminCatsList = [];
let catUploadWidget = null;

async function loadAdminCats() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('cats').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    adminCatsList = data || [];
    renderAdminCatsTable();
    renderAdminChart();
  } catch (err) {
    console.error("Error loading cats from Supabase:", err);
  }
}

function renderAdminCatsTable() {
  const tbody = document.getElementById("catsTableBody");
  const badge = document.getElementById("catCountBadge");
  if (badge) badge.textContent = adminCatsList.length;
  if (!tbody) return;

  if (adminCatsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 text-xs">No cats in roster yet. Add one above!</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCatsList.map(cat => {
    const hasPhoto = cat.image && cat.image.trim() !== '';
    const thumbHtml = hasPhoto
      ? `<img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-12 h-14 rounded-lg object-cover bg-gray-800">`
      : `<div class="w-12 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-xl">🐱</div>`;

    return `
      <tr class="hover:bg-gray-800/50 transition-colors">
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${thumbHtml}
            <span class="font-bold text-white">${escapeHtml(cat.name)}</span>
          </div>
        </td>
        <td class="p-4 text-brand-turquoise text-xs font-semibold">${escapeHtml(cat.category || 'Resident')}</td>
        <td class="p-4 text-gray-400 text-xs max-w-sm">${escapeHtml(cat.description)}</td>
        <td class="p-4 text-right space-x-2 whitespace-nowrap">
          <button onclick="previewCat('${escapeHtml(cat.id)}')" class="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 text-xs font-bold transition-colors cursor-pointer">Preview</button>
          <button onclick="editCat('${escapeHtml(cat.id)}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
          <button onclick="deleteCat('${escapeHtml(cat.id)}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateCatPhotoPreview(url) {
  const img = document.getElementById("catPhotoPreview");
  const placeholder = document.getElementById("catPhotoPlaceholder");
  if (!img || !placeholder) return;
  if (url && url.trim() !== "") {
    img.src = url.trim();
    img.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }
}

function openCatUploadWidget() {
  if (!window.cloudinary) {
    alert("Cloudinary widget failed to load.");
    return;
  }
  if (!catUploadWidget) {
    catUploadWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFiles: 1,
        folder: 'hmc_cats',
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 10000000,
        cropping: true,
        croppingAspectRatio: 0.8,
        showSkipCropButton: true
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          document.getElementById("catFormImage").value = url;
          updateCatPhotoPreview(url);
        }
      }
    );
  }
  catUploadWidget.open();
}

async function handleCatSubmit(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const id = document.getElementById("editCatId").value;
  const name = document.getElementById("catFormName").value.trim();
  const category = document.getElementById("catFormCategory").value;
  const description = document.getElementById("catFormDesc").value.trim();
  const image = document.getElementById("catFormImage").value.trim();

  try {
    if (id) {
      const { error } = await supabaseClient.from('cats').update({ name, category, description, image }).eq('id', id);
      if (error) throw error;
      alert("Cat updated successfully!");
    } else {
      const { error } = await supabaseClient.from('cats').insert([{ name, category, description, image }]);
      if (error) throw error;
      alert("Cat added to the roster!");
    }
    resetCatForm();
    loadAdminCats();
  } catch (err) {
    console.error("Error saving cat:", err);
    alert("Error saving cat: " + err.message);
  }
}

function editCat(id) {
  const cat = adminCatsList.find(c => String(c.id) === String(id));
  if (!cat) return;

  document.getElementById("editCatId").value = cat.id;
  document.getElementById("catFormName").value = cat.name || '';
  document.getElementById("catFormCategory").value = cat.category || 'The British Shorthair Family';
  document.getElementById("catFormDesc").value = cat.description || '';
  document.getElementById("catFormImage").value = cat.image || '';
  updateCatPhotoPreview(cat.image || '');

  document.getElementById("catFormTitleText").textContent = "✏️ Edit Cat";
  document.getElementById("catSubmitBtn").textContent = "Update Cat";
  document.getElementById("catCancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetCatForm() {
  document.getElementById("catForm").reset();
  document.getElementById("editCatId").value = "";
  updateCatPhotoPreview("");
  document.getElementById("catFormTitleText").textContent = "➕ Add Cat to Roster";
  document.getElementById("catSubmitBtn").textContent = "Save Cat";
  document.getElementById("catCancelEditBtn").classList.add("hidden");
}

async function deleteCat(id) {
  if (!confirm("Remove this cat from the roster?")) return;
  try {
    const { error } = await supabaseClient.from('cats').delete().eq('id', id);
    if (error) throw error;
    alert("Cat removed.");
    loadAdminCats();
  } catch (err) {
    console.error("Error deleting cat:", err);
  }
}

const SPONSOR_URL = 'https://www.facebook.com/hellomeowcafe';
let previewLastTrigger = null;

function previewCat(id) {
  const cat = adminCatsList.find(c => String(c.id) === String(id));
  if (!cat) return;
  openCatPreview(cat, document.activeElement);
}

function previewCatFromForm() {
  const name = document.getElementById("catFormName").value.trim();
  const category = document.getElementById("catFormCategory").value;
  const description = document.getElementById("catFormDesc").value.trim();
  const image = document.getElementById("catFormImage").value.trim();
  if (!name) {
    alert("Add a name first.");
    return;
  }
  openCatPreview({ name, category, description, image }, document.activeElement);
}

function openCatPreview(cat, trigger) {
  const sheet = document.getElementById("catProfileSheet");
  const body = document.getElementById("catSheetBody");
  if (!sheet || !body) return;

  const displayImg = (cat.image && cat.image.trim() !== '') ? cat.image : 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_logo';
  const displayCat = cat.category || 'The British Shorthair Family';

  body.innerHTML = `
    <p class="text-xs font-semibold text-gray-500 mb-4 pr-12">Preview: how visitors see ${escapeHtml(cat.name)}</p>
    <div class="flex gap-4 items-start">
      <img src="${escapeHtml(displayImg)}" alt="${escapeHtml(cat.name)}" class="w-32 shrink-0 aspect-[4/5] object-cover rounded-2xl bg-gray-100">
      <div class="pt-2 pr-2 min-w-0">
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-brand-turquoise-light text-brand-dark text-xs font-bold mb-1.5">${escapeHtml(displayCat)}</span>
        <h3 class="font-bold text-2xl text-gray-900 leading-tight break-words">${escapeHtml(cat.name)}</h3>
      </div>
    </div>
    <p class="mt-5 text-base text-gray-700 leading-relaxed">${escapeHtml(cat.description)}</p>
    <a href="${SPONSOR_URL}" target="_blank" rel="noopener noreferrer" class="mt-6 flex items-center justify-center py-3.5 rounded-2xl bg-brand-orange text-white font-bold text-base hover:bg-orange-600 transition-colors">
      Sponsor ${escapeHtml(cat.name)}
    </a>
  `;

  previewLastTrigger = trigger || null;
  sheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeCatPreview() {
  const sheet = document.getElementById("catProfileSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.classList.add("hidden");
  document.body.style.overflow = "";
  if (previewLastTrigger) previewLastTrigger.focus();
  previewLastTrigger = null;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-sheet-close]") || e.target.hasAttribute("data-sheet-backdrop")) closeCatPreview();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCatPreview();
});