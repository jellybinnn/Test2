<<<<<<< HEAD
// --- CONFIGURATION & SUPABASE INITIALIZATION ---
const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';

// --- CLOUDINARY CONFIG (used by the Cat Roster photo uploader) ---
// Create an UNSIGNED upload preset in Cloudinary (Settings > Upload > Upload presets)
// and paste its name below.
const CLOUDINARY_CLOUD_NAME = 'tfk63bnl';
const CLOUDINARY_UPLOAD_PRESET = ''; // e.g. 'hmc_cats_unsigned'

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase initialization error:", e);
}

// --- SMALL HELPERS ---
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- AUTHENTICATION CHECKER ---
document.addEventListener("DOMContentLoaded", () => {
  const isAuth = sessionStorage.getItem("hmc_admin_auth");
  if (isAuth !== "true") {
    document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
  } else {
    initAdminDashboard();
  }
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

function adminLogout() {
  sessionStorage.removeItem("hmc_admin_auth");
  location.reload();
}

function initAdminDashboard() {
  loadAdminMenu();
  loadAdminEvents();
  loadAdminCats();
}

// --- TAB SWITCHER ---
const TAB_ACTIVE_CLASS = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all cursor-pointer";
const TAB_INACTIVE_CLASS = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all cursor-pointer";

function switchTab(tab) {
  const tabs = {
    menu:   { section: "menuSection",   button: "navMenuBtn" },
    events: { section: "eventsSection", button: "navEventsBtn" },
    cats:   { section: "catsSection",   button: "navCatsBtn" }
  };

  Object.entries(tabs).forEach(([name, ids]) => {
    const section = document.getElementById(ids.section);
    const button = document.getElementById(ids.button);
    if (!section || !button) return;
    if (name === tab) {
      section.classList.remove("hidden");
      button.className = TAB_ACTIVE_CLASS;
    } else {
      section.classList.add("hidden");
      button.className = TAB_INACTIVE_CLASS;
    }
  });
}

// --- MENU MANAGER (SUPABASE) ---
let adminMenuList = [];

async function loadAdminMenu() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*').order('category');
    if (error) throw error;
    adminMenuList = data || [];
    renderAdminMenuTable();
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
      <td class="p-4 font-semibold text-brand-turquoise text-xs">${item.category}</td>
      <td class="p-4 font-bold text-white">${item.name}</td>
      <td class="p-4 text-brand-orange font-bold">${item.price}</td>
      <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${item.description || ''}</td>
      <td class="p-4 text-right space-x-2">
        <button onclick="editMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
        <button onclick="deleteMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
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
      const { error } = await supabaseClient
        .from('menu_items')
        .update({ category, name, price, description })
        .eq('id', id);
      if (error) throw error;
      alert("Menu item updated successfully!");
    } else {
      const { error } = await supabaseClient
        .from('menu_items')
        .insert([{ category, name, price, description }]);
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
  const item = adminMenuList.find(m => m.id == id);
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

// --- EVENTS MANAGER (SUPABASE WITH DIRECT CLOUDINARY URL LINK SUPPORT) ---
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
  } catch (err) {
    console.error("Error loading events:", err);
    adminEventsList = JSON.parse(localStorage.getItem("hmc_local_events") || "[]");
    renderAdminEventsTable();
  }
}

