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

let supabaseMenuData = [];

// --- INTERNAL LOGIN GATEKEEPER ---
const ADMIN_SECRET_KEY = "hellomeow2026"; // You can change your password here

document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("adminLoginOverlay");
  if (localStorage.getItem("hmc_admin_auth") !== "true") {
    loginOverlay?.classList.remove("hidden");
  }
});

function handleInternalLogin(e) {
  e.preventDefault();
  const pass = document.getElementById("internalPassword").value;
  const errorDiv = document.getElementById("internalErrorMsg");
  const loginOverlay = document.getElementById("adminLoginOverlay");

  if (pass === ADMIN_SECRET_KEY) {
    localStorage.setItem("hmc_admin_auth", "true");
    loginOverlay?.classList.add("hidden");
    document.getElementById("internalPassword").value = "";
    errorDiv.classList.add("hidden");
  } else {
    errorDiv.classList.remove("hidden");
    document.getElementById("internalPassword").value = "";
  }
}

function adminLogout() {
  localStorage.removeItem("hmc_admin_auth");
  location.reload(); // Reloads page and brings up the login prompt again
}

// Tab Switcher
function switchTab(tab) {
  const menuSec = document.getElementById('menuSection');
  const eventsSec = document.getElementById('eventsSection');
  const menuBtn = document.getElementById('navMenuBtn');
  const eventsBtn = document.getElementById('navEventsBtn');

  if (tab === 'menu') {
    menuSec.classList.remove('hidden');
    eventsSec.classList.add('hidden');
    menuBtn.className = 'px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all';
    eventsBtn.className = 'px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all';
  } else {
    eventsSec.classList.remove('hidden');
    menuSec.classList.add('hidden');
    eventsBtn.className = 'px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-brand-orange text-white shadow-md transition-all';
    menuBtn.className = 'px-5 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all';
  }
}

// --- SUPABASE MENU CRUD LOGIC ---
async function fetchMenuFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*');
    if (error) {
      console.error('Error fetching menu items:', error);
      return;
    }
    supabaseMenuData = data || [];
    renderMenuTable();
  } catch (err) {
    console.error('Unexpected connection error:', err);
  }
}

