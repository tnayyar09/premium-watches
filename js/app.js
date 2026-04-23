var SUPABASE_URL = "";
var SUPABASE_KEY = "";
var WHATSAPP_NUMBER = "";

(function() {
    try {
        if (window._SC && typeof window._SC.g === "function") {
            var u = window._SC.g(0);
            var k = window._SC.g(1);
            var w = window._SC.g(2);
            if (u && u.indexOf("supabase.co") > -1) {
                SUPABASE_URL    = u;
                SUPABASE_KEY    = k;
                WHATSAPP_NUMBER = w;
            }
        }
    } catch(e) { console.error("Config init error:", e); }
})();

function initConfig() {
    try {
        if (window._SC && typeof window._SC.g === "function") {
            var u = window._SC.g(0);
            var k = window._SC.g(1);
            var w = window._SC.g(2);
            if (u && u.indexOf("supabase.co") > -1) {
                SUPABASE_URL    = u;
                SUPABASE_KEY    = k;
                WHATSAPP_NUMBER = w;
            }
        }
    } catch(e) { console.error("initConfig error:", e); }
}

var ITEMS_PER_PAGE_FEATURED   = 4;
var ITEMS_PER_PAGE_COLLECTION = 6;

function supabaseQuery(table, options) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initConfig();
    }
    if (!options) { options = {}; }
    var params = [];
    if (options.select) { params.push("select=" + options.select); }
    else { params.push("select=*"); }
    if (options.filters) {
        for (var fi = 0; fi < options.filters.length; fi++) {
            params.push(options.filters[fi]);
        }
    }
    if (options.order)  { params.push("order="  + options.order); }
    if (options.limit)  { params.push("limit="  + options.limit); }
    if (options.offset !== undefined && options.offset !== null) {
        params.push("offset=" + options.offset);
    }
    var url = SUPABASE_URL + "/rest/v1/" + table + "?" + params.join("&");
    var headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type":  "application/json"
    };
    if (options.count) { headers["Prefer"] = "count=exact"; }
    return fetch(url, { headers: headers })
    .then(function(res) {
        var count = null;
        if (options.count) {
            var cr = res.headers.get("content-range");
            if (cr) { count = parseInt(cr.split("/")[1]); }
        }
        return res.json().then(function(data) {
            return { data: Array.isArray(data) ? data : [], count: count };
        });
    })
    .catch(function(err) {
        console.error("Query error:", err);
        return { data: [], count: 0 };
    });
}

function supabaseInsert(table, body) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initConfig();
    }
    var url = SUPABASE_URL + "/rest/v1/" + table;
    return fetch(url, {
        method: "POST",
        headers: {
            "apikey":        SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal"
        },
        body: JSON.stringify(body)
    })
    .then(function(res) { return res.ok; })
    .catch(function() { return false; });
}

window.addEventListener("load", function() {
    setTimeout(function() {
        var preloader = document.getElementById("preloader");
        if (preloader) { preloader.classList.add("hidden"); }
    }, 1500);
});

window.addEventListener("scroll", function() {
    var navbar = document.getElementById("navbar");
    if (navbar) {
        if (window.scrollY > 50) { navbar.classList.add("scrolled"); }
        else { navbar.classList.remove("scrolled"); }
    }
    var scrollTop = document.getElementById("scrollTop");
    if (scrollTop) {
        if (window.scrollY > 400) { scrollTop.classList.add("visible"); }
        else { scrollTop.classList.remove("visible"); }
    }
});

document.addEventListener("DOMContentLoaded", function() {
    var scrollTopBtn = document.getElementById("scrollTop");
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", function() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
    var hamburger = document.getElementById("hamburger");
    var navLinks  = document.getElementById("navLinks");
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", function() {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
        var links = navLinks.querySelectorAll("a");
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener("click", function() {
                hamburger.classList.remove("active");
                navLinks.classList.remove("active");
            });
        }
    }
});

function formatPrice(price) {
    return Number(price).toLocaleString("en-IN");
}

function getWhatsAppUrl(product) {
    if (!WHATSAPP_NUMBER || WHATSAPP_NUMBER === "") { initConfig(); }
    var text = "Hi! I am interested to buy this:\n\n"
        + product.title + "\n"
        + "Price: Rs." + formatPrice(product.price) + "\n"
        + "Image: " + product.image_url + "\n\n"
        + "Please share more details!";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
}

