const SUPABASE_URL = 'https://uchlotinokpqhwpouczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8iF-UjYhlzFovpA7Ay1K5g_V5vyaRjg';

const CLOUDINARY_CLOUD_NAME = 'tfk63bnl';
const CLOUDINARY_UPLOAD_PRESET = 'hmc_cats';
const DEFAULT_BANNER_URL = 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner';
const DEFAULT_CAT_IMAGE = 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_logo';

const CAT_CATEGORY_ORDER = [
  'The British Shorthair Family',
  'British Shorthair Gang',
  'The Mama Cats!',
  'The Ragdoll Family',
  'The Ninja Tag Team',
  'Our Spayed Single Ladies',
  'The Youngsters',
  'The Juniors',
  'The Escape Artist',
  'The Legit Cuddle Bugs'
];

let supabaseClient = null;
try {
  if (window.supabase && SUPABASE_URL) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
} catch (e) {
  console.error("Supabase initialization error:", e);
}

function clearSupabaseAuthStorage() {
  try {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(`sb-${projectRef}-`) || k.includes('supabase.auth.token'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {
    // Ignore storage access errors
  }
}

function sendKeepaliveSignOut() {
  clearSupabaseAuthStorage();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || typeof fetch !== 'function') return;
  try {
    fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      keepalive: true
    }).catch(() => {});
  } catch (_) {
    // Ignore network errors during page teardown
  }
}

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
    if (parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (_) {
    // Invalid URL falls back safely
  }
  return fallback;
}

function getWalkingCatLoaderHtml(message = 'Loading...', { compact = false, dark = true } = {}) {
  const sizeStyle = compact ? 'style="width:52px;height:36px;"' : '';
  const textClass = dark ? 'text-gray-300' : 'text-brand-muted';

  return `
    <div role="status" aria-live="polite" class="hmc-cat-loader py-3">
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

function renderTableLoading(tbodyId, colSpan, message = 'Loading records...') {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${colSpan}" class="p-6 text-center">${getWalkingCatLoaderHtml(message, { compact: true, dark: true })}</td></tr>`;
}

function setButtonLoading(btn, isLoading, loadingText) {
  if (!btn) return;
  if (isLoading) {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent;
    }
    btn.disabled = true;
    btn.classList.add("opacity-60", "cursor-not-allowed");
    btn.textContent = loadingText;
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-60", "cursor-not-allowed");
    if (btn.dataset.originalText) {
      btn.textContent = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  }
}

function setLoginCheckingState(isChecking) {
  const sessionLoader = document.getElementById("adminSessionLoader");
  const loginForm = document.getElementById("internalLoginForm");
  if (sessionLoader) sessionLoader.classList.toggle("hidden", !isChecking);
  if (loginForm) loginForm.classList.toggle("hidden", isChecking);
}

function getCatCategoryRank(category) {
  const normalized = String(category ?? '').trim().toLowerCase();
  const idx = CAT_CATEGORY_ORDER.findIndex(c => c.toLowerCase() === normalized);
  return idx === -1 ? CAT_CATEGORY_ORDER.length : idx;
}

function sortAdminCatsByCategoryOrder(list) {
  return list.slice().sort((a, b) => {
    const rankDiff = getCatCategoryRank(a.category) - getCatCategoryRank(b.category);
    if (rankDiff !== 0) return rankDiff;
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });
}

let toastTimeoutId = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById("adminToast");
  if (!toast) return;

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  const styles = {
    success: "bg-gray-900 border-emerald-500/40 text-emerald-300",
    error:   "bg-gray-900 border-rose-500/40 text-rose-300",
    info:    "bg-gray-900 border-brand-turquoise/40 text-brand-turquoise"
  };

  toast.textContent = message;
  toast.className = `fixed bottom-5 right-5 z-[140] max-w-sm px-4 py-3 rounded-2xl border text-xs font-bold shadow-2xl transition-all ${styles[type] || styles.info}`;
  toast.classList.remove("hidden");

  toastTimeoutId = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

