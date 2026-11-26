(function () {
  var CATEGORY_ORDER = [
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

  var FILTER_BTN_INACTIVE =
    'cat-filter-btn px-4 py-2 rounded-2xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer';
  var FILTER_BTN_ACTIVE =
    'cat-filter-btn px-4 py-2 rounded-2xl text-xs font-bold bg-[#C85A32] text-white shadow-sm transition-all cursor-pointer';

  var SWIPE_CLOSE_THRESHOLD = 110;
  var SWIPE_VELOCITY_THRESHOLD = 0.55;
  var HORIZONTAL_SWIPE_THRESHOLD = 65;

  var catsData = [];
  var visibleCats = [];
  var activeCatIndex = -1;
  var lastTrigger = null;
  var currentFilter = 'All';
  var previousBodyOverflow = '';
  var previousBodyPaddingRight = '';

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getRosterWalkingCatHtml(message) {
    return (
      '<div role="status" aria-live="polite" class="hmc-cat-loader py-4">' +
        '<svg class="hmc-cat-walk-svg" viewBox="0 0 84 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect class="hmc-leg-back-b" x="24" y="30" width="5" height="15" rx="2.5" fill="#D97724"/>' +
          '<rect class="hmc-leg-front-b" x="48" y="30" width="5" height="15" rx="2.5" fill="#D97724"/>' +
          '<path class="hmc-cat-tail" d="M22 25C13 23 10 13 15 9" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>' +
          '<g class="hmc-cat-body">' +
            '<rect x="21" y="20" width="35" height="15" rx="7.5" fill="#F59E0B"/>' +
            '<path d="M33 20.5V25M39 20.5V25.5M45 20.5V25" stroke="#B45309" stroke-width="2" stroke-linecap="round"/>' +
            '<circle cx="58" cy="20" r="10" fill="#F59E0B"/>' +
            '<polygon points="50,13 52,5 57,11" fill="#F59E0B"/>' +
            '<polygon points="60,11 65,5 66,13" fill="#F59E0B"/>' +
            '<polygon points="51.5,12 52.5,7.5 55.5,11" fill="#FDBA74"/>' +
            '<polygon points="61,11 64,7.5 64.5,12" fill="#FDBA74"/>' +
            '<circle cx="61.5" cy="19" r="1.4" fill="#1F2937"/>' +
            '<circle cx="66.5" cy="21.5" r="1.3" fill="#FB7185"/>' +
            '<path d="M62 23.5C63.5 24.8 65.5 24.8 67 23.5" stroke="#78350F" stroke-width="1.4" stroke-linecap="round"/>' +
            '<rect x="49" y="24" width="11" height="2.6" rx="1.3" fill="#00A896"/>' +
          '</g>' +
          '<rect class="hmc-leg-back-a" x="28" y="30" width="5.5" height="16" rx="2.75" fill="#FBBF24"/>' +
          '<rect class="hmc-leg-front-a" x="52" y="30" width="5.5" height="16" rx="2.75" fill="#FBBF24"/>' +
        '</svg>' +
        '<div class="hmc-paw-trail flex items-center gap-1.5" aria-hidden="true">' +
          '<span>🐾</span><span>🐾</span><span>🐾</span>' +
        '</div>' +
        '<p class="text-xs font-semibold text-brand-muted">' + esc(message) + '</p>' +
      '</div>'
    );
  }

  function renderRosterLoading() {
    var grid = document.getElementById('catRosterGrid');
    if (grid) {
      grid.innerHTML = '<div class="col-span-full w-full flex justify-center py-8">' + getRosterWalkingCatHtml('Calling the kitties...') + '</div>';
    }
  }

  function renderRosterError() {
    var grid = document.getElementById('catRosterGrid');
    if (!grid) return;

    grid.innerHTML =
      '<div class="col-span-full w-full text-center py-8 px-4 rounded-2xl bg-gray-50 border border-gray-200">' +
        '<p class="text-xs font-semibold text-gray-700 mb-3">Could not load our cat roster right now.</p>' +
        '<button type="button" id="retryCatRosterBtn" class="px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#AE4B28] text-white text-xs font-bold cursor-pointer transition-colors">Try Again</button>' +
      '</div>';

    document.getElementById('retryCatRosterBtn')?.addEventListener('click', loadCatRoster);
  }

  function getCategoryRank(category) {
    var normalized = String(category ?? '').trim().toLowerCase();
    var idx = CATEGORY_ORDER.findIndex(function (c) {
      return c.toLowerCase() === normalized;
    });
    return idx === -1 ? CATEGORY_ORDER.length : idx;
  }

  function sortCatsByCategoryOrder(list) {
    return list.slice().sort(function (a, b) {
      var rankDiff = getCategoryRank(a.category) - getCategoryRank(b.category);
      if (rankDiff !== 0) return rankDiff;
      var timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      var timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  }

  function getFilteredCats() {
    var sorted = sortCatsByCategoryOrder(catsData);
    if (currentFilter === 'All') return sorted;
    return sorted.filter(function (cat) {
      return (cat.category || '').toLowerCase() === currentFilter.toLowerCase();
    });
  }

  function lockPageScroll() {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
  }

  function unlockPageScroll() {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }

  function resetSheetTransform(dialog) {
    if (!dialog) return;
    dialog.style.transition = '';
    dialog.style.transform = '';
    dialog.style.opacity = '';
  }

  function animateSheetBack(dialog) {
    if (!dialog) return;
    dialog.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease';
    dialog.style.transform = 'translateY(0px)';
    dialog.style.opacity = '1';
    window.setTimeout(function () {
      resetSheetTransform(dialog);
    }, 250);
  }

  function bindSwipeGestures(dialog) {
    if (!dialog || dialog.dataset.swipeBound) return;
    dialog.dataset.swipeBound = 'true';

    var startX = 0;
    var startY = 0;
    var startTime = 0;
    var deltaX = 0;
    var deltaY = 0;
    var gestureMode = null;
    var isDismissing = false;

    dialog.addEventListener('touchstart', function (e) {
      if (isDismissing || !e.touches || e.touches.length !== 1) return;
      if (e.target.closest('button, a, [data-cat-nav], [data-sheet-close]')) {
        gestureMode = null;
        return;
      }

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      deltaX = 0;
      deltaY = 0;
      gestureMode = null;
      dialog.style.transition = 'none';
    }, { passive: true });

    dialog.addEventListener('touchmove', function (e) {
      if (isDismissing || !e.touches || e.touches.length !== 1) return;
      if (e.target.closest('button, a, [data-cat-nav], [data-sheet-close]')) return;

      deltaX = e.touches[0].clientX - startX;
      deltaY = e.touches[0].clientY - startY;

      if (!gestureMode) {
        if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
          gestureMode = 'vertical';
        } else if (Math.abs(deltaX) > 14 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
          gestureMode = 'horizontal';
        }
      }

      if (gestureMode === 'vertical' && deltaY > 0) {
        e.preventDefault();
        var dampedY = deltaY > 180 ? 180 + (deltaY - 180) * 0.35 : deltaY;
        dialog.style.transform = 'translateY(' + dampedY + 'px)';
        dialog.style.opacity = String(Math.max(0.45, 1 - dampedY / 420));
      }
    }, { passive: false });

    function finishTouch() {
      if (isDismissing) return;

      if (gestureMode === 'vertical' && deltaY > 0) {
        var elapsed = Math.max(1, Date.now() - startTime);
        var velocityY = deltaY / elapsed;
        var shouldClose = deltaY > SWIPE_CLOSE_THRESHOLD || (deltaY > 45 && velocityY > SWIPE_VELOCITY_THRESHOLD);

        if (shouldClose) {
          isDismissing = true;
          dialog.style.transition = 'transform 0.22s ease-in, opacity 0.22s ease-in';
          dialog.style.transform = 'translateY(100%)';
          dialog.style.opacity = '0';
          window.setTimeout(function () {
            resetSheetTransform(dialog);
            isDismissing = false;
            closeCatSheet();
          }, 220);
        } else {
          animateSheetBack(dialog);
        }
      } else if (gestureMode === 'horizontal' && visibleCats.length > 1) {
        if (deltaX <= -HORIZONTAL_SWIPE_THRESHOLD) {
          stepCatSheet(1);
        } else if (deltaX >= HORIZONTAL_SWIPE_THRESHOLD) {
          stepCatSheet(-1);
        }
        animateSheetBack(dialog);
      } else {
        animateSheetBack(dialog);
      }

      gestureMode = null;
      deltaX = 0;
      deltaY = 0;
    }

    dialog.addEventListener('touchend', finishTouch, { passive: true });
    dialog.addEventListener('touchcancel', finishTouch, { passive: true });
  }

  function bindSheet(el) {
    if (el.dataset.bound) return;
    el.dataset.bound = 'true';
    bindSwipeGestures(el.querySelector('#catSheetDialog'));

    el.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-cat-nav]');
      if (navBtn) {
        var step = Number(navBtn.getAttribute('data-cat-nav'));
        if (!Number.isNaN(step)) stepCatSheet(step);
        return;
      }
      if (e.target.closest('[data-sheet-close]') || e.target.hasAttribute('data-sheet-backdrop')) {
        closeCatSheet();
      }
    });
  }

  function ensureSheet() {
    var el = document.getElementById('catProfileSheet');
    if (el) {
      bindSheet(el);
      return el;
    }

    el = document.createElement('div');
    el.id = 'catProfileSheet';
    el.className = 'fixed inset-0 z-[120] hidden';
    el.innerHTML =
      '<div data-sheet-backdrop class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>' +
      '<div class="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-6 pointer-events-none">' +
        '<div id="catSheetDialog" role="dialog" aria-modal="true" aria-labelledby="catSheetName" tabindex="-1" ' +
             'class="pointer-events-auto relative w-full md:max-w-md min-h-[640px] max-h-[96vh] flex flex-col justify-between bg-white rounded-[40px] shadow-2xl outline-none overflow-hidden">' +
          '<div data-swipe-handle class="flex justify-center pt-2 md:hidden shrink-0"><div class="w-12 h-2 rounded-full bg-[#1D8A99]/45"></div></div>' +
          '<button type="button" data-sheet-close aria-label="Close profile" ' +
                  'class="pointer-events-auto absolute top-4 right-4 z-40 w-12 h-12 shrink-0 rounded-2xl bg-white/95 hover:bg-[#1D8A99]/15 text-[#1D8A99] border border-[#1D8A99]/30 shadow-md flex items-center justify-center cursor-pointer transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12" />' +
            '</svg>' +
          '</button>' +
          '<div id="catSheetBody" class="flex-1 flex flex-col justify-between overflow-hidden no-scrollbar p-6"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
    bindSheet(el);
    return el;
  }

  function renderCatSheetContent(cat, index, total) {
    var body = document.getElementById('catSheetBody');
    if (!body || !cat) return;

    var hasPhoto = Boolean(cat.image && cat.image.trim() !== '');
    var catCategory = cat.category || 'Resident';
    var prevIndex = (index - 1 + total) % total;
    var nextIndex = (index + 1) % total;

    var blurredBackdrop = hasPhoto
      ? '<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-52 rounded-2xl overflow-hidden">' +
          '<img src="' + esc(cat.image) + '" alt="" class="w-full h-full object-cover object-top scale-125 blur-sm opacity-65">' +
          '<div class="absolute inset-0 bg-gradient-to-b from-[#1D8A99]/35 via-[#1D8A99]/15 to-white"></div>' +
        '</div>'
      : '<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-44 rounded-2xl bg-gradient-to-b from-[#1D8A99]/35 via-[#1D8A99]/15 to-transparent"></div>';

    var avatarMedia = hasPhoto
      ? '<img src="' + esc(cat.image) + '" alt="' + esc(cat.name) + '" class="w-full h-full object-cover">'
      : '<div class="w-full h-full bg-gradient-to-br from-[#1D8A99] to-[#156975] flex flex-col items-center justify-center text-white p-6 text-center">' +
          '<span class="text-5xl mb-2">🐱</span>' +
          '<span class="text-xs font-bold uppercase tracking-wider opacity-90">No Photo Yet</span>' +
        '</div>';

    var navHtml = total > 1
      ? '<div class="mt-4 pt-4 border-t border-[#1D8A99]/20 flex items-center justify-between gap-4 shrink-0">' +
          '<button type="button" data-cat-nav="-1" aria-label="Previous cat: ' + esc(visibleCats[prevIndex]?.name || 'Previous') + '" ' +
                  'class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-[#1D8A99]/15 text-[#1D8A99] border border-[#1D8A99]/35 font-heading font-bold text-xs cursor-pointer transition-colors">' +
            '<span aria-hidden="true">‹</span>' +
            '<span>Prev</span>' +
          '</button>' +
          '<span class="text-xs font-bold text-[#1D8A99] font-sans">' + (index + 1) + ' / ' + total + '</span>' +
          '<button type="button" data-cat-nav="1" aria-label="Next cat: ' + esc(visibleCats[nextIndex]?.name || 'Next') + '" ' +
                  'class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C85A32] hover:bg-[#AE4B28] text-white shadow-sm font-heading font-bold text-xs cursor-pointer transition-colors">' +
            '<span>Next</span>' +
            '<span aria-hidden="true">›</span>' +
          '</button>' +
        '</div>'
      : '';

    body.innerHTML =
      '<div class="relative flex-1 flex flex-col justify-between overflow-hidden rounded-2xl p-4">' +
        blurredBackdrop +
        '<span aria-hidden="true" style="color: transparent; text-shadow: 0 1px 1px rgba(255,255,255,0.85), 0 -1px 1px rgba(29,138,153,0.22); -webkit-text-stroke: 1px rgba(29,138,153,0.14);" class="pointer-events-none select-none absolute top-2 left-2 text-5xl -rotate-12">🐾</span>' +
        '<span aria-hidden="true" style="color: transparent; text-shadow: 0 1px 1px rgba(255,255,255,0.9), 0 -1px 1px rgba(15,23,42,0.14); -webkit-text-stroke: 1px rgba(15,23,42,0.08);" class="pointer-events-none select-none absolute bottom-16 right-2 text-6xl rotate-12">🐾</span>' +
        '<div class="relative z-10 flex items-center justify-center shrink-0">' +
          '<div class="relative w-56 sm:w-60 aspect-[4/5] rounded-2xl overflow-hidden bg-white ring-4 ring-white shadow-xl -rotate-1">' +
            '<span aria-hidden="true" class="absolute top-2 left-2 z-10 w-8 h-8 rounded-lg bg-[#C85A32] text-white shadow flex items-center justify-center text-sm">🐾</span>' +
            avatarMedia +
          '</div>' +
        '</div>' +
        '<div class="relative z-10 mt-4 text-left shrink-0">' +
          '<h3 id="catSheetName" class="font-heading font-bold text-2xl text-gray-900 leading-tight break-words">' + esc(cat.name) + '</h3>' +
          '<span class="mt-2 inline-block px-4 py-2 rounded-2xl bg-[#1D8A99] text-white text-xs font-bold font-sans shadow-xs">' + esc(catCategory) + '</span>' +
          '<div class="mt-4 p-4 rounded-2xl bg-[#C85A32]/12 border border-[#C85A32]/25 border-l-4 border-l-[#C85A32]">' +
            '<p class="text-sm text-gray-800 leading-relaxed font-sans">' + esc(cat.description) + '</p>' +
          '</div>' +
        '</div>' +
        navHtml +
      '</div>';
  }

  function stepCatSheet(step) {
    if (!visibleCats.length || activeCatIndex < 0) return;
    activeCatIndex = (activeCatIndex + step + visibleCats.length) % visibleCats.length;
    renderCatSheetContent(visibleCats[activeCatIndex], activeCatIndex, visibleCats.length);
  }

  function openCatSheet(cat, trigger) {
    if (!cat) return;

    visibleCats = getFilteredCats();
    var foundIdx = visibleCats.findIndex(function (c) {
      return String(c.id) === String(cat.id);
    });
    if (foundIdx === -1) {
      visibleCats = [cat];
      foundIdx = 0;
    }
    activeCatIndex = foundIdx;

    var sheet = ensureSheet();
    var dialog = sheet.querySelector('#catSheetDialog');
    resetSheetTransform(dialog);
    renderCatSheetContent(visibleCats[activeCatIndex], activeCatIndex, visibleCats.length);

    lastTrigger = trigger || null;
    sheet.classList.remove('hidden');
    lockPageScroll();
    if (dialog && typeof dialog.focus === 'function') {
      dialog.focus({ preventScroll: true });
    }
  }

  function closeCatSheet() {
    var sheet = document.getElementById('catProfileSheet');
    if (!sheet || sheet.classList.contains('hidden')) return;
    resetSheetTransform(sheet.querySelector('#catSheetDialog'));
    sheet.classList.add('hidden');
    unlockPageScroll();
    activeCatIndex = -1;
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
  }

  document.addEventListener('keydown', function (e) {
    var sheet = document.getElementById('catProfileSheet');
    var isOpen = sheet && !sheet.classList.contains('hidden');
    if (e.key === 'Escape') {
      closeCatSheet();
      return;
    }
    if (!isOpen) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepCatSheet(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepCatSheet(1);
    }
  });

  function bindRosterGridEvents(grid) {
    if (grid.dataset.sheetBound) return;
    grid.dataset.sheetBound = 'true';

    function handleActivateCard(e) {
      var card = e.target.closest('[data-cat-id]');
      if (!card) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      var id = card.getAttribute('data-cat-id');
      var catObj = catsData.find(function (c) {
        return String(c.id) === String(id);
      });
      openCatSheet(catObj, card);
    }

    grid.addEventListener('click', handleActivateCard);
    grid.addEventListener('keydown', handleActivateCard);
  }

  function renderRoster() {
    var grid = document.getElementById('catRosterGrid');
    if (!grid) return;

    var filtered = getFilteredCats();
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-5 text-center text-gray-400 py-8 text-sm">No cats found in this category yet.</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (cat) {
      var hasPhoto = Boolean(cat.image && cat.image.trim() !== '');
      var catCategory = cat.category || 'Resident';

      var visualHtml = hasPhoto
        ? '<img src="' + esc(cat.image) + '" alt="' + esc(cat.name) + '" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">'
        : '<div class="absolute inset-0 bg-gradient-to-br from-[#1D8A99] to-[#156975] flex flex-col items-center justify-start pt-8 p-6 text-center">' +
            '<span class="text-5xl mb-2 opacity-85">🐱</span>' +
            '<span class="text-[10px] uppercase tracking-widest text-white/75 font-bold">Photo Coming Soon</span>' +
          '</div>';

      return (
        '<article data-cat-id="' + esc(cat.id) + '" role="button" tabindex="0" aria-label="View ' + esc(cat.name) + '\'s profile" ' +
                 'class="group relative shrink-0 w-48 sm:w-56 md:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-card border border-gray-100 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1D8A99]">' +
          '<span aria-hidden="true" class="absolute top-2 left-2 z-10 w-8 h-8 rounded-lg bg-[#C85A32] text-white flex items-center justify-center text-xs shadow">🐾</span>' +
          visualHtml +
          '<div class="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">' +
            '<span class="inline-block px-2 py-1 rounded-lg bg-[#1D8A99] text-[10px] font-bold mb-1 leading-tight">' + esc(catCategory) + '</span>' +
            '<h3 class="font-heading font-bold text-sm leading-tight">' + esc(cat.name) + '</h3>' +
            '<p class="text-xs text-white/95 leading-snug mt-1">' + esc(cat.description) + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    bindRosterGridEvents(grid);
  }

  function bindFilterButtons() {
    var filterButtons = document.querySelectorAll('.cat-filter-btn');
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) {
          b.className = FILTER_BTN_INACTIVE;
        });
        btn.className = FILTER_BTN_ACTIVE;
        currentFilter = btn.getAttribute('data-filter') || 'All';
        renderRoster();
      });
    });
  }

  async function loadCatRoster() {
    var client = typeof supabaseClient !== 'undefined' ? supabaseClient : null;
    if (!client) {
      renderRosterError();
      return;
    }

    renderRosterLoading();

    try {
      var res = await client
        .from('cats')
        .select('*')
        .order('created_at', { ascending: true });

      if (res.error) throw res.error;
      catsData = res.data || [];
      renderRoster();
      bindFilterButtons();
    } catch (err) {
      console.error('Error loading cat roster from Supabase:', err);
      renderRosterError();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatRoster);
  } else {
    loadCatRoster();
  }
})();