function createProductCard(product) {
    var discount = 0;
    if (product.original_price && product.original_price > 0) {
        discount = Math.round(
            ((product.original_price - product.price) / product.original_price) * 100
        );
    }
    var card = document.createElement("div");
    card.className = "product-card";
    var badgeHtml = "";
    if (product.is_featured) {
        badgeHtml += "<span class=\"product-badge\">Featured</span>";
    }
    if (discount > 0) {
        badgeHtml += "<span class=\"product-badge\" style=\"left:auto;right:15px;"
            + "background:#e74c3c;color:white;\">" + discount + "% OFF</span>";
    }
    var originalPriceHtml = "";
    if (product.original_price && product.original_price > 0) {
        originalPriceHtml = "<span class=\"product-original-price\">Rs."
            + formatPrice(product.original_price) + "</span>";
    }
    card.innerHTML = badgeHtml
        + "<div class=\"product-image\">"
        + "<img src=\"" + product.image_url + "\" alt=\"" + product.title
        + "\" loading=\"lazy\">"
        + "<div class=\"product-overlay\"></div></div>"
        + "<div class=\"product-info\">"
        + "<div class=\"product-category\">" + (product.category || "General") + "</div>"
        + "<h3 class=\"product-title\">" + product.title + "</h3>"
        + "<p class=\"product-desc\">" + (product.short_description || "") + "</p>"
        + "<div class=\"product-price-row\">"
        + "<span class=\"product-price\">Rs." + formatPrice(product.price) + "</span>"
        + originalPriceHtml + "</div>"
        + "<a href=\"" + getWhatsAppUrl(product) + "\" target=\"_blank\""
        + " class=\"btn-whatsapp-buy\">"
        + "<i class=\"fab fa-whatsapp\"></i> Buy Now on WhatsApp</a></div>";
    return card;
}

function showSkeletons(container, count) {
    if (!count) { count = 4; }
    var html = "";
    for (var i = 0; i < count; i++) {
        html += "<div class=\"skeleton skeleton-card\"></div>";
    }
    container.innerHTML = html;
}

function createPagination(currentPage, totalPages) {
    if (totalPages <= 1) { return ""; }
    var html = "";
    html += "<button class=\"page-btn"
        + (currentPage === 1 ? " disabled" : "")
        + "\" data-page=\"" + (currentPage - 1)
        + "\"><i class=\"fas fa-chevron-left\"></i></button>";
    var startPage = Math.max(1, currentPage - 2);
    var endPage   = Math.min(totalPages, currentPage + 2);
    if (startPage > 1) {
        html += "<button class=\"page-btn\" data-page=\"1\">1</button>";
        if (startPage > 2) {
            html += "<span style=\"padding:0 5px;color:#999\">...</span>";
        }
    }
    for (var i = startPage; i <= endPage; i++) {
        html += "<button class=\"page-btn"
            + (i === currentPage ? " active" : "")
            + "\" data-page=\"" + i + "\">" + i + "</button>";
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += "<span style=\"padding:0 5px;color:#999\">...</span>";
        }
        html += "<button class=\"page-btn\" data-page=\""
            + totalPages + "\">" + totalPages + "</button>";
    }
    html += "<button class=\"page-btn"
        + (currentPage === totalPages ? " disabled" : "")
        + "\" data-page=\"" + (currentPage + 1)
        + "\"><i class=\"fas fa-chevron-right\"></i></button>";
    return html;
}

function bindPagination(containerId, totalPages, callback) {
    var container = document.getElementById(containerId);
    if (!container) { return; }
    var btns = container.querySelectorAll(".page-btn:not(.disabled)");
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function() {
            var pg = parseInt(this.getAttribute("data-page"));
            if (pg >= 1 && pg <= totalPages) { callback(pg); }
        });
    }
}

