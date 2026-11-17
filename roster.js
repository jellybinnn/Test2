(function () {
  var SPONSOR_URL = 'https://www.facebook.com/hellomeowcafe';
  var DEFAULT_CAT_IMAGE = 'https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_logo';
  var catsData = [];
  var lastTrigger = null;
  var currentFilter = 'All';

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindSheet(el) {
    if (el.dataset.bound) return;
    el.dataset.bound = 'true';
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-sheet-close]') || e.target.hasAttribute('data-sheet-backdrop')) {
        closeCatSheet();
      }
    });
  }

  function ensureSheet() {
    var el = document.getElementById('catProfileSheet');
    if (el) { bindSheet(el); return el; }

    el = document.createElement('div');
    el.id = 'catProfileSheet';
    el.className = 'fixed inset-0 z-[120] hidden';
    el.innerHTML =
      '<div data-sheet-backdrop class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>' +
      '<div class="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none">' +
        '<div id="catSheetDialog" role="dialog" aria-modal="true" aria-labelledby="catSheetName" tabindex="-1" ' +
             'class="pointer-events-auto relative w-full md:max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl outline-none">' +
          '<div class="flex justify-center pt-2.5 md:hidden"><div class="w-11 h-1.5 rounded-full bg-gray-300"></div></div>' +
          '<button type="button" data-sheet-close aria-label="Close profile" ' +
                  'class="absolute top-3 right-3 w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12" />' +
            '</svg>' +
          '</button>' +
          '<div id="catSheetBody" class="p-5 pt-6 md:p-7"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
    bindSheet(el);
    return el;
  }

  function openCatSheet(cat, trigger) {
    if (!cat) return;

    var sheet = ensureSheet();
    var body = document.getElementById('catSheetBody');
    var hasPhoto = cat.image && cat.image.trim() !== '';
    var catCategory = cat.category || 'Resident';

    var avatarHtml = hasPhoto
      ? '<img src="' + esc(cat.image) + '" alt="' + esc(cat.name) + '" class="w-32 shrink-0 aspect-[4/5] object-cover rounded-2xl bg-brand-turquoise-light/40">'
      : '<div class="w-32 shrink-0 aspect-[4/5] rounded-2xl bg-gradient-to-br from-brand-dark to-brand-turquoise flex flex-col items-center justify-center text-white p-3 text-center">' +
          '<span class="text-4xl mb-1">🐱</span>' +
          '<span class="text-[10px] font-bold uppercase tracking-wider opacity-85">No Photo Yet</span>' +
        '</div>';

    body.innerHTML =
      '<div class="flex gap-4 items-start">' +
        avatarHtml +
        '<div class="pt-2 pr-10 min-w-0">' +
          '<span class="inline-block px-3 py-1 rounded-full bg-brand-turquoise-light text-brand-dark text-xs font-bold mb-2 font-sans">' + esc(catCategory) + '</span>' +
          '<h3 id="catSheetName" class="font-heading font-bold text-2xl text-gray-900 leading-tight break-words">' + esc(cat.name) + '</h3>' +
        '</div>' +
      '</div>' +
      '<p class="mt-5 text-base text-gray-700 leading-relaxed font-sans">' + esc(cat.description) + '</p>' +
      '<a href="' + SPONSOR_URL + '" target="_blank" rel="noopener noreferrer" ' +
         'class="mt-6 flex items-center justify-center py-3.5 rounded-2xl bg-brand-orange text-white font-heading font-bold text-base hover:bg-brand-orange-hover transition-colors">' +
        'Sponsor ' + esc(cat.name) +
      '</a>';

    lastTrigger = trigger || null;
    sheet.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('catSheetDialog').focus();
  }

  function closeCatSheet() {
    var sheet = document.getElementById('catProfileSheet');
    if (!sheet || sheet.classList.contains('hidden')) return;
    sheet.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    lastTrigger = null;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCatSheet();
  });

  function renderRoster() {
    const grid = document.getElementById('catRosterGrid');
    if (!grid) return;

    var filtered = catsData.filter(function (cat) {
      if (currentFilter === 'All') return true;
      return (cat.category || '').toLowerCase() === currentFilter.toLowerCase();
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-5 text-center text-gray-400 py-10 text-sm">No cats found in this category yet.</div>';
      return;
    }

    grid.innerHTML = filtered.map((cat) => {
      var hasPhoto = cat.image && cat.image.trim() !== '';
      var catCategory = cat.category || 'Resident';

      var visualHtml = hasPhoto
        ? `<img src="${esc(cat.image)}" alt="${esc(cat.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
        : `<div class="absolute inset-0 bg-gradient-to-br from-brand-dark to-brand-turquoise flex flex-col items-center justify-start pt-8 p-4 text-center">
             <span class="text-5xl mb-1.5 opacity-85">🐱</span>
             <span class="text-[10px] uppercase tracking-widest text-white/75 font-bold">Photo Coming Soon</span>
           </div>`;

      return `
        <article data-cat-id="${esc(cat.id)}" role="button" tabindex="0" aria-label="View ${esc(cat.name)}'s profile"
          class="group relative shrink-0 w-48 sm:w-56 md:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-card border border-gray-100 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-turquoise">
          ${visualHtml}
          <div class="absolute inset-x-0 bottom-0 p-3.5 pt-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
            <span class="inline-block px-2 py-0.5 rounded-full bg-brand-orange/95 text-[9px] font-bold mb-1 leading-tight">${esc(catCategory)}</span>
            <h3 class="font-heading font-bold text-sm leading-tight">${esc(cat.name)}</h3>
            <p class="text-[11px] text-white/95 leading-snug mt-1">${esc(cat.description)}</p>
          </div>
        </article>
      `;
    }).join('');

    if (!grid.dataset.sheetBound) {
      grid.dataset.sheetBound = 'true';

      grid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-cat-id]');
        if (card) {
          var id = card.getAttribute('data-cat-id');
          var catObj = catsData.find(c => String(c.id) === String(id));
          openCatSheet(catObj, card);
        }
      });

      grid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var card = e.target.closest('[data-cat-id]');
        if (!card) return;
        e.preventDefault();
        var id = card.getAttribute('data-cat-id');
        var catObj = catsData.find(c => String(c.id) === String(id));
        openCatSheet(catObj, card);
      });
    }
  }

  async function loadCatRoster() {
    const client = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!client) return;

    try {
      const { data, error } = await client
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      catsData = data || [];
      renderRoster();

      var filterButtons = document.querySelectorAll('.cat-filter-btn');
      filterButtons.forEach(btn => {
        btn.onclick = function () {
          filterButtons.forEach(b => {
            b.className = "cat-filter-btn px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer";
          });
          btn.className = "cat-filter-btn px-4 py-2 rounded-full text-xs font-bold bg-brand-orange text-white shadow-sm transition-all cursor-pointer";
          currentFilter = btn.getAttribute('data-filter');
          renderRoster();
        };
      });
    } catch (err) {
      console.error('Error loading cat roster from Supabase:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatRoster);
  } else {
    loadCatRoster();
  }
})();