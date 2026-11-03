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
