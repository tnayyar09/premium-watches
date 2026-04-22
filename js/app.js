/* ========================================
   LUXE WATCHES - Main JavaScript
   Supabase Configuration
   ======================================== */

// ⚠️ YAHAN APNA SUPABASE URL AUR ANON KEY DAAL
const SUPABASE_URL = 'https://fxpxsmnakwqczgrhiwkl.supabase.co;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cHhzbW5ha3dxY3pncmhpd2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU5MzAsImV4cCI6MjA5MjQwMTkzMH0.-gmIrIiWakuHKOiuDnlW9ZQOJWRntDHUTkzXiU79Hao';


// WhatsApp Number (country code ke saath, + ke bina)
const WHATSAPP_NUMBER = '919876543210';

// Items per page
const ITEMS_PER_PAGE_FEATURED = 4;
const ITEMS_PER_PAGE_COLLECTION = 6;

/* ========================================
   Supabase Helper
   ======================================== */
async function supabaseQuery(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    const params = [];

    if (options.select) params.push(`select=${options.select}`);
    else params.push('select=*');

    if (options.filters) {
        options.filters.forEach(f => params.push(f));
    }

    if (options.order) params.push(`order=${options.order}`);
    if (options.limit) params.push(`limit=${options.limit}`);
    if (options.offset) params.push(`offset=${options.offset}`);

    url += params.join('&');

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.count ? 'count=exact' : ''
    };

    const res = await fetch(url, { headers });

    let count = null;
    if (options.count) {
        const contentRange = res.headers.get('content-range');
        if (contentRange) {
            count = parseInt(contentRange.split('/')[1]);
        }
    }

    const data = await res.json();
    return { data, count };
}

async function supabaseInsert(table, body) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
    });
    return res.ok;
}

/* ========================================
   Common Functions
   ======================================== */

// Preloader
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('hidden');
    }, 1500);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }

    const scrollTop = document.getElementById('scrollTop');
    if (scrollTop) {
        scrollTop.classList.toggle('visible', window.scrollY > 400);
    }
});

// Scroll to top
document.addEventListener('click', (e) => {
    if (e.target.closest('#scrollTop')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
});

// Generate WhatsApp URL
function getWhatsAppUrl(product) {
    const message = encodeURIComponent(
        `Hi! I am interested to buy this watch:\n\n` +
        `🕐 *${product.title}*\n` +
        `💰 Price: ₹${Number(product.price).toLocaleString('en-IN')}\n` +
        `📷 Image: ${product.image_url}\n\n` +
        `Please share more details!`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

// Product Card HTML
function createProductCard(product) {
    const discount = product.original_price
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;

    return `
        <div class="product-card" data-aos="fade-up">
            ${product.is_featured ? '<span class="product-badge">★ Featured</span>' : ''}
            ${discount > 0 ? `<span class="product-badge" style="left:auto;right:15px;background:#e74c3c;color:white;">${discount}% OFF</span>` : ''}
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.title}" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'">
                <div class="product-overlay"></div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'Watch'}</div>
                <h3 class="product-title">${product.title}</h3>
                <p class="product-desc">${product.short_description || ''}</p>
                <div class="product-price-row">
                    <span class="product-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
                    ${product.original_price ? `<span class="product-original-price">₹${Number(product.original_price).toLocaleString('en-IN')}</span>` : ''}
                </div>
                <a href="${getWhatsAppUrl(product)}" target="_blank" class="btn-whatsapp-buy">
                    <i class="fab fa-whatsapp"></i> Buy Now on WhatsApp
                </a>
            </div>
        </div>
    `;
}

// Skeleton Loader
function showSkeletons(container, count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += '<div class="skeleton skeleton-card"></div>';
    }
    container.innerHTML = html;
}

// Pagination HTML
function createPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';

    let html = '';

    // Prev button
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
    </button>`;

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) html += `<span style="padding:0 5px;color:var(--text-lighter)">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding:0 5px;color:var(--text-lighter)">...</span>`;
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
    </button>`;

    return html;
}

/* ========================================
   Banner Slider (Home Page)
   ======================================== */
async function initBanners() {
    const slider = document.getElementById('bannerSlider');
    const dotsContainer = document.getElementById('bannerDots');
    if (!slider) return;

    try {
        const { data: banners } = await supabaseQuery('banners', {
            filters: ['is_active=eq.true'],
            order: 'sort_order.asc'
        });

        if (!banners || banners.length === 0) {
            slider.innerHTML = `
                <div class="banner-slide active">
                    <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1400" alt="Banner">
                    <div class="banner-content">
                        <h1>Luxury Timepieces</h1>
                        <p>Discover Our Exclusive Collection</p>
                        <div class="banner-btn-group">
                            <a href="collection.html" class="btn-banner btn-banner-primary">Shop Now</a>
                            <a href="about.html" class="btn-banner btn-banner-outline">Learn More</a>
                        </div>
                    </div>
                </div>`;
            return;
        }

        // Render banner slides
        slider.innerHTML = banners.map((b, i) => `
            <div class="banner-slide ${i === 0 ? 'active' : ''}">
                <img src="${b.image_url}" alt="${b.title || 'Banner'}" loading="${i === 0 ? 'eager' : 'lazy'}">
                <div class="banner-content">
                    <h1>${b.title || 'Luxury Watches'}</h1>
                    <p>${b.subtitle || 'Discover Our Collection'}</p>
                    <div class="banner-btn-group">
                        <a href="collection.html" class="btn-banner btn-banner-primary">Shop Now</a>
                        <a href="about.html" class="btn-banner btn-banner-outline">Learn More</a>
                    </div>
                </div>
            </div>
        `).join('');

        // Dots
        dotsContainer.innerHTML = banners.map((_, i) =>
            `<button class="banner-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
        ).join('');

        let currentSlide = 0;
        const slides = slider.querySelectorAll('.banner-slide');
        const dots = dotsContainer.querySelectorAll('.banner-dot');

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        document.getElementById('prevBtn').addEventListener('click', () => goToSlide(currentSlide - 1));
        document.getElementById('nextBtn').addEventListener('click', () => goToSlide(currentSlide + 1));

        dots.forEach(dot => {
            dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
        });

        // Auto play
        let autoPlay = setInterval(() => goToSlide(currentSlide + 1), 5000);

        const banner = document.getElementById('heroBanner');
        banner.addEventListener('mouseenter', () => clearInterval(autoPlay));
        banner.addEventListener('mouseleave', () => {
            autoPlay = setInterval(() => goToSlide(currentSlide + 1), 5000);
        });

        // Touch swipe
        let touchStartX = 0;
        banner.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
        banner.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
            }
        });

    } catch (error) {
        console.error('Banner error:', error);
    }
}