let confirmResolver = null;
let confirmLastTrigger = null;

function openConfirmModal({ title = "Confirm Action", message = "Are you sure?", confirmText = "Delete" } = {}) {
  const modal = document.getElementById("adminConfirmModal");
  const titleEl = document.getElementById("adminConfirmTitle");
  const msgEl = document.getElementById("adminConfirmMessage");
  const okBtn = document.getElementById("adminConfirmOkBtn");

  if (!modal || !titleEl || !msgEl || !okBtn) {
    return Promise.resolve(false);
  }

  confirmLastTrigger = document.activeElement;
  titleEl.textContent = title;
  msgEl.textContent = message;
  okBtn.textContent = confirmText;

  modal.classList.remove("hidden");
  okBtn.focus();

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirmModal(confirmed) {
  const modal = document.getElementById("adminConfirmModal");
  if (!modal || modal.classList.contains("hidden")) return;

  modal.classList.add("hidden");
  const resolve = confirmResolver;
  confirmResolver = null;

  if (confirmLastTrigger && typeof confirmLastTrigger.focus === "function") {
    confirmLastTrigger.focus();
  }
  confirmLastTrigger = null;

  if (typeof resolve === "function") {
    resolve(Boolean(confirmed));
  }
}

function showLoginError(message) {
  const errEl = document.getElementById("internalErrorMsg");
  if (!errEl) return;
  errEl.textContent = message;
  errEl.classList.remove("hidden");
}

function hideLoginError() {
  const errEl = document.getElementById("internalErrorMsg");
  if (!errEl) return;
  errEl.classList.add("hidden");
}

let isClosingCms = false;

function lockLoginOverlayForClose() {
  isClosingCms = true;
  sessionStorage.removeItem("hmc_admin_auth");
  clearSupabaseAuthStorage();
  setLoginCheckingState(false);
  document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
  sendKeepaliveSignOut();
  if (supabaseClient) {
    supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}

window.addEventListener("pagehide", lockLoginOverlayForClose);
window.addEventListener("beforeunload", lockLoginOverlayForClose);
window.addEventListener("pageshow", () => {
  if (isClosingCms) {
    setLoginCheckingState(false);
    document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  isClosingCms = false;
  sessionStorage.removeItem("hmc_admin_auth");
  clearSupabaseAuthStorage();
  setLoginCheckingState(true);
  document.getElementById("adminLoginOverlay")?.classList.remove("hidden");

  if (!supabaseClient) {
    setLoginCheckingState(false);
    showLoginError("Authentication service unavailable.");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data?.session) {
      setLoginCheckingState(false);
      return;
    }

    document.getElementById("adminLoginOverlay")?.classList.add("hidden");
    initAdminDashboard();
  } catch (err) {
    console.error("Session check error:", err);
    setLoginCheckingState(false);
    showLoginError("Could not verify session. Please sign in.");
  }
});

async function handleInternalLogin(e) {
  e.preventDefault();
  hideLoginError();

  if (!supabaseClient) {
    showLoginError("Authentication service unavailable.");
    return;
  }

  const emailEl = document.getElementById("internalEmail");
  const passEl = document.getElementById("internalPassword");
  const loginBtn = document.getElementById("internalLoginBtn");
  const email = (emailEl?.value || '').trim();
  const password = passEl?.value || '';

  if (!email || !password) {
    showLoginError("Please enter both email and password.");
    return;
  }

  setButtonLoading(loginBtn, true, "Signing in...");
  try {
    isClosingCms = false;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      console.error("Admin sign-in error:", error);
      showLoginError("Invalid credentials. Please check your email and password.");
      return;
    }

    if (passEl) passEl.value = "";
    document.getElementById("adminLoginOverlay")?.classList.add("hidden");
    initAdminDashboard();
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

async function adminLogout() {
  const logoutBtn = document.getElementById("adminLogoutBtn");
  setButtonLoading(logoutBtn, true, "Signing out...");
  try {
    clearSupabaseAuthStorage();
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.error("Sign-out error:", err);
  } finally {
    setButtonLoading(logoutBtn, false);
  }

  sessionStorage.removeItem("hmc_admin_auth");

  // Clear in-memory dashboard state without reloading the page
  adminMenuList = [];
  adminEventsList = [];
  adminCatsList = [];
  adminAnalyticsData = { visits: 0, interactions: 0 };

  if (adminStatsChart) {
    adminStatsChart.destroy();
    adminStatsChart = null;
  }

  const menuSearch = document.getElementById("menuSearchInput");
  const menuCatFilter = document.getElementById("menuFilterCategory");
  const catSearch = document.getElementById("catSearchInput");
  const catFilter = document.getElementById("catFilterCategory");
  if (menuSearch) menuSearch.value = "";
  if (menuCatFilter) menuCatFilter.value = "All";
  if (catSearch) catSearch.value = "";
  if (catFilter) catFilter.value = "All";

  resetMenuForm();
  resetEventForm();
  resetCatForm();
  closeCatPreview();
  renderAdminMenuTable();
  renderAdminEventsTable();
  renderAdminCatsTable();
  renderAdminChart();
  switchTab("menu");

  hideLoginError();
  setLoginCheckingState(false);
  document.getElementById("adminLoginOverlay")?.classList.remove("hidden");
  document.getElementById("internalEmail")?.focus();
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
    const [visitsRes, interactionsRes] = await Promise.all([
      supabaseClient
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view'),
      supabaseClient
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .neq('event_type', 'page_view')
    ]);

    if (visitsRes.error) throw visitsRes.error;
    if (interactionsRes.error) throw interactionsRes.error;

    adminAnalyticsData = {
      visits: visitsRes.count || 0,
      interactions: interactionsRes.count || 0
    };
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
  renderTableLoading("menuTableBody", 5, "Loading menu items...");
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*').order('category');
    if (error) throw error;
    adminMenuList = data || [];
    renderAdminMenuTable();
    renderAdminChart();
  } catch (err) {
    console.error("Error loading menu:", err);
    renderAdminMenuTable();
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

  const query = (document.getElementById("menuSearchInput")?.value || "").trim().toLowerCase();
  const categoryFilter = document.getElementById("menuFilterCategory")?.value || "All";

  const filteredMenu = adminMenuList.filter(item => {
    const matchesCategory = categoryFilter === "All" || (item.category || "") === categoryFilter;
    if (!matchesCategory) return false;
    if (!query) return true;
    const haystack = `${item.name || ""} ${item.category || ""} ${item.description || ""} ${item.price || ""}`.toLowerCase();
    return haystack.includes(query);
  });

  if (filteredMenu.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs">No menu items match your search or category filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredMenu.map(item => `
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

  const submitBtn = document.getElementById("menuSubmitBtn");
  const id = document.getElementById("editMenuId").value;
  const category = document.getElementById("menuFormCategory").value;
  const name = document.getElementById("menuFormName").value.trim();
  const price = document.getElementById("menuFormPrice").value.trim();
  const description = document.getElementById("menuFormDesc").value.trim();

  setButtonLoading(submitBtn, true, id ? "Updating..." : "Saving...");
  try {
    if (id) {
      const { error } = await supabaseClient.from('menu_items').update({ category, name, price, description }).eq('id', id);
      if (error) throw error;
      showToast("Menu item updated successfully.", "success");
    } else {
      const { error } = await supabaseClient.from('menu_items').insert([{ category, name, price, description }]);
      if (error) throw error;
      showToast("Menu item saved to Supabase.", "success");
    }
    resetMenuForm();
    loadAdminMenu();
  } catch (err) {
    console.error("Error saving menu item:", err);
    showToast("Could not save menu item. Please try again.", "error");
  } finally {
    setButtonLoading(submitBtn, false);
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
  const confirmed = await openConfirmModal({
    title: "Delete Menu Item",
    message: "Are you sure you want to delete this menu item from Supabase?",
    confirmText: "Delete"
  });
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    showToast("Menu item deleted.", "success");
    loadAdminMenu();
  } catch (err) {
    console.error("Error deleting menu item:", err);
    showToast("Could not delete menu item. Please try again.", "error");
  }
}

let adminEventsList = [];

function getEventKey(ev, fallbackIndex) {
  if (ev && ev.id !== undefined && ev.id !== null && String(ev.id) !== '') {
    return String(ev.id);
  }
  return `local-${fallbackIndex}`;
}

function findEventByKey(key) {
  const strKey = String(key);
  const idx = adminEventsList.findIndex((ev, i) => getEventKey(ev, i) === strKey);
  return { ev: idx >= 0 ? adminEventsList[idx] : null, idx };
}

async function loadAdminEvents() {
  if (!supabaseClient) return;
  renderTableLoading("eventsTableBody", 4, "Loading events...");
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

    const thumbUrl = safeUrl(ev.image, DEFAULT_BANNER_URL);
    const eventKey = getEventKey(ev, index);

    return `
      <tr class="hover:bg-gray-800/50 transition-colors">
        <td class="p-4 font-bold text-white flex items-center gap-3">
          <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(ev.title || 'Event')}" class="w-10 h-10 rounded-lg object-cover">
          <div>
            <span>${escapeHtml(ev.title)}</span>
            ${imgCount > 0 ? `<span class="block text-[10px] text-brand-turquoise font-semibold">+${imgCount} gallery photos</span>` : ''}
          </div>
        </td>
        <td class="p-4 text-brand-orange font-semibold text-xs">${escapeHtml(ev.date)}</td>
        <td class="p-4 text-gray-400 text-xs max-w-xs truncate">${escapeHtml(ev.description || '')}</td>
        <td class="p-4 text-right space-x-2">
          <button onclick="editEventItem('${escapeHtml(eventKey)}')" class="px-3 py-1.5 rounded-lg bg-brand/20 text-brand-turquoise hover:bg-brand/40 text-xs font-bold transition-colors cursor-pointer">Edit</button>
          <button onclick="deleteEventItem('${escapeHtml(eventKey)}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("eventSubmitBtn");
  const editKey = document.getElementById("editEventIndex").value;
  const title = document.getElementById("eventFormTitle").value.trim();
  const date = document.getElementById("eventFormDate").value.trim();
  const rawImage = document.getElementById("eventFormImage").value.trim();
  const image = safeUrl(rawImage, DEFAULT_BANNER_URL);
  const galleryInput = document.getElementById("eventFormGalleryUrls").value;
  const description = document.getElementById("eventFormDesc").value.trim();

  const imagesArray = galleryInput
    ? galleryInput.split(',').map(url => safeUrl(url, '')).filter(Boolean)
    : [];
  const newEventObj = { title, date, image, description, images: imagesArray };
  const { ev: existingEv, idx: existingIdx } = editKey ? findEventByKey(editKey) : { ev: null, idx: -1 };

  setButtonLoading(submitBtn, true, existingEv ? "Updating..." : "Saving...");
  try {
    if (supabaseClient) {
      try {
        if (existingEv?.id) {
          const { error } = await supabaseClient.from('events').update(newEventObj).eq('id', existingEv.id);
          if (error) throw error;
          showToast("Event updated successfully.", "success");
        } else {
          const { error } = await supabaseClient.from('events').insert([newEventObj]);
          if (error) throw error;
          showToast("Event saved successfully.", "success");
        }
        resetEventForm();
        loadAdminEvents();
        return;
      } catch (err) {
        console.error("Supabase events error, saving locally:", err);
        saveEventLocally(newEventObj, existingIdx, "Event saved locally.");
        resetEventForm();
        return;
      }
    }

    saveEventLocally(newEventObj, existingIdx, "Event saved locally.");
    resetEventForm();
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function saveEventLocally(newEventObj, idx, message) {
  if (idx >= 0) adminEventsList[idx] = { ...adminEventsList[idx], ...newEventObj };
  else adminEventsList.unshift(newEventObj);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  showToast(message, "info");
  renderAdminEventsTable();
  renderAdminChart();
}

function editEventItem(key) {
  const { ev, idx } = findEventByKey(key);
  if (!ev) return;

  document.getElementById("editEventIndex").value = getEventKey(ev, idx);
  document.getElementById("eventFormTitle").value = ev.title || '';
  document.getElementById("eventFormDate").value = ev.date || '';
  document.getElementById("eventFormImage").value = safeUrl(ev.image, '');
  document.getElementById("eventFormDesc").value = ev.description || '';

  let galleryUrlsStr = "";
  if (Array.isArray(ev.images)) galleryUrlsStr = ev.images.map(u => safeUrl(u, '')).filter(Boolean).join(', ');
  else if (typeof ev.images === 'string') galleryUrlsStr = ev.images.split(',').map(u => safeUrl(u, '')).filter(Boolean).join(', ');
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

async function deleteEventItem(key) {
  const confirmed = await openConfirmModal({
    title: "Delete Event",
    message: "Are you sure you want to delete this event?",
    confirmText: "Delete"
  });
  if (!confirmed) return;

  const { ev, idx } = findEventByKey(key);
  if (!ev || idx < 0) return;

  if (supabaseClient && ev.id) {
    try {
      const { error } = await supabaseClient.from('events').delete().eq('id', ev.id);
      if (error) throw error;
      showToast("Event deleted.", "success");
      loadAdminEvents();
      return;
    } catch (err) {
      console.error("Error deleting event from Supabase:", err);
      showToast("Could not delete event from Supabase.", "error");
      return;
    }
  }

  adminEventsList.splice(idx, 1);
  localStorage.setItem("hmc_local_events", JSON.stringify(adminEventsList));
  renderAdminEventsTable();
  renderAdminChart();
  showToast("Event removed locally.", "info");
}

let adminCatsList = [];
let catUploadWidget = null;

async function loadAdminCats() {
  if (!supabaseClient) return;
  renderTableLoading("catsTableBody", 4, "Calling the kitties...");
  try {
    const { data, error } = await supabaseClient.from('cats').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    adminCatsList = sortAdminCatsByCategoryOrder(data || []);
    renderAdminCatsTable();
    renderAdminChart();
  } catch (err) {
    console.error("Error loading cats from Supabase:", err);
    renderAdminCatsTable();
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

  const query = (document.getElementById("catSearchInput")?.value || "").trim().toLowerCase();
  const categoryFilter = document.getElementById("catFilterCategory")?.value || "All";

  const filteredCats = adminCatsList.filter(cat => {
    const matchesCategory = categoryFilter === "All" || (cat.category || "") === categoryFilter;
    if (!matchesCategory) return false;
    if (!query) return true;
    const haystack = `${cat.name || ""} ${cat.category || ""} ${cat.description || ""}`.toLowerCase();
    return haystack.includes(query);
  });

  if (filteredCats.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 text-xs">No cats match your search or family filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredCats.map(cat => {
    const cleanImg = safeUrl(cat.image, '');
    const thumbHtml = cleanImg
      ? `<img src="${escapeHtml(cleanImg)}" alt="${escapeHtml(cat.name)}" class="w-12 h-14 rounded-lg object-cover bg-gray-800">`
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
  const cleanUrl = safeUrl(url, '');
  if (cleanUrl) {
    img.src = cleanUrl;
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
    showToast("Upload widget unavailable.", "error");
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
          const url = safeUrl(result.info.secure_url, '');
          if (url) {
            document.getElementById("catFormImage").value = url;
            updateCatPhotoPreview(url);
            showToast("Photo uploaded.", "success");
          }
        }
      }
    );
  }
  catUploadWidget.open();
}

async function handleCatSubmit(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const submitBtn = document.getElementById("catSubmitBtn");
  const id = document.getElementById("editCatId").value;
  const name = document.getElementById("catFormName").value.trim();
  const category = document.getElementById("catFormCategory").value;
  const description = document.getElementById("catFormDesc").value.trim();
  const image = safeUrl(document.getElementById("catFormImage").value.trim(), '');

  setButtonLoading(submitBtn, true, id ? "Updating..." : "Saving...");
  try {
    if (id) {
      const { error } = await supabaseClient.from('cats').update({ name, category, description, image }).eq('id', id);
      if (error) throw error;
      showToast("Cat updated successfully.", "success");
    } else {
      const { error } = await supabaseClient.from('cats').insert([{ name, category, description, image }]);
      if (error) throw error;
      showToast("Cat added to the roster.", "success");
    }
    resetCatForm();
    loadAdminCats();
  } catch (err) {
    console.error("Error saving cat:", err);
    showToast("Could not save cat. Please try again.", "error");
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function editCat(id) {
  const cat = adminCatsList.find(c => String(c.id) === String(id));
  if (!cat) return;

  const cleanImg = safeUrl(cat.image, '');
  document.getElementById("editCatId").value = cat.id;
  document.getElementById("catFormName").value = cat.name || '';
  document.getElementById("catFormCategory").value = cat.category || 'The British Shorthair Family';
  document.getElementById("catFormDesc").value = cat.description || '';
  document.getElementById("catFormImage").value = cleanImg;
  updateCatPhotoPreview(cleanImg);

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
  const confirmed = await openConfirmModal({
    title: "Remove Cat",
    message: "Remove this cat from the roster?",
    confirmText: "Remove"
  });
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from('cats').delete().eq('id', id);
    if (error) throw error;
    showToast("Cat removed from roster.", "success");
    loadAdminCats();
  } catch (err) {
    console.error("Error deleting cat:", err);
    showToast("Could not remove cat. Please try again.", "error");
  }
}

let previewLastTrigger = null;
let previewCatsList = [];
let previewCatIndex = -1;

function previewCat(id) {
  if (!adminCatsList.length) return;
  const idx = adminCatsList.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return;
  previewCatsList = adminCatsList;
  previewCatIndex = idx;
  openCatPreview(previewCatsList[previewCatIndex], document.activeElement);
}

function previewCatFromForm() {
  const name = document.getElementById("catFormName").value.trim();
  const category = document.getElementById("catFormCategory").value;
  const description = document.getElementById("catFormDesc").value.trim();
  const image = document.getElementById("catFormImage").value.trim();
  if (!name) {
    showToast("Add a cat name first to preview.", "info");
    return;
  }
  previewCatsList = [{ name, category, description, image }];
  previewCatIndex = 0;
  openCatPreview(previewCatsList[0], document.activeElement);
}

function stepCatPreview(step) {
  if (!previewCatsList.length || previewCatIndex < 0) return;
  previewCatIndex = (previewCatIndex + step + previewCatsList.length) % previewCatsList.length;
  renderCatPreviewBody(previewCatsList[previewCatIndex], previewCatIndex, previewCatsList.length);
}

function renderCatPreviewBody(cat, index, total) {
  const body = document.getElementById("catSheetBody");
  if (!body || !cat) return;

  const displayImg = safeUrl(cat.image, DEFAULT_CAT_IMAGE);
  const displayCat = cat.category || 'The British Shorthair Family';
  const canNavigate = total > 1;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  const navHtml = canNavigate
    ? `
      <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <button type="button" data-preview-nav="-1" aria-label="Previous cat: ${escapeHtml(previewCatsList[prevIndex]?.name || 'Previous')}" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-bold text-xs cursor-pointer transition-colors">
          <span aria-hidden="true">‹</span>
          <span>Prev</span>
        </button>
        <span class="text-xs font-semibold text-gray-400">${index + 1} / ${total}</span>
        <button type="button" data-preview-nav="1" aria-label="Next cat: ${escapeHtml(previewCatsList[nextIndex]?.name || 'Next')}" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-bold text-xs cursor-pointer transition-colors">
          <span>Next</span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    `
    : '';

  body.innerHTML = `
    <div class="relative overflow-hidden pt-2">
      <span aria-hidden="true" class="pointer-events-none select-none absolute -top-2 left-2 text-5xl opacity-10 -rotate-12">🐾</span>
      <span aria-hidden="true" class="pointer-events-none select-none absolute bottom-10 right-2 text-6xl opacity-10 rotate-12">🐾</span>
      <p class="relative z-10 text-xs font-semibold text-gray-500 mb-3 text-center">Preview: how visitors see ${escapeHtml(cat.name)}</p>
      <div class="relative z-10 flex items-center justify-center">
        <div class="relative w-56 sm:w-64 aspect-[4/5] rounded-2xl overflow-hidden bg-white ring-4 ring-white shadow-xl -rotate-1">
          <span aria-hidden="true" class="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/95 text-gray-900 shadow flex items-center justify-center text-sm">🐾</span>
          <img src="${escapeHtml(displayImg)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover">
        </div>
      </div>
      <div class="relative z-10 mt-5 text-left">
        <h3 class="font-bold text-2xl text-gray-900 leading-tight break-words">${escapeHtml(cat.name)}</h3>
        <span class="mt-2 inline-block px-3 py-1 rounded-full bg-brand-turquoise-light text-brand-dark text-xs font-bold">${escapeHtml(displayCat)}</span>
        <p class="mt-3 text-base text-gray-700 leading-relaxed">${escapeHtml(cat.description)}</p>
      </div>
      ${navHtml}
    </div>
  `;
}

function openCatPreview(cat, trigger) {
  const sheet = document.getElementById("catProfileSheet");
  const body = document.getElementById("catSheetBody");
  if (!sheet || !body) return;

  renderCatPreviewBody(cat, previewCatIndex >= 0 ? previewCatIndex : 0, previewCatsList.length || 1);

  previewLastTrigger = trigger || null;
  sheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeCatPreview() {
  const sheet = document.getElementById("catProfileSheet");
  if (!sheet || sheet.classList.contains("hidden")) return;
  sheet.classList.add("hidden");
  document.body.style.overflow = "";
  previewCatIndex = -1;
  if (previewLastTrigger) previewLastTrigger.focus();
  previewLastTrigger = null;
}

document.addEventListener("click", (e) => {
  const previewNavBtn = e.target.closest("[data-preview-nav]");
  if (previewNavBtn) {
    const step = Number(previewNavBtn.getAttribute("data-preview-nav"));
    if (!Number.isNaN(step)) stepCatPreview(step);
    return;
  }
  if (e.target.closest("[data-sheet-close]") || e.target.hasAttribute("data-sheet-backdrop")) closeCatPreview();
});
document.addEventListener("keydown", (e) => {
  const confirmModal = document.getElementById("adminConfirmModal");
  if (confirmModal && !confirmModal.classList.contains("hidden")) {
    if (e.key === "Escape") closeConfirmModal(false);
    return;
  }
  const sheet = document.getElementById("catProfileSheet");
  const isSheetOpen = sheet && !sheet.classList.contains("hidden");
  if (e.key === "Escape") {
    closeCatPreview();
    return;
  }
  if (!isSheetOpen) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stepCatPreview(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    stepCatPreview(1);
  }
});