function initBanners() {
    initConfig();
    var slider        = document.getElementById("bannerSlider");
    var dotsContainer = document.getElementById("bannerDots");
    if (!slider) { return; }
    var fallbackHtml = "<div class=\"banner-slide active\">"
        + "<img src=\"https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1400\" alt=\"Banner\">"
        + "<div class=\"banner-content\"><h1>Welcome</h1>"
        + "<p>Discover Our Collection</p>"
        + "<div class=\"banner-btn-group\">"
        + "<a href=\"collection.html\" class=\"btn-banner btn-banner-primary\">Shop Now</a>"
        + "<a href=\"about.html\" class=\"btn-banner btn-banner-outline\">Learn More</a>"
        + "</div></div></div>";
    supabaseQuery("banners", {
        filters: ["is_active=eq.true"],
        order:   "sort_order.asc"
    })
    .then(function(result) {
        var banners = result.data;
        if (!banners || banners.length === 0) {
            slider.innerHTML = fallbackHtml;
            return;
        }
        var slidesHtml = "";
        var dotsHtml   = "";
        for (var i = 0; i < banners.length; i++) {
            var b  = banners[i];
            var ac = i === 0 ? " active" : "";
            slidesHtml += "<div class=\"banner-slide" + ac + "\">"
                + "<img src=\"" + b.image_url + "\" alt=\""
                + (b.title || "Banner") + "\">"
                + "<div class=\"banner-content\">"
                + "<h1>" + (b.title || "Welcome") + "</h1>"
                + "<p>" + (b.subtitle || "Discover Our Collection") + "</p>"
                + "<div class=\"banner-btn-group\">"
                + "<a href=\"collection.html\" class=\"btn-banner btn-banner-primary\">Shop Now</a>"
                + "<a href=\"about.html\" class=\"btn-banner btn-banner-outline\">Learn More</a>"
                + "</div></div></div>";
            dotsHtml += "<button class=\"banner-dot" + ac
                + "\" data-index=\"" + i + "\"></button>";
        }
        slider.innerHTML = slidesHtml;
        if (dotsContainer) { dotsContainer.innerHTML = dotsHtml; }
        var currentSlide  = 0;
        var slides = slider.querySelectorAll(".banner-slide");
        var dots   = dotsContainer
            ? dotsContainer.querySelectorAll(".banner-dot") : [];
        function goToSlide(index) {
            if (slides.length === 0) { return; }
            slides[currentSlide].classList.remove("active");
            if (dots[currentSlide]) { dots[currentSlide].classList.remove("active"); }
            currentSlide = ((index % slides.length) + slides.length) % slides.length;
            slides[currentSlide].classList.add("active");
            if (dots[currentSlide]) { dots[currentSlide].classList.add("active"); }
        }
        var prevBtn = document.getElementById("prevBtn");
        var nextBtn = document.getElementById("nextBtn");
        if (prevBtn) {
            prevBtn.addEventListener("click", function() { goToSlide(currentSlide - 1); });
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", function() { goToSlide(currentSlide + 1); });
        }
        for (var d = 0; d < dots.length; d++) {
            dots[d].addEventListener("click", function() {
                goToSlide(parseInt(this.getAttribute("data-index")));
            });
        }
        var autoPlay = setInterval(function() { goToSlide(currentSlide + 1); }, 5000);
        var bannerEl = document.getElementById("heroBanner");
        if (bannerEl) {
            bannerEl.addEventListener("mouseenter", function() { clearInterval(autoPlay); });
            bannerEl.addEventListener("mouseleave", function() {
                autoPlay = setInterval(function() { goToSlide(currentSlide + 1); }, 5000);
            });
            var touchStartX = 0;
            bannerEl.addEventListener("touchstart", function(e) {
                touchStartX = e.touches[0].clientX;
            });
            bannerEl.addEventListener("touchend", function(e) {
                var diff = touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) { goToSlide(currentSlide + 1); }
                    else { goToSlide(currentSlide - 1); }
                }
            });
        }
    })
    .catch(function() { slider.innerHTML = fallbackHtml; });
}

var featuredPage = 1;
function loadFeaturedProducts(page) {
    initConfig();
    if (!page) { page = 1; }
    var container    = document.getElementById("featuredProducts");
    var pagContainer = document.getElementById("featuredPagination");
    if (!container) { return; }
    showSkeletons(container, ITEMS_PER_PAGE_FEATURED);
    featuredPage = page;
    var offset = (page - 1) * ITEMS_PER_PAGE_FEATURED;
    supabaseQuery("products", {
        filters: ["is_featured=eq.true"],
        order:   "created_at.desc",
        limit:   ITEMS_PER_PAGE_FEATURED,
        offset:  offset,
        count:   true
    })
    .then(function(r) {
        if (!r.data || r.data.length === 0) {
            container.innerHTML = "<div class=\"no-products\">"
                + "<i class=\"fas fa-clock\"></i>"
                + "<h3>No Featured Items</h3></div>";
            if (pagContainer) { pagContainer.innerHTML = ""; }
            return;
        }
        container.innerHTML = "";
        for (var i = 0; i < r.data.length; i++) {
            container.appendChild(createProductCard(r.data[i]));
        }
        if (pagContainer) {
            var tp = Math.ceil(r.count / ITEMS_PER_PAGE_FEATURED);
            pagContainer.innerHTML = createPagination(page, tp);
            bindPagination("featuredPagination", tp, function(pg) {
                loadFeaturedProducts(pg);
                var sec = document.querySelector(".featured-section");
                if (sec) { sec.scrollIntoView({ behavior: "smooth" }); }
            });
        }
    });
}

