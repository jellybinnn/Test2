<<<<<<< HEAD
// Loads the cat roster from Supabase and renders it into the public site using the overlay card style.
(function () {
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadCatRoster() {
    const grid =
      document.getElementById('catRosterGrid') ||
      document.querySelector('#catRosterSection .snap-x');
    if (!grid) return;

    const client = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!client) return;

    try {
      const { data, error } = await client
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return; // Keep static fallback if table is empty

      grid.innerHTML = data.map(cat => `
        <article class="group relative shrink-0 w-44 sm:w-52 md:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-card border border-gray-100">
          <img src="${esc(cat.image)}" alt="${esc(cat.name)}" loading="lazy"
               class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white">
            <h3 class="font-heading font-bold text-sm leading-tight">${esc(cat.name)}</h3>
            <p class="text-[11px] text-white/85 leading-snug mt-0.5">${esc(cat.description)}</p>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span class="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold">Sweet</span>
              <span class="px-2 py-0.5 rounded-full bg-brand-orange/80 text-[10px] font-semibold">Rescue</span>
            </div>
          </div>
        </article>
      `).join('');
    } catch (err) {
      console.error('Error loading cat roster:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatRoster);
  } else {
    loadCatRoster();
  }
=======
// Loads the cat roster from Supabase and renders it into the public site using the overlay card style.
(function () {
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadCatRoster() {
    const grid =
      document.getElementById('catRosterGrid') ||
      document.querySelector('#catRosterSection .snap-x');
    if (!grid) return;

    const client = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!client) return;

    try {
      const { data, error } = await client
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return; // Keep static fallback if table is empty

      grid.innerHTML = data.map(cat => `
        <article class="group relative shrink-0 w-44 sm:w-52 md:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-card border border-gray-100">
          <img src="${esc(cat.image)}" alt="${esc(cat.name)}" loading="lazy"
               class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white">
            <h3 class="font-heading font-bold text-sm leading-tight">${esc(cat.name)}</h3>
            <p class="text-[11px] text-white/85 leading-snug mt-0.5">${esc(cat.description)}</p>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span class="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold">Sweet</span>
              <span class="px-2 py-0.5 rounded-full bg-brand-orange/80 text-[10px] font-semibold">Rescue</span>
            </div>
          </div>
        </article>
      `).join('');
    } catch (err) {
      console.error('Error loading cat roster:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatRoster);
  } else {
    loadCatRoster();
  }
>>>>>>> a149c4a62d65f19c50fd0dd88e369f6abb62da59
})();