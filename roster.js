(function () {
  var SPONSOR_URL = 'https://www.facebook.com/hellomeowcafe';
  var catsData = [];
  var lastTrigger = null;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTags(cat) {
    var tags = [];
    if (Array.isArray(cat.tags)) tags = cat.tags;
    else if (typeof cat.tags === 'string' && cat.tags.trim() !== '') {
      tags = cat.tags.split(',');
    }
    tags = tags.map(function (t) { return String(t).trim(); }).filter(Boolean);
    if (cat.age && String(cat.age).trim() !== '') tags.push(String(cat.age).trim());
    return tags;
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

  function openCatSheet(index, trigger) {
    var cat = catsData[index];
    if (!cat) return;

    var sheet = ensureSheet();
    var body = document.getElementById('catSheetBody');
    var tags = getTags(cat);

    var tagsHtml = tags.length
      ? '<div class="flex flex-wrap gap-1.5 mt-3">' +
          tags.map(function (t) {
            return '<span class="px-3 py-1 rounded-full bg-brand-turquoise-light text-brand-dark text-sm font-semibold font-sans">' + esc(t) + '</span>';
          }).join('') +
        '</div>'
      : '';

    body.innerHTML =
      '<div class="flex gap-4 items-start">' +
        '<img src="' + esc(cat.image) + '" alt="' + esc(cat.name) + '" ' +
             'class="w-32 shrink-0 aspect-[4/5] object-cover rounded-2xl bg-gray-100">' +
        '<div class="pt-6 pr-10 min-w-0">' +
          '<h3 id="catSheetName" class="font-heading font-bold text-2xl text-gray-900 leading-tight break-words">' + esc(cat.name) + '</h3>' +
          tagsHtml +
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

  async function loadCatRoster() {
    const grid =
      document.getElementById('catRosterGrid') ||
      document.querySelector('#catRosterSection .snap-x');
    if (!grid) return;

    const client = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!client) {
      console.warn("Supabase client is not available for public roster loading.");
      return;
    }

    try {
      const { data, error } = await client
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching cats from Supabase:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.log("No cats found in Supabase table.");
        return;
      }

      catsData = data;

      grid.innerHTML = data.map((cat, i) => `
        <article data-cat-index="${i}" role="button" tabindex="0" aria-label="View ${esc(cat.name)}'s profile"
          class="group relative shrink-0 w-44 sm:w-52 md:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-card border border-gray-100 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-turquoise">
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

      if (!grid.dataset.sheetBound) {
        grid.dataset.sheetBound = 'true';

        grid.addEventListener('click', function (e) {
          var card = e.target.closest('[data-cat-index]');
          if (card) openCatSheet(Number(card.getAttribute('data-cat-index')), card);
        });

        grid.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          var card = e.target.closest('[data-cat-index]');
          if (!card) return;
          e.preventDefault();
          openCatSheet(Number(card.getAttribute('data-cat-index')), card);
        });
      }
    } catch (err) {
      console.error('Error loading cat roster:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatRoster);
  } else {
    loadCatRoster();
  }
})();