var collectionState = {
    page: 1, category: "",
    minPrice: null, maxPrice: null, sort: "newest"
};

function initCollection() {
    initConfig();
    var p = new URLSearchParams(window.location.search);
    if (p.get("category")) { collectionState.category = p.get("category"); }
    loadCategories();
    loadCollectionProducts();
    setupCollectionListeners();
}

function loadCategories() {
    initConfig();
    var container = document.getElementById("categoryFilters");
    if (!container) { return; }
    supabaseQuery("products", { select: "category" })
    .then(function(r) {
        var map = {}; var total = 0;
        for (var i = 0; i < r.data.length; i++) {
            var cat = r.data[i].category || "General";
            map[cat] = (map[cat] || 0) + 1;
            total++;
        }
        var html = "<label class=\"filter-option\">"
            + "<input type=\"radio\" name=\"category\" value=\"\""
            + (!collectionState.category ? " checked" : "") + ">"
            + "<span class=\"radio-custom\"></span>"
            + "<span>All</span>"
            + "<span class=\"filter-count\">" + total + "</span></label>";
        var cats = Object.keys(map);
        for (var j = 0; j < cats.length; j++) {
            html += "<label class=\"filter-option\">"
                + "<input type=\"radio\" name=\"category\" value=\"" + cats[j] + "\""
                + (collectionState.category === cats[j] ? " checked" : "") + ">"
                + "<span class=\"radio-custom\"></span>"
                + "<span>" + cats[j] + "</span>"
                + "<span class=\"filter-count\">" + map[cats[j]] + "</span></label>";
        }
        container.innerHTML = html;
        var inputs = container.querySelectorAll("input[name=\"category\"]");
        for (var k = 0; k < inputs.length; k++) {
            inputs[k].addEventListener("change", function() {
                collectionState.category = this.value;
                collectionState.page     = 1;
                loadCollectionProducts();
                closeFilterSidebar();
            });
        }
    })
    .catch(function(err) { console.error("Categories error:", err); });
}

function loadCollectionProducts() {
    initConfig();
    var container    = document.getElementById("collectionProducts");
    var pagContainer = document.getElementById("collectionPagination");
    var info         = document.getElementById("resultsInfo");
    if (!container) { return; }
    showSkeletons(container, ITEMS_PER_PAGE_COLLECTION);
    var filters = [];
    if (collectionState.category) {
        filters.push("category=eq." + encodeURIComponent(collectionState.category));
    }
    if (collectionState.minPrice) {
        filters.push("price=gte." + collectionState.minPrice);
    }
    if (collectionState.maxPrice) {
        filters.push("price=lte." + collectionState.maxPrice);
    }
    var order = "created_at.desc";
    if (collectionState.sort === "price_low")       { order = "price.asc"; }
    else if (collectionState.sort === "price_high") { order = "price.desc"; }
    else if (collectionState.sort === "name_asc")   { order = "title.asc"; }
    var offset = (collectionState.page - 1) * ITEMS_PER_PAGE_COLLECTION;
    supabaseQuery("products", {
        filters: filters, order: order,
        limit: ITEMS_PER_PAGE_COLLECTION, offset: offset, count: true
    })
    .then(function(r) {
        if (info) {
            var start    = offset + 1;
            var end      = Math.min(offset + ITEMS_PER_PAGE_COLLECTION, r.count || 0);
            var infoText = "Showing " + start + "-" + end
                + " of " + (r.count || 0) + " items";
            if (collectionState.category) {
                infoText += " in " + collectionState.category;
            }
            info.textContent = infoText;
        }
        if (!r.data || r.data.length === 0) {
            container.innerHTML = "<div class=\"no-products\">"
                + "<i class=\"fas fa-search\"></i>"
                + "<h3>No Items Found</h3><p>Try adjusting filters.</p></div>";
            if (pagContainer) { pagContainer.innerHTML = ""; }
            return;
        }
        container.innerHTML = "";
        for (var i = 0; i < r.data.length; i++) {
            container.appendChild(createProductCard(r.data[i]));
        }
        if (pagContainer) {
            var tp = Math.ceil(r.count / ITEMS_PER_PAGE_COLLECTION);
            pagContainer.innerHTML = createPagination(collectionState.page, tp);
            bindPagination("collectionPagination", tp, function(pg) {
                collectionState.page = pg;
                loadCollectionProducts();
                var area = document.querySelector(".products-area");
                if (area) { area.scrollIntoView({ behavior: "smooth" }); }
            });
        }
    })
    .catch(function(err) { console.error("Collection error:", err); });
}

