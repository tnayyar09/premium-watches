/* ========================================
   LUXE WATCHES - Main JavaScript
   Supabase Configuration
   ======================================== */

// YAHAN APNA SUPABASE URL AUR ANON KEY DAAL
const SUPABASE_URL = 'https://fxpxsmnakwqczgrhiwkl.supabase.co;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cHhzbW5ha3dxY3pncmhpd2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU5MzAsImV4cCI6MjA5MjQwMTkzMH0.-gmIrIiWakuHKOiuDnlW9ZQOJWRntDHUTkzXiU79Hao';

// WhatsApp Number (country code ke saath, + ke bina)
const WHATSAPP_NUMBER = '917888525380';

// Items per page
const ITEMS_PER_PAGE_FEATURED = 4;
const ITEMS_PER_PAGE_COLLECTION = 6;

/* ========================================
   Supabase Helper
   ======================================== */
async function supabaseQuery(table, options) {
    if (!options) {
        options = {};
    }
    var url = SUPABASE_URL + '/rest/v1/' + table + '?';
    var params = [];

    if (options.select) {
        params.push('select=' + options.select);
    } else {
        params.push('select=*');
    }

    if (options.filters) {
        for (var i = 0; i < options.filters.length; i++) {
            params.push(options.filters[i]);
        }
    }

    if (options.order) {
        params.push('order=' + options.order);
    }
    if (options.limit) {
        params.push('limit=' + options.limit);
    }
    if (options.offset !== undefined && options.offset !== null) {
        params.push('offset=' + options.offset);
    }

    url += params.join('&');

    var headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': options.count ? 'count=exact' : ''
    };

    var res = await fetch(url, { headers: headers });

    var count = null;
    if (options.count) {
        var contentRange = res.headers.get('content-range');
        if (contentRange) {
            count = parseInt(contentRange.split('/')[1]);
        }
    }

    var data = await res.json();
    return { data: data, count: count };
}

async function supabaseInsert(table, body) {
    var url = SUPABASE_URL + '/rest/v1/' + table;
    var res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
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
window.addEventListener('load', function() {
    setTimeout(function() {
        var preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
        }
    }, 1500);
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    var scrollTop = document.getElementById('scrollTop');
    if (scrollTop) {
        if (window.scrollY > 400) {
            scrollTop.classList.add('visible');
        } else {
            scrollTop.classList.remove('visible');
        }
    }
});

// Scroll to top
document.addEventListener('click', function(e) {
    if (e.target.closest('#scrollTop')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Mobile menu
document.addEventListener('DOMContentLoaded', function() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        var links = navLinks.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        }
    }
});

// Format price
function formatPrice(price) {
    return Number(price).toLocaleString('en-IN');
}

// Generate WhatsApp URL
function getWhatsAppUrl(product) {
    var text = 'Hi! I am interested to buy this watch:\n\n' +
        product.title + '\n' +
        'Price: Rs.' + formatPrice(product.price) + '\n' +
        'Image: ' + product.image_url + '\n\n' +
        'Please share more details!';
    var encoded = encodeURIComponent(text);
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encoded;
}

// Product Card HTML
function createProductCard(product) {
    var discount = 0;
    if (product.original_price && product.original_price > 0) {
        discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }

    var card = document.createElement('div');
    card.className = 'product-card';

    var badgeHtml = '';
    if (product.is_featured) {
        badgeHtml += '<span class="product-badge">&#9733; Featured</span>';
    }
    if (discount > 0) {
        badgeHtml += '<span class="product-badge" style="left:auto;right:15px;background:#e74c3c;color:white;">' + discount + '% OFF</span>';
    }

    var originalPriceHtml = '';
    if (product.original_price && product.original_price > 0) {
        originalPriceHtml = '<span class="product-original-price">Rs.' + formatPrice(product.original_price) + '</span>';
    }

    card.innerHTML = badgeHtml +
        '<div class="product-image">' +
            '<img src="' + product.image_url + '" alt="' + product.title + '" loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600\'">' +
            '<div class="product-overlay"></div>' +
        '</div>' +
        '<div class="product-info">' +
            '<div class="product-category">' + (product.category || 'Watch') + '</div>' +
            '<h3 class="product-title">' + product.title + '</h3>' +
            '<p class="product-desc">' + (product.short_description || '') + '</p>' +
            '<div class="product-price-row">' +
                '<span class="product-price">Rs.' + formatPrice(product.price) + '</span>' +
                originalPriceHtml +
            '</div>' +
            '<a href="' + getWhatsAppUrl(product) + '" target="_blank" class="btn-whatsapp-buy">' +
                '<i class="fab fa-whatsapp"></i> Buy Now on WhatsApp' +
            '</a>' +
        '</div>';

    return card;
}