function renderMenuTable() {
  const tbody = document.getElementById('menuTableBody');
  const countBadge = document.getElementById('menuCountBadge');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (countBadge) countBadge.textContent = supabaseMenuData.length;

  if (supabaseMenuData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs">No menu items found in Supabase.</td></tr>';
    return;
  }

  supabaseMenuData.forEach((item) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-800/50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 text-xs font-bold text-brand-turquoise">${item.category}</td>
      <td class="p-4 text-xs font-semibold text-white">${item.name}</td>
      <td class="p-4 text-xs text-brand-orange font-bold">${item.price}</td>
      <td class="p-4 text-xs text-gray-300 max-w-xs truncate">${item.description || ''}</td>
      <td class="p-4 text-right whitespace-nowrap">
        <button onclick="editMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-brand-turquoise/20 text-brand-turquoise hover:bg-brand-turquoise/30 text-xs font-bold mr-1.5 transition-colors">Edit</button>
        <button onclick="deleteMenuItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleMenuSubmit(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const id = document.getElementById('editMenuId').value;
  const category = document.getElementById('menuFormCategory').value;
  const name = document.getElementById('menuFormName').value.trim();
  const price = document.getElementById('menuFormPrice').value.trim();
  const description = document.getElementById('menuFormDesc').value.trim();

  try {
    if (id) {
      // Update existing item
      const { error } = await supabaseClient
        .from('menu_items')
        .update({ category, name, price, description })
        .eq('id', id);

      if (error) throw error;
      alert('Menu item updated successfully in Supabase!');
    } else {
      // Insert new item
      const { error } = await supabaseClient
        .from('menu_items')
        .insert([{ category, name, price, description }]);

      if (error) throw error;
      alert('Menu item added successfully to Supabase!');
    }

    resetMenuForm();
    fetchMenuFromSupabase();
  } catch (err) {
    console.error('Error saving menu item:', err);
    alert('Failed to save menu item. Check console for details.');
  }
}

function editMenuItem(id) {
  const item = supabaseMenuData.find(i => i.id == id);
  if (!item) return;

  document.getElementById('editMenuId').value = item.id;
  document.getElementById('menuFormCategory').value = item.category;
  document.getElementById('menuFormName').value = item.name;
  document.getElementById('menuFormPrice').value = item.price;
  document.getElementById('menuFormDesc').value = item.description || '';

  document.getElementById('menuFormTitle').textContent = '✏️ Edit Menu Item';
  document.getElementById('menuSubmitBtn').textContent = 'Update in Supabase';
  document.getElementById('menuCancelEditBtn').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteMenuItem(id) {
  if (!supabaseClient) return;
  if (confirm('Are you sure you want to delete this menu item from Supabase?')) {
    try {
      const { error } = await supabaseClient
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMenuFromSupabase();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      alert('Failed to delete item.');
    }
  }
}

function resetMenuForm() {
  document.getElementById('menuForm').reset();
  document.getElementById('editMenuId').value = '';
  document.getElementById('menuFormTitle').textContent = '➕ Add New Menu Item';
  document.getElementById('menuSubmitBtn').textContent = 'Save to Supabase';
  document.getElementById('menuCancelEditBtn').classList.add('hidden');
}


// --- LOCAL EVENTS MANAGER (LocalStorage) ---
let eventsData = JSON.parse(localStorage.getItem('hmc_events_complete_v3')) || [
  {
    title: "Paws & Coffee Meetup",
    date: "September 20, 2026",
    image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
    description: "A wonderful afternoon gathering with local cat parents."
  }
];

function saveEvents() {
  localStorage.setItem('hmc_events_complete_v3', JSON.stringify(eventsData));
  renderEventsTable();
}

function renderEventsTable() {
  const tbody = document.getElementById('eventsTableBody');
  const countBadge = document.getElementById('eventCountBadge');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (countBadge) countBadge.textContent = eventsData.length;

  eventsData.forEach((ev, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-800/50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 text-xs font-semibold text-white">${ev.title}</td>
      <td class="p-4 text-xs text-brand-orange font-bold">${ev.date}</td>
      <td class="p-4 text-xs text-gray-300 max-w-xs truncate">${ev.description}</td>
      <td class="p-4 text-right whitespace-nowrap">
        <button onclick="editEventItem(${index})" class="px-3 py-1.5 rounded-lg bg-brand-turquoise/20 text-brand-turquoise hover:bg-brand-turquoise/30 text-xs font-bold mr-1.5 transition-colors">Edit</button>
        <button onclick="deleteEventItem(${index})" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleEventSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('eventFormTitle').value.trim();
  const date = document.getElementById('eventFormDate').value.trim();
  const image = document.getElementById('eventFormImage').value.trim() || 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner';
  const description = document.getElementById('eventFormDesc').value.trim();
  const editIndex = document.getElementById('editEventIndex').value;

  if (editIndex !== "") {
    eventsData[parseInt(editIndex)] = { title, date, image, description };
  } else {
    eventsData.push({ title, date, image, description });
  }

  saveEvents();
    resetEventForm();
}

function editEventItem(index) {
  const ev = eventsData[index];
  document.getElementById('eventFormTitle').value = ev.title;
  document.getElementById('eventFormDate').value = ev.date;
  document.getElementById('eventFormImage').value = ev.image;
  document.getElementById('eventFormDesc').value = ev.description;
  document.getElementById('editEventIndex').value = index;

  document.getElementById('eventFormTitleText').textContent = '✏️ Edit Event';
  document.getElementById('eventSubmitBtn').textContent = 'Update Event';
  document.getElementById('eventCancelEditBtn').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEventItem(index) {
  if (confirm(`Are you sure you want to delete event "${eventsData[index].title}"?`)) {
    eventsData.splice(index, 1);
    saveEvents();
  }
}

function resetEventForm() {
  document.getElementById('eventForm').reset();
  document.getElementById('editEventIndex').value = '';
  document.getElementById('eventFormTitleText').textContent = '➕ Add New Event';
  document.getElementById('eventSubmitBtn').textContent = 'Save Event';
  document.getElementById('eventCancelEditBtn').classList.add('hidden');
}

// Initial Load
fetchMenuFromSupabase();
renderEventsTable();