function setupCollectionListeners() {
    var sortEl = document.getElementById("sortSelect");
    if (sortEl) {
        sortEl.addEventListener("change", function() {
            collectionState.sort = this.value;
            collectionState.page = 1;
            loadCollectionProducts();
        });
    }
    var applyBtn = document.getElementById("applyPrice");
    if (applyBtn) {
        applyBtn.addEventListener("click", function() {
            var mn = document.getElementById("minPrice");
            var mx = document.getElementById("maxPrice");
            collectionState.minPrice = mn && mn.value ? parseFloat(mn.value) : null;
            collectionState.maxPrice = mx && mx.value ? parseFloat(mx.value) : null;
            collectionState.page     = 1;
            loadCollectionProducts();
            closeFilterSidebar();
        });
    }
    var resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
        resetBtn.addEventListener("click", function() {
            collectionState = {
                page: 1, category: "",
                minPrice: null, maxPrice: null, sort: "newest"
            };
            var mn = document.getElementById("minPrice");
            var mx = document.getElementById("maxPrice");
            var se = document.getElementById("sortSelect");
            if (mn) { mn.value = ""; }
            if (mx) { mx.value = ""; }
            if (se) { se.value = "newest"; }
            var ar = document.querySelector("input[name=\"category\"][value=\"\"]");
            if (ar) { ar.checked = true; }
            loadCollectionProducts();
            closeFilterSidebar();
        });
    }
    var filterToggle   = document.getElementById("filterToggle");
    var filterSidebar  = document.getElementById("filterSidebar");
    var closeFilterBtn = document.getElementById("closeFilter");
    if (filterToggle && filterSidebar) {
        var overlay = document.createElement("div");
        overlay.className = "filter-overlay";
        overlay.id        = "filterOverlay";
        document.body.appendChild(overlay);
        filterToggle.addEventListener("click", function() {
            filterSidebar.classList.add("active");
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });
        var closeFn = function() {
            filterSidebar.classList.remove("active");
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        };
        if (closeFilterBtn) { closeFilterBtn.addEventListener("click", closeFn); }
        overlay.addEventListener("click", closeFn);
    }
}

function closeFilterSidebar() {
    var s = document.getElementById("filterSidebar");
    var o = document.getElementById("filterOverlay");
    if (s) { s.classList.remove("active"); }
    if (o) { o.classList.remove("active"); }
    document.body.style.overflow = "";
}

function initContactForm() {
    initConfig();
    var form = document.getElementById("contactForm");
    if (!form) { return; }
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        var btn        = document.getElementById("submitBtn");
        var btnText    = btn ? btn.querySelector(".btn-text")    : null;
        var btnLoading = btn ? btn.querySelector(".btn-loading") : null;
        if (btnText)    { btnText.style.display    = "none"; }
        if (btnLoading) { btnLoading.style.display = "inline-flex"; }
        if (btn)        { btn.disabled = true; }
        supabaseInsert("contact_messages", {
            name:    document.getElementById("name").value.trim(),
            email:   document.getElementById("email").value.trim(),
            phone:   document.getElementById("phone").value.trim(),
            message: document.getElementById("message").value.trim()
        })
        .then(function(ok) {
            if (ok) {
                form.style.display = "none";
                var s = document.getElementById("formSuccess");
                if (s) { s.style.display = "block"; }
            } else { alert("Error. Please try WhatsApp."); }
            if (btnText)    { btnText.style.display    = "inline"; }
            if (btnLoading) { btnLoading.style.display = "none"; }
            if (btn)        { btn.disabled = false; }
        });
    });
}