// Show Skeleton Loaders
function showSkeletons(container, count) {
    if (!count) count = 4;
    var html = '';
    for (var i = 0; i < count; i++) {
        html += '<div class="skeleton skeleton-card"></div>';
    }
    container.innerHTML = html;
}

// Create Pagination HTML
function createPagination(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    var html = '';

    // Prev button
    html += '<button class="page-btn ' + (currentPage === 1 ? 'disabled' : '') + '" data-page="' + (currentPage - 1) + '">';
    html += '<i class="fas fa-chevron-left"></i></button>';

    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += '<button class="page-btn" data-page="1">1</button>';
        if (startPage > 2) {
            html += '<span style="padding:0 5px;color:#999">...</span>';
        }
    }

    for (var i = startPage; i <= endPage; i++) {
        html += '<button class="page-btn ' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span style="padding:0 5px;color:#999">...</span>';
        }
        html += '<button class="page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
    }

    // Next button
    html += '<button class="page-btn ' + (currentPage === totalPages ? 'disabled' : '') + '" data-page="' + (currentPage + 1) + '">';
    html += '<i class="fas fa-chevron-right"></i></button>';

    return html;
}

// Bind pagination clicks
function bindPagination(containerId, totalPages, callback) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var btns = container.querySelectorAll('.page-btn:not(.disabled)');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            var pg = parseInt(this.getAttribute('data-page'));
            if (pg >= 1 && pg <= totalPages) {
                callback(pg);
            }
        });
    }
}

/* ========================================
   Banner Slider (Home Page)
   ======================================== */
async function initBanners() {
    var slider = document.getElementById('bannerSlider');
    var dotsContainer = document.getElementById('bannerDots');
    if (!slider) return;

    try {
        var result = await supabaseQuery('banners', {
            filters: ['is_active=eq.true'],
            order: 'sort_order.asc'
        });
        var banners = result.data;

        if (!banners || banners.length === 0) {
            slider.innerHTML =
                '<div class="banner-slide active">' +
                    '<img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1400" alt="Banner">' +
                    '<div class="banner-content">' +
                        '<h1>Luxury Timepieces</h1>' +
                        '<p>Discover Our Exclusive Collection</p>' +
                        '<div class="banner-btn-group">' +
                            '<a href="collection.html" class="btn-banner btn-banner-primary">Shop Now</a>' +
                            '<a href="about.html" class="btn-banner btn-banner-outline">Learn More</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            return;
        }

        // Render slides
        var slidesHtml = '';
        var dotsHtml = '';
        for (var i = 0; i < banners.length; i++) {
            var b = banners[i];
            var isActive = i === 0 ? ' active' : '';
            slidesHtml +=
                '<div class="banner-slide' + isActive + '">' +
                    '<img src="' + b.image_url + '" alt="' + (b.title || 'Banner') + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '">' +
                    '<div class="banner-content">' +
                        '<h1>' + (b.title || 'Luxury Watches') + '</h1>' +
                        '<p>' + (b.subtitle || 'Discover Our Collection') + '</p>' +
                        '<div class="banner-btn-group">' +
                            '<a href="collection.html" class="btn-banner btn-banner-primary">Shop Now</a>' +
                            '<a href="about.html" class="btn-banner btn-banner-outline">Learn More</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            dotsHtml += '<button class="banner-dot' + isActive + '" data-index="' + i + '"></button>';
        }

        slider.innerHTML = slidesHtml;
        dotsContainer.innerHTML = dotsHtml;

        var currentSlide = 0;
        var slides = slider.querySelectorAll('.banner-slide');
        var dots = dotsContainer.querySelectorAll('.banner-dot');

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = ((index % slides.length) + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                goToSlide(currentSlide - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                goToSlide(currentSlide + 1);
            });
        }

        for (var d = 0; d < dots.length; d++) {
            dots[d].addEventListener('click', function() {
                goToSlide(parseInt(this.getAttribute('data-index')));
            });
        }

        // Auto play
        var autoPlay = setInterval(function() {
            goToSlide(currentSlide + 1);
        }, 5000);

        var bannerEl = document.getElementById('heroBanner');
        if (bannerEl) {
            bannerEl.addEventListener('mouseenter', function() {
                clearInterval(autoPlay);
            });
            bannerEl.addEventListener('mouseleave', function() {
                autoPlay = setInterval(function() {
                    goToSlide(currentSlide + 1);
                }, 5000);
            });

            // Touch swipe
            var touchStartX = 0;
            bannerEl.addEventListener('touchstart', function(e) {
                touchStartX = e.touches[0].clientX;
            });
            bannerEl.addEventListener('touchend', function(e) {
                var diff = touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        goToSlide(currentSlide + 1);
                    } else {
                        goToSlide(currentSlide - 1);
                    }
                }
            });
        }

    } catch (error) {
        console.error('Banner error:', error);
    }
}