function renderAdminEventsTable() {
  const tbody = document.getElementById("eventsTableBody");
  const badge = document.getElementById("eventCountBadge");
  if (badge) badge.textContent = adminEventsList.length;
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
          <img src="${ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner'}" class="w-10 h-10 rounded-lg object-cover">
          <div>
            <span>${ev.title}</span>
            ${imgCount > 0 ? `<span class="block text-[10px] text-brand-turquoise font-semibold">+${imgCount} gallery photos</span>` : ''}
          </div>
        </td>
        <td class="p-4 text-brand-orange font-semibold text-xs">${ev.date}</td>
        <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${ev.description || ''}</td>
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

  // Convert comma-separated Cloudinary links into an array
  const imagesArray = galleryInput ? galleryInput.split(',').map(url => url.trim()).filter(Boolean) : [];

  const newEventObj = {
    title,
    date,
    image,
    description,
    images: imagesArray
  };

  if (supabaseClient) {
    try {
      if (index !== "" && adminEventsList[index]?.id) {
        const { error } = await supabaseClient
          .from('events')
          .update(newEventObj)
          .eq('id', adminEventsList[index].id);
        if (error) throw error;
        alert("Event updated successfully in Supabase!");
      } else {
        const { error } = await supabaseClient
          .from('events')
          .insert([newEventObj]);
        if (error) throw error;
        alert("Event saved successfully to Supabase!");
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
  if (index !== "") {
    adminEventsList[index] = newEventObj;
  } else {
    adminEventsList.unshift(newEventObj);
  }
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  alert("Event saved successfully!");
  renderAdminEventsTable();
}

function editEventItem(index) {
  const ev = adminEventsList[index];
  if (!ev) return;

  document.getElementById("editEventIndex").value = index;
  document.getElementById("eventFormTitle").value = ev.title || '';
  document.getElementById("eventFormDate").value = ev.date || '';
  document.getElementById("eventFormImage").value = ev.image || '';
  document.getElementById("eventFormDesc").value = ev.description || '';

  // Populate gallery input field with comma-separated URLs
  let galleryUrlsStr = "";
  if (Array.isArray(ev.images)) {
    galleryUrlsStr = ev.images.join(', ');
  } else if (typeof ev.images === 'string') {
    galleryUrlsStr = ev.images;
  }
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
    try {
      await supabaseClient.from('events').delete().eq('id', ev.id);
    } catch (err) {
      console.error("Error deleting from supabase:", err);
    }
  }
  adminEventsList.splice(index, 1);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  renderAdminEventsTable();
  alert("Event deleted.");
}

// --- CAT ROSTER MANAGER (SUPABASE + CLOUDINARY UPLOAD) ---
let adminCatsList = [];
let catUploadWidget = null;

async function loadAdminCats() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('cats')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    adminCatsList = data || [];
    renderAdminCatsTable();
  } catch (err) {
    console.error("Error loading cats:", err);
    const tbody = document.getElementById("catsTableBody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-rose-400 text-xs">Could not load the cat roster (${escapeHtml(err.message)}). Make sure the <code>cats</code> table exists in Supabase.</td></tr>`;
    }
  }
}

function renderAdminCatsTable() {
  const tbody = document.getElementById("catsTableBody");
  const badge = document.getElementById("catCountBadge");
  if (badge) badge.textContent = adminCatsList.length;
  if (!tbody) return;

  if (adminCatsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-gray-500 text-xs">No cats in the roster yet. Add your first one above!</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCatsList.map(cat => `
    <tr class="hover:bg-gray-800/50 transition-colors">
      <td class="p-4">
        <div class="flex items-center gap-3">
          <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-12 h-14 rounded-lg object-cover bg-gray-800">
          <span class="font-bold text-white">${escapeHtml(cat.name)}</span>
        </div>
      </td>
      <td class="p-4 text-gray-400 text-xs max-w-sm">${escapeHtml(cat.description)}</td>
      <td class="p-4 text-right space-x-2 whitespace-nowrap">
        <button onclick="editCat('${escapeHtml(cat.id)}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
        <button onclick="deleteCat('${escapeHtml(cat.id)}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
      </td>
    </tr>
  `).join("");
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
    alert("The Cloudinary upload widget failed to load. Check your internet connection, or paste a Cloudinary photo URL instead.");
    return;
  }
  if (!CLOUDINARY_UPLOAD_PRESET) {
    alert("Set CLOUDINARY_UPLOAD_PRESET at the top of admin.js to your unsigned Cloudinary upload preset name first. You can still paste a photo URL into the Photo URL field in the meantime.");
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
        maxFileSize: 10000000, // 10 MB
        cropping: true,
        croppingAspectRatio: 0.8, // 4:5 portrait, matches the roster cards
        showSkipCropButton: true
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          alert("Photo upload failed. Please try again.");
          return;
        }
        if (result && result.event === "success") {
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
  if (!supabaseClient) {
    alert("Supabase is not connected, so the cat can't be saved.");
    return;
  }

  const id = document.getElementById("editCatId").value;
  const name = document.getElementById("catFormName").value.trim();
  const description = document.getElementById("catFormDesc").value.trim();
  const image = document.getElementById("catFormImage").value.trim();

  if (!image) {
    alert("Please upload a photo (or paste a photo URL) before saving.");
    return;
  }

  const submitBtn = document.getElementById("catSubmitBtn");
  submitBtn.disabled = true;

  try {
    if (id) {
      const { error } = await supabaseClient
        .from('cats')
        .update({ name, description, image })
        .eq('id', id);
      if (error) throw error;
      alert("Cat updated successfully!");
    } else {
      const { error } = await supabaseClient
        .from('cats')
        .insert([{ name, description, image }]);
      if (error) throw error;
      alert("Cat added to the roster!");
    }
    resetCatForm();
    loadAdminCats();
  } catch (err) {
    console.error("Error saving cat:", err);
    alert("Error saving cat: " + err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

function editCat(id) {
  const cat = adminCatsList.find(c => String(c.id) === String(id));
  if (!cat) return;

  document.getElementById("editCatId").value = cat.id;
  document.getElementById("catFormName").value = cat.name || '';
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
    alert("Cat removed from the roster.");
    loadAdminCats();
  } catch (err) {
    console.error("Error deleting cat:", err);
    alert("Error deleting: " + err.message);
  }
}
=======
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

// --- AUTHENTICATION CHECKER ---
document.addEventListener("DOMContentLoaded", () => {
  const isAuth = sessionStorage.getItem("hmc_admin_auth");
  if (isAuth !== "true") {
    document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
  } else {
    initAdminDashboard();
  }
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

function adminLogout() {
  sessionStorage.removeItem("hmc_admin_auth");
  location.reload();
}

function initAdminDashboard() {
  loadAdminMenu();
  loadAdminEvents();
}

// --- TAB SWITCHER ---
function switchTab(tab) {
  const menuSec = document.getElementById("menuSection");
  const eventsSec = document.getElementById("eventsSection");
  const menuBtn = document.getElementById("navMenuBtn");
  const eventsBtn = document.getElementById("navEventsBtn");

  if (tab === 'menu') {
    menuSec.classList.remove("hidden");
    eventsSec.classList.add("hidden");
    menuBtn.className = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all cursor-pointer";
    eventsBtn.className = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all cursor-pointer";
  } else {
    eventsSec.classList.remove("hidden");
    menuSec.classList.add("hidden");
    eventsBtn.className = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all cursor-pointer";
    menuBtn.className = "px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all cursor-pointer";
  }
}

// --- MENU MANAGER (SUPABASE) ---
let adminMenuList = [];

async function loadAdminMenu() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*').order('category');
    if (error) throw error;
    adminMenuList = data || [];
    renderAdminMenuTable();
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
      <td class="p-4 font-semibold text-brand-turquoise text-xs">${item.category}</td>
      <td class="p-4 font-bold text-white">${item.name}</td>
      <td class="p-4 text-brand-orange font-bold">${item.price}</td>
      <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${item.description || ''}</td>
      <td class="p-4 text-right space-x-2">
        <button onclick="editMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
        <button onclick="deleteMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
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
      const { error } = await supabaseClient
        .from('menu_items')
        .update({ category, name, price, description })
        .eq('id', id);
      if (error) throw error;
      alert("Menu item updated successfully!");
    } else {
      const { error } = await supabaseClient
        .from('menu_items')
        .insert([{ category, name, price, description }]);
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
  const item = adminMenuList.find(m => m.id == id);
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

// --- EVENTS MANAGER (SUPABASE WITH DIRECT CLOUDINARY URL LINK SUPPORT) ---
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
  } catch (err) {
    console.error("Error loading events:", err);
    adminEventsList = JSON.parse(localStorage.getItem("hmc_local_events") || "[]");
    renderAdminEventsTable();
  }
}

function renderAdminEventsTable() {
  const tbody = document.getElementById("eventsTableBody");
  const badge = document.getElementById("eventCountBadge");
  if (badge) badge.textContent = adminEventsList.length;
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
          <img src="${ev.image || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner'}" class="w-10 h-10 rounded-lg object-cover">
          <div>
            <span>${ev.title}</span>
            ${imgCount > 0 ? `<span class="block text-[10px] text-brand-turquoise font-semibold">+${imgCount} gallery photos</span>` : ''}
          </div>
        </td>
        <td class="p-4 text-brand-orange font-semibold text-xs">${ev.date}</td>
        <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${ev.description || ''}</td>
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

  // Convert comma-separated Cloudinary links into an array
  const imagesArray = galleryInput ? galleryInput.split(',').map(url => url.trim()).filter(Boolean) : [];

  const newEventObj = {
    title,
    date,
    image,
    description,
    images: imagesArray
  };

  if (supabaseClient) {
    try {
      if (index !== "" && adminEventsList[index]?.id) {
        const { error } = await supabaseClient
          .from('events')
          .update(newEventObj)
          .eq('id', adminEventsList[index].id);
        if (error) throw error;
        alert("Event updated successfully in Supabase!");
      } else {
        const { error } = await supabaseClient
          .from('events')
          .insert([newEventObj]);
        if (error) throw error;
        alert("Event saved successfully to Supabase!");
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
  if (index !== "") {
    adminEventsList[index] = newEventObj;
  } else {
    adminEventsList.unshift(newEventObj);
  }
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  alert("Event saved successfully!");
  renderAdminEventsTable();
}

function editEventItem(index) {
  const ev = adminEventsList[index];
  if (!ev) return;

  document.getElementById("editEventIndex").value = index;
  document.getElementById("eventFormTitle").value = ev.title || '';
  document.getElementById("eventFormDate").value = ev.date || '';
  document.getElementById("eventFormImage").value = ev.image || '';
  document.getElementById("eventFormDesc").value = ev.description || '';

  // Populate gallery input field with comma-separated URLs
  let galleryUrlsStr = "";
  if (Array.isArray(ev.images)) {
    galleryUrlsStr = ev.images.join(', ');
  } else if (typeof ev.images === 'string') {
    galleryUrlsStr = ev.images;
  }
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
    try {
      await supabaseClient.from('events').delete().eq('id', ev.id);
    } catch (err) {
      console.error("Error deleting from supabase:", err);
    }
  }
  adminEventsList.splice(index, 1);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  renderAdminEventsTable();
  alert("Event deleted.");
}
>>>>>>> a149c4a62d65f19c50fd0dd88e369f6abb62da59
