document.addEventListener('DOMContentLoaded', () => {
  // --- Welcome Popup Controls ---
  const popup = document.getElementById('welcomePopup');
  const card = document.getElementById('popupCard');
  const popupAboutBtn = document.getElementById('popupAboutBtn');
  const popupLinks = document.querySelectorAll('.popup-link');

  setTimeout(() => {
    if (popup && card) {
      popup.classList.remove('opacity-0', 'pointer-events-none');
      popup.classList.add('opacity-100');
      card.classList.remove('scale-90');
      card.classList.add('scale-100');
    }
  }, 300);

  function closeWelcomePopup() {
    if (popup && card) {
      popup.classList.remove('opacity-100');
      popup.classList.add('opacity-0', 'pointer-events-none');
      card.classList.remove('scale-100');
      card.classList.add('scale-90');
    }

    // Forcefully load and play the background video after closing the popup
    const heroVideo = document.getElementById('heroGif');
    if (heroVideo) {
      heroVideo.load();
      heroVideo.play().catch(error => {
        console.log("Autoplay waiting for user interaction:", error);
      });
    }
  }

  popup?.addEventListener('click', (e) => {
    if (e.target.id === 'welcomePopup') {
      closeWelcomePopup();
    }
  });

  popupAboutBtn?.addEventListener('click', () => {
    closeWelcomePopup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  popupLinks.forEach(link => {
    link.addEventListener('click', closeWelcomePopup);
  });

  // Universal fallback: ensures the video plays on the very first click anywhere on the page if blocked
  document.addEventListener('click', () => {
    const heroVideo = document.getElementById('heroGif');
    if (heroVideo && heroVideo.paused) {
      heroVideo.play().catch(() => {});
    }
  }, { once: true });

  // --- Menu Database & Rendering ---
  const menuData = {
    'Must Try!': [
      { name: "Chicken Con Carne & Fries", price: "₱249.00", desc: "Crispy fries loaded with savory chicken con carne and delicious sauces." },
      { name: "Ube Latte", price: "₱175.00", desc: "A creamy signature ube-infused specialty coffee blend." },
      { name: "KITTY TREAT TRIO", price: "₱299.00", desc: "Special trio snack platter served with your favorite iced beverage and keychain souvenir." },
      { name: "Seasalt Latte", price: "₱175.00", desc: "Rich espresso combined with smooth milk and a velvety salted cream topping." },
      { name: "MEOW PLATTER", price: "₱349.00", desc: "Ultimate sharing platter with crispy fries, chicken tenders, onion rings, and dipping sauces." },
      { name: "Meow Chicken Tender Bread and Fries", price: "₱225.00", desc: "Golden chicken tenders served with waffle bites, crispy fries, and rich dips." },
      { name: "Meow Special Latte", price: "₱195.00", desc: "Our house signature espresso drink crafted with a special sweet milk blend." },
      { name: "Crispy Kare Kare Rice Meal", price: "₱275.00", desc: "Crispy fried main served with rich peanut sauce, steamed rice, veggies, and bagoong." },
      { name: "Nachos Supreme", price: "₱199.00", desc: "Crispy tortilla chips smothered in melted cheese, savory toppings, and special sauce drizzle." },
      { name: "Red Mojito Breeze", price: "₱185.00", desc: "Refreshing berries and mint-infused sparkling cooler." },
      { name: "Biscoff Lotus Latte", price: "₱185.00", desc: "Decadent iced coffee blended with sweet Lotus Biscoff cookie spread." },
      { name: "Tres Leches", price: "₱185.00", desc: "Indulgent three-milk specialty espresso creation." }
    ],
    'Dessert': [
      { name: "Hello Meow Crepe", price: "₱150.00", desc: "Delicate crepe drizzled with sweet chocolate syrup and topped with rich garnishes." }
    ],
    'Coffee': [
      { name: "Ube Latte", price: "₱175.00", desc: "Creamy signature ube-infused espresso blend." },
      { name: "Seasalt Latte", price: "₱175.00", desc: "Rich espresso combined with smooth milk and velvety salted cream." },
      { name: "Meow Special Latte", price: "₱195.00", desc: "House signature espresso drink with a special sweet milk blend." },
      { name: "Biscoff Lotus Latte", price: "₱185.00", desc: "Decadent iced coffee layered with Lotus Biscoff cookie flavor." },
      { name: "Tres Leches", price: "₱185.00", desc: "Indulgent three-milk specialty espresso drink." },
      { name: "Spanish Latte", price: "₱185.00", desc: "Classic rich espresso sweetened with condensed milk." },
      { name: "Chocolate Chip Cookie", price: "₱185.00", desc: "Rich espresso infused with chocolate chip cookie flavors." },
      { name: "Cafe Americano", price: "₱150.00", desc: "Classic bold espresso diluted with hot or cold water." },
      { name: "Butter Cookie Latte", price: "₱185.00", desc: "Smooth coffee blended with buttery cookie notes." },
      { name: "Mocha Forest Cookie", price: "₱185.00", desc: "Rich mocha espresso paired with decadent cookie flavor." },
      { name: "Caramel Macchiato", price: "₱185.00", desc: "Espresso with steamed milk and sweet caramel drizzle." },
      { name: "White Chocolate Almond Coffee", price: "₱185.00", desc: "Smooth white chocolate paired with nutty almond coffee." },
      { name: "Mocha Hazelnut", price: "₱185.00", desc: "Rich chocolate mocha layered with aromatic hazelnut." },
      { name: "Mocha", price: "₱185.00", desc: "Classic combination of rich dark cocoa and espresso." },
      { name: "Cappuccino", price: "₱175.00", desc: "Balanced espresso topped with dense milk foam." },
      { name: "Cafe Latte", price: "₱175.00", desc: "Smooth espresso poured over creamy steamed milk." }
    ],
    'Non-Coffee': [
      { name: "Blueberry Matcha", price: "₱185.00", desc: "Earthy matcha blended with sweet blueberry notes." },
      { name: "Strawberry Matcha", price: "₱185.00", desc: "Refreshing strawberry combined with smooth matcha green tea." },
      { name: "Mango Cooler", price: "₱185.00", desc: "Fruity and sweet tropical mango blended refresher." },
      { name: "Matcha Choco", price: "₱185.00", desc: "Rich chocolate paired with premium matcha green tea." },
      { name: "Matcha Yogurt", price: "₱185.00", desc: "Creamy yogurt infused with earthy matcha flavor." },
      { name: "Blueberry Yogurt", price: "₱185.00", desc: "Tangy yogurt blended with sweet blueberry flavor." },
      { name: "Matcha Cookie Pot", price: "₱195.00", desc: "Creamy matcha beverage topped with crushed cookie bits." },
      { name: "Ube Queso", price: "₱195.00", desc: "Sweet ube purple yam blended with rich cheese flavor." },
      { name: "Tri Choco", price: "₱195.00", desc: "Triple chocolate decadent blended beverage." },
      { name: "Creamy Butterfly Rose", price: "₱195.00", desc: "Creamy floral rose-infused specialty drink." },
      { name: "Strawberry Smooth", price: "₱195.00", desc: "Smooth and creamy strawberry blended beverage." },
      { name: "Almond Cookie Mocha", price: "₱195.00", desc: "Nutty almond cookie flavored rich chocolate blend." },
      { name: "Red Velvet", price: "₱195.00", desc: "Decadent red velvet cake flavored creamy beverage." },
      { name: "Honey Dew", price: "₱195.00", desc: "Sweet and refreshing honeydew melon blended drink." },
      { name: "Raspberry Tart", price: "₱195.00", desc: "Tangy and sweet raspberry tart flavored beverage." },
      { name: "Taro Cheesecake", price: "₱195.00", desc: "Creamy taro blended with rich cheesecake notes." }
    ],
    'Refreshment': [
      { name: "Berry Swirl", price: "₱150.00", desc: "Refreshing mixed berry fruit swirl cooler." },
      { name: "Blue Hawaiian Delight", price: "₱150.00", desc: "Tropical blue citrus sparkling refresher." },
      { name: "Red Mojito Breeze", price: "₱185.00", desc: "Refreshing berries and mint-infused sparkling cooler." },
      { name: "Lychee Rose Matcha", price: "₱150.00", desc: "Floral lychee and rose infused refreshing drink." },
      { name: "Pink Splash", price: "₱150.00", desc: "Vibrant and sweet fruity pink refresher." },
      { name: "Red Rose Mint", price: "₱150.00", desc: "Cooling mint combined with sweet red rose infusion." },
      { name: "Watermelon Mojito", price: "₱155.00", desc: "Refreshing watermelon cooler with a hint of mint." },
      { name: "Blueberry Pine", price: "₱155.00", desc: "Sweet blueberry paired with tangy pineapple refresher." },
      { name: "Green Apple Mojito", price: "₱155.00", desc: "Crisp green apple flavored sparkling refreshment." },
      { name: "Sunshine Carrot Juice", price: "₱155.00", desc: "Healthy and refreshing fresh carrot fruit juice." },
      { name: "Cucumber Cooler", price: "₱155.00", desc: "Crisp and ultra-refreshing cucumber beverage." },
      { name: "Meow Chocolate", price: "₱125.00", desc: "Rich and comforting iced chocolate refreshment." },
      { name: "Meow Orange", price: "₱125.00", desc: "Bright and citrusy sweet orange fruit juice." },
      { name: "Strawberry Latte", price: "₱155.00", desc: "Creamy milk layered with sweet strawberry puree." }
    ],
    'Appetizers': [
      { name: "Chicken Con Carne & Fries", price: "₱249.00", desc: "Crispy fries loaded with savory chicken con carne and sauces." },
      { name: "MEOP PLATTER", price: "₱349.00", desc: "Ultimate sharing snack platter with fries, tenders, and onion rings." },
      { name: "Meow Chicken Tender Bread and Fries", price: "₱225.00", desc: "Golden chicken tenders served with crispy fries and dips." },
      { name: "Nachos Supreme", price: "₱199.00", desc: "Crispy tortilla chips smothered in melted cheese and savory toppings." },
      { name: "Beef Nachos", price: "₱225.00", desc: "Crispy tortilla chips topped with seasoned ground beef and cheese sauce." },
      { name: "Cheese Sticks", price: "₱175.00", desc: "Crispy fried golden pastry wrapped cheese sticks." },
      { name: "Crincut Fries", price: "₱150.00", desc: "Classic seasoned golden crinkle-cut fries." },
      { name: "Chicken Nuggets", price: "₱150.00", desc: "Crispy bite-sized breaded chicken nuggets." },
      { name: "Hashbrown", price: "₱125.00", desc: "Crispy golden fried potato hashbrowns." },
      { name: "Onion Rings", price: "₱125.00", desc: "Crispy breaded onion rings fried to perfection." },
      { name: "Fries with Dip", price: "₱125.00", desc: "Classic golden fries served with a side of delicious dip." }
    ],
    'Pasta': [
      { name: "Chicken Alfredo", price: "₱250.00", desc: "Creamy Alfredo pasta served with savory chicken and side waffle bites." },
      { name: "Tuna Pesto", price: "₱250.00", desc: "Aromatic basil pesto pasta tossed with tuna and side waffle bites." },
      { name: "Spaghetti Bolognese", price: "₱250.00", desc: "Classic rich tomato and meat sauce spaghetti served with side waffle bites." },
      { name: "Taco Spaghetti", price: "₱225.00", desc: "Spaghetti tossed in a flavorful taco-inspired seasoned meat sauce." }
    ],
    'Sandwich': [
      { name: "Kitty Corned Beef, Egg & Cheese Sandwich", price: "₱130.00", desc: "Cozy sandwich filled with corned beef, egg, and melted cheese." },
      { name: "All Day Bulgogi, Egg & Fries Sandwich", price: "₱199.00", desc: "Savory bulgogi beef sandwich served with egg and a side of fries." },
      { name: "All Day Corned Beef, Egg & Fries Sandwich", price: "₱199.00", desc: "Hearty corned beef and egg sandwich served with a side of crispy fries." },
      { name: "Meow Clubhouse", price: "₱225.00", desc: "Classic multi-layered clubhouse sandwich loaded with premium fillings and fries." },
      { name: "Kitty Spam, Egg & Cheese Sandwich", price: "₱130.00", desc: "Comforting sandwich layered with spam, egg, and cheese." },
      { name: "All Day Bacon, Egg & Fries Sandwich", price: "₱199.00", desc: "Crispy bacon and egg sandwich served with a side of fries." },
      { name: "All Day Spam, Egg & Fries Sandwich", price: "₱199.00", desc: "Savory spam and egg sandwich served with a side of crispy fries." },
      { name: "All Day Hungarian, Egg & Fries Sandwich", price: "₱199.00", desc: "Flavorful Hungarian sausage sandwich with egg and side fries." },
      { name: "Kitty Sausage, Egg & Cheese Sandwich", price: "₱130.00", desc: "Tasty sausage patty layered with egg and cheese in a toasted sandwich." },
      { name: "Kitty Ham, Egg & Cheese Sandwich", price: "₱130.00", desc: "Classic ham, egg, and melted cheese toasted sandwich." },
      { name: "Kitty Bacon, Egg & Cheese Sandwich", price: "₱130.00", desc: "Crispy bacon, egg, and melted cheese toasted sandwich." }
    ],
    'Rice Meal': [
      { name: "Meow Pork Mix Rice", price: "₱225.00", desc: "Savory pork mix served with steamed rice and cucumber slices." },
      { name: "Chicken Francese Rice Meal", price: "₱225.00", desc: "Tender chicken steak served with rice and vegetables." },
      { name: "Bacon & Egg Rice Meal", price: "₱150.00", desc: "Classic breakfast bacon and fried egg served with rice." },
      { name: "Corned Beef & Egg Rice Meal", price: "₱175.00", desc: "Hearty corned beef and fried egg served with rice." },
      { name: "Spam & Egg Rice Meal", price: "₱150.00", desc: "Pan-fried spam slice and egg served with rice." },
      { name: "Crispy Kare Kare Rice Meal", price: "₱275.00", desc: "Crispy fried main served with rich peanut sauce, rice, veggies, and bagoong." },
      { name: "Bibimbap", price: "₱250.00", desc: "Traditional Korean rice bowl topped with seasoned vegetables, meat, and egg." },
      { name: "Shawarma Rice", price: "₱250.00", desc: "Spiced meat over flavorful rice topped with garlic sauce and fresh veggies." },
      { name: "Korean Tonkatsu Rice Meal", price: "₱250.00", desc: "Crispy Korean-style breaded pork cutlet served with rice and side veggies." },
      { name: "Spicy Garlic Longganisa & Egg Rice Meal", price: "₱225.00", desc: "Flavorful spicy garlic sausage served with egg and rice." },
      { name: "Mexican Cheesy Chicken Rice Meal", price: "₱250.00", desc: "Chicken meal topped with Mexican cheese sauce, served with rice and fresh sides." },
      { name: "Crispy Pork Binagoongan Rice Meal", price: "₱250.00", desc: "Crispy pork simmered in savory shrimp paste sauce served with rice and eggplant." },
      { name: "Crispy Pork Sisig Rice Meal", price: "₱250.00", desc: "Sizzling style crispy pork sisig served with rice and vegetables." },
      { name: "Lemon Karaage Rice Meal", price: "₱225.00", desc: "Japanese-style fried chicken cutlet drizzled with tangy lemon sauce, served with rice." },
      { name: "Bicol Express Rice Meal", price: "₱225.00", desc: "Spicy pork dish cooked in rich coconut milk and chili peppers, served with rice." },
      { name: "Hungarian & Egg Rice Meal", price: "₱199.00", desc: "Juicy Hungarian sausage served with egg and rice." },
      { name: "Dumpling & Egg Rice Meal", price: "₱199.00", desc: "Crispy dumplings served with egg and rice." },
      { name: "Chicken Nuggets & Egg Rice Meal", price: "₱199.00", desc: "Golden chicken nuggets served with egg and rice." }
    ],
    'Salad': [
      { name: "Tuna Korean Salad", price: "₱225.00", desc: "Fresh salad bowl featuring tuna and Korean-inspired ingredients." },
      { name: "Kani Salad", price: "₱225.00", desc: "Fresh salad featuring kani (crab sticks) and crisp vegetables." },
      { name: "Chinese Salad", price: "₱225.00", desc: "Crisp salad topped with chicken, olives, and vegetables." }
    ],
    'Waffle': [
      { name: "Biscoff Waffle", price: "₱199.00", desc: "Delicious waffle topped with sweet Biscoff spread and delightful toppings." },
      { name: "Blueberry Waffle", price: "₱150.00", desc: "Fluffy waffle topped with sweet blueberry, whipped cream, sprinkles, and a cherry." },
      { name: "Strawberry Waffle", price: "₱150.00", desc: "Fluffy waffle topped with sweet strawberry, whipped cream, sprinkles, and a cherry." },
      { name: "Nutella Waffle", price: "₱150.00", desc: "Fluffy waffle smothered in rich Nutella, whipped cream, sprinkles, and a cherry." }
    ],
    'Ramen': [
      { name: "Laksa", price: "₱299.00", desc: "Rich and flavorful laksa noodle soup served with chicken, soft-boiled eggs, fish balls, and fresh herbs." }
    ],
    'Cocktails': [
      { name: "Red Lagoon", price: "₱150.00", desc: "Refreshing red citrus and vodka cocktail." },
      { name: "Shirley Temple", price: "₱175.00", desc: "Classic sweet grenadine and ginger beverage[cite: 23]." },
      { name: "Mojito", price: "₱175.00", desc: "Refreshing rum cocktail infused with fresh mint and lime[cite: 23]." },
      { name: "Blue Lagoon", price: "₱150.00", desc: "Vibrant blue tropical citrus and vodka cocktail[cite: 23]." },
      { name: "Watermelon Tequila", price: "₱175.00", desc: "Smooth tequila blended with sweet watermelon flavor[cite: 23]." },
      { name: "Frozen Margarita", price: "₱175.00", desc: "Blended refreshing tequila, lime, and citrus cocktail[cite: 23]." }
    ]
  };

  let activeCategory = null;

  function parsePrice(priceStr) {
    return parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) || 0;
  }

  function renderCategoryItems() {
    if (!activeCategory) return;
    const drawerGrid = document.getElementById('drawerItemsGrid');
    const sortValue = document.getElementById('priceSortSelect')?.value || 'default';
    let items = [...(menuData[activeCategory] || [])];

    if (sortValue === 'low-high') {
      items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortValue === 'high-low') {
      items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    if (!drawerGrid) return;
    drawerGrid.innerHTML = '';
    
    if (items.length === 0) {
      drawerGrid.innerHTML = '<p class="text-brand-muted text-sm col-span-2 py-4 text-center">No items listed in this category yet.</p>';
    } else {
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-brand-cream/60 border border-gray-100 flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start gap-2 mb-1">
              <h4 class="font-heading font-bold text-sm text-brand-dark">${item.name}</h4>
              <span class="font-heading font-extrabold text-xs text-brand-orange bg-brand-orange-light px-2.5 py-1 rounded-full whitespace-nowrap">${item.price}</span>
            </div>
            <p class="text-xs text-brand-muted leading-relaxed">${item.desc}</p>
          </div>
        `;
        drawerGrid.appendChild(card);
      });
    }
  }

  function selectCategory(categoryName) {
    const bubbles = document.querySelectorAll('.menu-bubble');
    const drawerContainer = document.getElementById('menuDrawerContainer');
    const drawerTitle = document.getElementById('drawerCategoryTitle');
    const drawerIcon = document.getElementById('drawerCategoryIcon');
    const sortSelect = document.getElementById('priceSortSelect');

    if (activeCategory === categoryName) {
      closeMenuDrawer();
      return;
    }

    activeCategory = categoryName;
    if (sortSelect) sortSelect.value = 'default';

    bubbles.forEach(bubble => {
      const catVal = bubble.getAttribute('data-category');
      if (catVal === categoryName) {
        bubble.className = 'menu-bubble group p-5 rounded-2xl bg-brand text-white shadow-md hover:shadow-lg transition-all text-center flex flex-col items-center justify-center gap-2 border border-transparent';
      } else {
        bubble.className = 'menu-bubble group p-5 rounded-2xl bg-white text-brand-dark shadow-card hover:shadow-soft hover:border-brand-turquoise transition-all text-center flex flex-col items-center justify-center gap-2 border border-gray-100';
      }
    });

    let currentEmoji = '🍽️';
    bubbles.forEach(b => {
      if (b.getAttribute('data-category') === categoryName) {
        currentEmoji = b.querySelector('span:first-child').textContent;
      }
    });

    if (drawerTitle) drawerTitle.textContent = categoryName;
    if (drawerIcon) drawerIcon.textContent = currentEmoji;

    renderCategoryItems();

    if (drawerContainer) {
      drawerContainer.classList.remove('max-h-0', 'opacity-0');
      drawerContainer.classList.add('max-h-[800px]', 'opacity-100');

      setTimeout(() => {
        drawerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }

  function closeMenuDrawer() {
    const drawerContainer = document.getElementById('menuDrawerContainer');
    const bubbles = document.querySelectorAll('.menu-bubble');
    if (drawerContainer) {
      drawerContainer.classList.remove('max-h-[800px]', 'opacity-100');
      drawerContainer.classList.add('max-h-0', 'opacity-0');
    }
    activeCategory = null;

    bubbles.forEach(bubble => {
      bubble.className = 'menu-bubble group p-5 rounded-2xl bg-white text-brand-dark shadow-card hover:shadow-soft hover:border-brand-turquoise transition-all text-center flex flex-col items-center justify-center gap-2 border border-gray-100';
    });
  }

  document.querySelectorAll('.menu-bubble').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      selectCategory(category);
    });
  });

  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeMenuDrawer);
  document.getElementById('priceSortSelect')?.addEventListener('change', renderCategoryItems);

  // --- Events Gallery ---
  const defaultEvents = [
    {
      title: "Paws & Coffee Meetup",
      date: "September 20, 2026",
      image: "https://res.cloudinary.com/tfk63bnl/image/upload/f_auto,q_auto/hmc_banner",
      description: "A wonderful afternoon gathering with local cat parents, sharing tips on feline wellness and enjoying fresh artisanal brews."
    }
  ];

  function renderEvents() {
    const grid = document.getElementById('eventsGrid');
    const badge = document.getElementById('eventCountBadge');
    if (badge) badge.textContent = `${defaultEvents.length} Events Displayed`;
    if (!grid) return;

    grid.innerHTML = '';
    defaultEvents.forEach((ev) => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100 flex flex-col justify-between group hover:shadow-soft transition-all';
      card.innerHTML = `
        <div>
          <div class="relative h-56 overflow-hidden bg-gray-100">
            <img src="${ev.image}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">${ev.date}</span>
          </div>
          <div class="p-6">
            <h3 class="font-heading font-bold text-xl text-brand-dark mb-2">${ev.title}</h3>
            <p class="text-xs text-brand-muted leading-relaxed">${ev.description}</p>
          </div>
        </div>
        <div class="px-6 pb-6 pt-2 flex justify-between items-center border-t border-gray-50">
          <span class="text-[11px] font-bold text-brand-turquoise uppercase">Hello Meow Community</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }
  renderEvents();

  // --- Mobile Nav Controls ---
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileOverlay = document.getElementById('mobileMenuOverlay');
  const mobileDrawer = document.getElementById('mobileMenuDrawer');
  const mobileClose = document.getElementById('mobileMenuClose');
  const mainHeader = document.getElementById('mainHeader');

  function toggleMobileMenu(open) {
    if (open) {
      mobileOverlay?.classList.remove('opacity-0', 'pointer-events-none');
      mobileDrawer?.classList.remove('translate-x-full');
    } else {
      mobileOverlay?.classList.add('opacity-0', 'pointer-events-none');
      mobileDrawer?.classList.add('translate-x-full');
    }
  }

  mobileToggle?.addEventListener('click', () => toggleMobileMenu(true));
  mobileClose?.addEventListener('click', () => toggleMobileMenu(false));
  mobileOverlay?.addEventListener('click', (e) => {
    if (e.target === mobileOverlay) toggleMobileMenu(false);
  });

  document.querySelectorAll('.mobile-nav-link, #mobileReserveBtn').forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // --- Scroll Header Behavior ---
  window.addEventListener('scroll', () => {
    if (!mainHeader) return;
    const logoTitle = mainHeader.querySelector('.logo-title');
    const logoSub = mainHeader.querySelector('.logo-subtitle');
    const navLinks = mainHeader.querySelectorAll('nav a');

    if (window.scrollY > 50) {
      mainHeader.classList.add('bg-white/95', 'shadow-md', 'py-3', 'backdrop-blur-md');
      mainHeader.classList.remove('bg-transparent', 'py-4');
      if (logoTitle) logoTitle.className = 'logo-title text-brand-dark';
      if (logoSub) logoSub.className = 'logo-subtitle text-brand-turquoise';
      navLinks.forEach(link => {
        link.className = 'hover:text-brand-turquoise transition-colors font-semibold text-sm text-brand-dark';
      });
    } else {
      mainHeader.classList.remove('bg-white/95', 'shadow-md', 'py-3', 'backdrop-blur-md');
      mainHeader.classList.add('bg-transparent', 'py-4');
      if (logoTitle) logoTitle.className = 'logo-title text-white drop-shadow-sm';
      if (logoSub) logoSub.className = 'logo-subtitle text-brand-turquoise-light drop-shadow-sm';
      navLinks.forEach(link => {
        link.className = 'hover:text-brand-turquoise-light transition-colors drop-shadow-sm font-semibold text-sm text-gray-200';
      });
    }
  });

  // --- Operating Hours Status ---
  function updateOperatingStatus() {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 9 && hour < 21;
    const dotClass = isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500';
    const textVal = isOpen ? 'Open Now • Closes 9 PM' : 'Closed • Opens 9 AM';

    const sDot = document.getElementById('statusDot');
    const sText = document.getElementById('statusText');
    if (sDot && sText) {
      sDot.className = `status-dot w-2.5 h-2.5 rounded-full ${dotClass}`;
      sText.textContent = textVal;
    }
  }
  updateOperatingStatus();

  // --- Action Modal Controls ---
  const modal = document.getElementById('actionModal');
  const modalContentWrapper = document.getElementById('modalContentWrapper');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');

  function openModal(type) {
    if (!modal || !modalBody || !modalContentWrapper) return;
    let content = '';
    if (type === 'visit') {
      content = `
        <h2 class="font-heading font-extrabold text-2xl text-brand-dark mb-3">Cat Lounge Reservation</h2>
        <p class="text-sm text-brand-muted mb-6">Come relax with our friendly rescue cats! Walk-ins are welcome, but reservations guarantee your slot.</p>
        <div class="space-y-4 text-left bg-brand-cream p-4 rounded-2xl mb-6">
          <div class="flex justify-between text-sm"><span class="font-bold text-brand-dark">Status:</span> <span class="text-brand-turquoise font-semibold">Walk-ins &amp; Reservations Welcome</span></div>
          <div class="flex justify-between text-sm"><span class="font-bold text-brand-dark">Hours:</span> <span class="text-brand-muted">9:00 AM – 9:00 PM Daily</span></div>
        </div>
        <a href="https://www.facebook.com/hellomeowcafe" target="_blank" class="w-full py-3.5 rounded-xl bg-brand-orange text-white font-heading font-bold uppercase text-sm tracking-wider block shadow-lg shadow-brand-orange/30 hover:bg-brand-orange-hover transition-all text-center">
          Visit Facebook Page
        </a>
      `;
    }
    modalBody.innerHTML = content;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalContentWrapper.classList.remove('scale-95');
  }

  function closeModal() {
    if (!modal || !modalContentWrapper) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    modalContentWrapper.classList.add('scale-95');
  }

  document.getElementById('reserveBtn')?.addEventListener('click', () => openModal('visit'));
  document.getElementById('loungeReserveBtn')?.addEventListener('click', () => openModal('visit'));
  document.getElementById('footerBookBtn')?.addEventListener('click', () => openModal('visit'));

  closeModalBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
});