/* ========================================
   Featured Products (Home Page)
   ======================================== */
var featuredPage = 1;

async function loadFeaturedProducts(page) {
    if (!page) page = 1;

    var container = document.getElementById('featuredProducts');
    var paginationContainer = document.getElementById('featuredPagination');
    if (!container) return;

    showSkeletons(container, ITEMS_PER_PAGE_FEATURED);
    featuredPage = page;

    try {
        var offset = (page - 1) * ITEMS_PER_PAGE_FEATURED;

        var result = await supabaseQuery('products', {
            filters: ['is_featured=eq.true'],
            order: 'created_at.desc',
            limit: ITEMS_PER_PAGE_FEATURED,
            offset: offset,
            count: true
        });

        var data = result.data;
        var count = result.count;

        if (!data || data.length === 0) {
            container.innerHTML =
                '<div class="no-products">' +
                    '<i class="fas fa-clock"></i>' +
                    '<h3>No Featured Watches Yet</h3>' +
                    '<p>Check back soon for our curated selection!</p>' +
                '</div>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Clear and add cards
        container.innerHTML = '';
        for (var i = 0; i < data.length; i++) {
            var card = createProductCard(data[i]);
            container.appendChild(card);
        }

        // Pagination
        var totalPages = Math.ceil(count / ITEMS_PER_PAGE_FEATURED);
        if (paginationContainer) {
            paginationContainer.innerHTML = createPagination(page, totalPages);
            bindPagination('featuredPagination', totalPages, function(pg) {
                loadFeaturedProducts(pg);
                var section = document.querySelector('.featured-section');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
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
var collectionState = {
    page: 1,
    category: '',
    minPrice: null,
    maxPrice: null,
    sort: 'newest'
};

async function initCollection() {
    // Check URL params
    var urlParams = new URLSearchParams(window.location.search);
    var catParam = urlParams.get('category');
    if (catParam) {
        collectionState.category = catParam;
    }

    await loadCategories();
    await loadCollectionProducts();
    setupCollectionListeners();
}

async function loadCategories() {
    var container = document.getElementById('categoryFilters');
    if (!container) return;

    try {
        var result = await supabaseQuery('products', {
            select: 'category'
        });
        var data = result.data;

        // Get unique categories with counts
        var categoryMap = {};
        for (var i = 0; i < data.length; i++) {
            var cat = data[i].category || 'General';
            if (categoryMap[cat]) {
                categoryMap[cat]++;
            } else {
                categoryMap[cat] = 1;
            }
        }

        var html = '<label class="filter-option">' +
            '<input type="radio" name="category" value=""' + (!collectionState.category ? ' checked' : '') + '>' +
            '<span class="radio-custom"></span>' +
            '<span>All Watches</span>' +
            '<span class="filter-count">' + data.length + '</span>' +
            '</label>';

        var cats = Object.keys(categoryMap);
        for (var j = 0; j < cats.length; j++) {
            var c = cats[j];
            var cnt = categoryMap[c];
            html += '<label class="filter-option">' +
                '<input type="radio" name="category" value="' + c + '"' + (collectionState.category === c ? ' checked' : '') + '>' +
                '<span class="radio-custom"></span>' +
                '<span>' + c + '</span>' +
                '<span class="filter-count">' + cnt + '</span>' +
                '</label>';
        }

        container.innerHTML = html;

        // Category change listener
        var inputs = container.querySelectorAll('input[name="category"]');
        for (var k = 0; k < inputs.length; k++) {
            inputs[k].addEventListener('change', function() {
                collectionState.category = this.value;
                collectionState.page = 1;
                loadCollectionProducts();
                closeFilterSidebar();
            });
        }

    } catch (error) {
        console.error('Categories error:', error);
    }
}

async function loadCollectionProducts() {
    var container = document.getElementById('collectionProducts');
    var paginationContainer = document.getElementById('collectionPagination');
    var resultsInfo = document.getElementById('resultsInfo');
    if (!container) return;

    showSkeletons(container, ITEMS_PER_PAGE_COLLECTION);

    try {
        var filters = [];

        if (collectionState.category) {
            filters.push('category=eq.' + encodeURIComponent(collectionState.category));
        }
        if (collectionState.minPrice) {
            filters.push('price=gte.' + collectionState.minPrice);
        }
        if (collectionState.maxPrice) {
            filters.push('price=lte.' + collectionState.maxPrice);
        }

        // Sort
        var order = 'created_at.desc';
        if (collectionState.sort === 'price_low') {
            order = 'price.asc';
        } else if (collectionState.sort === 'price_high') {
            order = 'price.desc';
        } else if (collectionState.sort === 'name_asc') {
            order = 'title.asc';
        }

        var offset = (collectionState.page - 1) * ITEMS_PER_PAGE_COLLECTION;

        var result = await supabaseQuery('products', {
            filters: filters,
            order: order,
            limit: ITEMS_PER_PAGE_COLLECTION,
            offset: offset,
            count: true
        });

        var data = result.data;
        var count = result.count;

        // Update results info
        if (resultsInfo) {
            var start = offset + 1;
            var end = Math.min(offset + ITEMS_PER_PAGE_COLLECTION, count);
            var info = 'Showing ' + start + '-' + end + ' of ' + count + ' watches';
            if (collectionState.category) {
                info += ' in "' + collectionState.category + '"';
            }
            resultsInfo.textContent = info;
        }

        if (!data || data.length === 0) {
            container.innerHTML =
                '<div class="no-products">' +
                    '<i class="fas fa-search"></i>' +
                    '<h3>No Watches Found</h3>' +
                    '<p>Try adjusting your filters to find what you are looking for.</p>' +
                '</div>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Clear and add cards
        container.innerHTML = '';
        for (var i = 0; i < data.length; i++) {
            var card = createProductCard(data[i]);
            container.appendChild(card);
        }

        // Pagination
        var totalPages = Math.ceil(count / ITEMS_PER_PAGE_COLLECTION);
        if (paginationContainer) {
            paginationContainer.innerHTML = createPagination(collectionState.page, totalPages);
            bindPagination('collectionPagination', totalPages, function(pg) {
                collectionState.page = pg;
                loadCollectionProducts();
                var area = document.querySelector('.products-area');
                if (area) {
                    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

    } catch (error) {
        console.error('Collection error:', error);
        container.innerHTML = '<div class="no-products"><h3>Error loading products</h3><p>Please try again.</p></div>';
    }
}

function setupCollectionListeners() {
    // Sort
    var sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            collectionState.sort = sortSelect.value;
            collectionState.page = 1;
            loadCollectionProducts();
        });
    }

    // Price filter
    var applyPrice = document.getElementById('applyPrice');
    if (applyPrice) {
        applyPrice.addEventListener('click', function() {
            var minVal = document.getElementById('minPrice').value;
            var maxVal = document.getElementById('maxPrice').value;
            collectionState.minPrice = minVal ? parseFloat(minVal) : null;
            collectionState.maxPrice = maxVal ? parseFloat(maxVal) : null;
            collectionState.page = 1;
            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    // Reset filters
    var resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            collectionState.category = '';
            collectionState.minPrice = null;
            collectionState.maxPrice = null;
            collectionState.sort = 'newest';
            collectionState.page = 1;

            document.getElementById('minPrice').value = '';
            document.getElementById('maxPrice').value = '';
            document.getElementById('sortSelect').value = 'newest';

            var allRadio = document.querySelector('input[name="category"][value=""]');
            if (allRadio) allRadio.checked = true;

            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    // Mobile filter toggle
    var filterToggle = document.getElementById('filterToggle');
    var filterSidebar = document.getElementById('filterSidebar');
    var closeFilter = document.getElementById('closeFilter');

    if (filterToggle && filterSidebar) {
        var overlay = document.createElement('div');
        overlay.className = 'filter-overlay';
        overlay.id = 'filterOverlay';
        document.body.appendChild(overlay);

        filterToggle.addEventListener('click', function() {
            filterSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        var closeFunc = function() {
            filterSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeFilter) {
            closeFilter.addEventListener('click', closeFunc);
        }
        overlay.addEventListener('click', closeFunc);
    }
}

function closeFilterSidebar() {
    var sidebar = document.getElementById('filterSidebar');
    var overlay = document.getElementById('filterOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ========================================
   Contact Form
   ======================================== */
function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var submitBtn = document.getElementById('submitBtn');
        var btnText = submitBtn.querySelector('.btn-text');
        var btnLoading = submitBtn.querySelector('.btn-loading');

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        var formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        try {
            var success = await supabaseInsert('contact_messages', formData);

            if (success) {
                form.style.display = 'none';
                document.getElementById('formSuccess').style.display = 'block';
            } else {
                throw new Error('Failed to submit');
            }
        } catch (error) {
            console.error('Form error:', error);
            alert('Sorry, something went wrong. Please try WhatsApp or call us directly.');
        }

        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    });
}

/* ========================================
   Intersection Observer Animations
   ======================================== */
document.addEventListener('DOMContentLoaded', function() {
    if (!window.IntersectionObserver) return;

    var observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

    var observer = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                entries[i].target.style.opacity = '1';
                entries[i].target.style.transform = 'translateY(0)';
                observer.unobserve(entries[i].target);
            }
        }
    }, observerOptions);

    setTimeout(function() {
        var elements = document.querySelectorAll('.why-card, .mission-card, .team-card, .feature-item');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.opacity = '0';
            elements[i].style.transform = 'translateY(30px)';
            elements[i].style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(elements[i]);
        }
    }, 500);
});