/* ========================================
   Featured Products (Home Page)
   ======================================== */
let featuredPage = 1;

async function loadFeaturedProducts(page = 1) {
    const container = document.getElementById('featuredProducts');
    const paginationContainer = document.getElementById('featuredPagination');
    if (!container) return;

    showSkeletons(container, ITEMS_PER_PAGE_FEATURED);
    featuredPage = page;

    try {
        const offset = (page - 1) * ITEMS_PER_PAGE_FEATURED;

        const { data, count } = await supabaseQuery('products', {
            filters: ['is_featured=eq.true'],
            order: 'created_at.desc',
            limit: ITEMS_PER_PAGE_FEATURED,
            offset: offset,
            count: true
        });

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-watch"></i>
                    <h3>No Featured Watches Yet</h3>
                    <p>Check back soon for our curated selection!</p>
                </div>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        container.innerHTML = data.map(p => createProductCard(p)).join('');

        // Pagination
        const totalPages = Math.ceil(count / ITEMS_PER_PAGE_FEATURED);
        if (paginationContainer) {
            paginationContainer.innerHTML = createPagination(page, totalPages);
            paginationContainer.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pg = parseInt(btn.dataset.page);
                    if (pg >= 1 && pg <= totalPages) {
                        loadFeaturedProducts(pg);
                        document.querySelector('.featured-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }

    } catch (error) {
        console.error('Featured products error:', error);
        container.innerHTML = '<div class="no-products"><h3>Error loading products</h3><p>Please try again later.</p></div>';
    }
}

/* ========================================
   Collection Page
   ======================================== */
let collectionState = {
    page: 1,
    category: '',
    minPrice: null,
    maxPrice: null,
    sort: 'newest',
    categories: []
};

async function initCollection() {
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('category')) {
        collectionState.category = urlParams.get('category');
    }

    await loadCategories();
    await loadCollectionProducts();
    setupCollectionListeners();
}

async function loadCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    try {
        const { data } = await supabaseQuery('products', {
            select: 'category'
        });

        // Get unique categories with counts
        const categoryMap = {};
        data.forEach(p => {
            const cat = p.category || 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        collectionState.categories = Object.keys(categoryMap);

        let html = `
            <label class="filter-option">
                <input type="radio" name="category" value="" ${!collectionState.category ? 'checked' : ''}>
                <span class="radio-custom"></span>
                <span>All Watches</span>
                <span class="filter-count">${data.length}</span>
            </label>`;

        for (const [cat, count] of Object.entries(categoryMap)) {
            html += `
                <label class="filter-option">
                    <input type="radio" name="category" value="${cat}" ${collectionState.category === cat ? 'checked' : ''}>
                    <span class="radio-custom"></span>
                    <span>${cat}</span>
                    <span class="filter-count">${count}</span>
                </label>`;
        }

        container.innerHTML = html;

        // Category change listener
        container.querySelectorAll('input[name="category"]').forEach(input => {
            input.addEventListener('change', () => {
                collectionState.category = input.value;
                collectionState.page = 1;
                loadCollectionProducts();
                closeFilterSidebar();
            });
        });

    } catch (error) {
        console.error('Categories error:', error);
    }
}

async function loadCollectionProducts() {
    const container = document.getElementById('collectionProducts');
    const paginationContainer = document.getElementById('collectionPagination');
    const resultsInfo = document.getElementById('resultsInfo');
    if (!container) return;

    showSkeletons(container, ITEMS_PER_PAGE_COLLECTION);

    try {
        const filters = [];

        if (collectionState.category) {
            filters.push(`category=eq.${encodeURIComponent(collectionState.category)}`);
        }
        if (collectionState.minPrice) {
            filters.push(`price=gte.${collectionState.minPrice}`);
        }
        if (collectionState.maxPrice) {
            filters.push(`price=lte.${collectionState.maxPrice}`);
        }

        // Sort
        let order = 'created_at.desc';
        switch (collectionState.sort) {
            case 'price_low': order = 'price.asc'; break;
            case 'price_high': order = 'price.desc'; break;
            case 'name_asc': order = 'title.asc'; break;
            default: order = 'created_at.desc';
        }

        const offset = (collectionState.page - 1) * ITEMS_PER_PAGE_COLLECTION;

        const { data, count } = await supabaseQuery('products', {
            filters,
            order,
            limit: ITEMS_PER_PAGE_COLLECTION,
            offset,
            count: true
        });

        // Update results info
        if (resultsInfo) {
            const start = offset + 1;
            const end = Math.min(offset + ITEMS_PER_PAGE_COLLECTION, count);
            let info = `Showing ${start}-${end} of ${count} watches`;
            if (collectionState.category) info += ` in "${collectionState.category}"`;
            resultsInfo.textContent = info;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>No Watches Found</h3>
                    <p>Try adjusting your filters to find what you're looking for.</p>
                </div>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        container.innerHTML = data.map(p => createProductCard(p)).join('');

        // Pagination
        const totalPages = Math.ceil(count / ITEMS_PER_PAGE_COLLECTION);
        if (paginationContainer) {
            paginationContainer.innerHTML = createPagination(collectionState.page, totalPages);
            paginationContainer.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pg = parseInt(btn.dataset.page);
                    if (pg >= 1 && pg <= totalPages) {
                        collectionState.page = pg;
                        loadCollectionProducts();
                        document.querySelector('.products-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }

    } catch (error) {
        console.error('Collection error:', error);
        container.innerHTML = '<div class="no-products"><h3>Error loading products</h3><p>Please try again.</p></div>';
    }
}

function setupCollectionListeners() {
    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            collectionState.sort = sortSelect.value;
            collectionState.page = 1;
            loadCollectionProducts();
        });
    }

    // Price filter
    const applyPrice = document.getElementById('applyPrice');
    if (applyPrice) {
        applyPrice.addEventListener('click', () => {
            const min = document.getElementById('minPrice').value;
            const max = document.getElementById('maxPrice').value;
            collectionState.minPrice = min ? parseFloat(min) : null;
            collectionState.maxPrice = max ? parseFloat(max) : null;
            collectionState.page = 1;
            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    // Reset filters
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            collectionState.category = '';
            collectionState.minPrice = null;
            collectionState.maxPrice = null;
            collectionState.sort = 'newest';
            collectionState.page = 1;

            // Reset UI
            document.getElementById('minPrice').value = '';
            document.getElementById('maxPrice').value = '';
            document.getElementById('sortSelect').value = 'newest';

            const allRadio = document.querySelector('input[name="category"][value=""]');
            if (allRadio) allRadio.checked = true;

            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    // Mobile filter toggle
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const closeFilter = document.getElementById('closeFilter');

    if (filterToggle && filterSidebar) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('filter-overlay');
        overlay.id = 'filterOverlay';
        document.body.appendChild(overlay);

        filterToggle.addEventListener('click', () => {
            filterSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeFunc = () => {
            filterSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeFilter) closeFilter.addEventListener('click', closeFunc);
        overlay.addEventListener('click', closeFunc);
    }
}

function closeFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    const overlay = document.getElementById('filterOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ========================================
   Contact Form
   ======================================== */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        try {
            const success = await supabaseInsert('contact_messages', formData);

            if (success) {
                form.style.display = 'none';
                document.getElementById('formSuccess').style.display = 'block';
            } else {
                throw new Error('Failed to submit');
            }
        } catch (error) {
            console.error('Form error:', error);
            alert('Sorry, something went wrong. Please try WhatsApp or call us directly.');
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

/* ========================================
   Intersection Observer Animations
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe cards after they load
    setTimeout(() => {
        document.querySelectorAll('.product-card, .why-card, .mission-card, .team-card, .feature-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }, 2000);
});