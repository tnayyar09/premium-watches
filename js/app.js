var SUPABASE_URL = "aHR0cHM6Ly9meHB4c21uYWt3cWN6Z3JoaXdrbC5zdXBhYmFzZS5jbw==";
var SUPABASE_KEY = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1aNGNIaHpiVzVoYTNkeFkzcG5jbWhwZDJ0c0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpZNE1qVTVNekFzSW1WNGNDSTZNakE1TWpRd01Ua3pNSDAuLWdtSXJJaVdha3VIS09pdURubFc5WlFPSldSbnRESFVUa3pYaVU3OUhhbw==";
var WHATSAPP_NUMBER = "OTE3ODg4NTI1Mzgw";
var ITEMS_PER_PAGE_FEATURED = 4;
var ITEMS_PER_PAGE_COLLECTION = 6;

function supabaseQuery(table, options) {
    if (!options) { options = {}; }
    var url = SUPABASE_URL + "/rest/v1/" + table + "?";
    var params = [];
    if (options.select) {
        params.push("select=" + options.select);
    } else {
        params.push("select=*");
    }
    if (options.filters) {
        for (var fi = 0; fi < options.filters.length; fi++) {
            params.push(options.filters[fi]);
        }
    }
    if (options.order) { params.push("order=" + options.order); }
    if (options.limit) { params.push("limit=" + options.limit); }
    if (options.offset !== undefined && options.offset !== null) {
        params.push("offset=" + options.offset);
    }
    url += params.join("&");
    var headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
    };
    if (options.count) {
        headers["Prefer"] = "count=exact";
    }
    return fetch(url, { headers: headers }).then(function(res) {
        var contentRange = res.headers.get("content-range");
        var count = null;
        if (options.count && contentRange) {
            count = parseInt(contentRange.split("/")[1]);
        }
        return res.json().then(function(data) {
            return { data: data, count: count };
        });
    });
}

function supabaseInsert(table, body) {
    var url = SUPABASE_URL + "/rest/v1/" + table;
    return fetch(url, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        body: JSON.stringify(body)
    }).then(function(res) {
        return res.ok;
    });
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
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
    var scrollTop = document.getElementById("scrollTop");
    if (scrollTop) {
        if (window.scrollY > 400) {
            scrollTop.classList.add("visible");
        } else {
            scrollTop.classList.remove("visible");
        }
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
    var navLinks = document.getElementById("navLinks");
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
    var text = "Hi! I am interested to buy this watch:\n\n"
        + product.title + "\n"
        + "Price: Rs." + formatPrice(product.price) + "\n"
        + "Image: " + product.image_url + "\n\n"
        + "Please share more details!";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
}

function createProductCard(product) {
    var discount = 0;
    if (product.original_price && product.original_price > 0) {
        discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }

    var card = document.createElement("div");
    card.className = "product-card";

    var badgeHtml = "";
    if (product.is_featured) {
        badgeHtml += "<span class=\"product-badge\">Featured</span>";
    }
    if (discount > 0) {
        badgeHtml += "<span class=\"product-badge\" style=\"left:auto;right:15px;background:#e74c3c;color:white;\">" + discount + "% OFF</span>";
    }

    var originalPriceHtml = "";
    if (product.original_price && product.original_price > 0) {
        originalPriceHtml = "<span class=\"product-original-price\">Rs." + formatPrice(product.original_price) + "</span>";
    }

    var shortDesc = product.short_description || "";
    var category = product.category || "Watch";
    var imgSrc = product.image_url || "";
    var title = product.title || "";
    var waUrl = getWhatsAppUrl(product);

    card.innerHTML = badgeHtml
        + "<div class=\"product-image\">"
        + "<img src=\"" + imgSrc + "\" alt=\"" + title + "\" loading=\"lazy\">"
        + "<div class=\"product-overlay\"></div>"
        + "</div>"
        + "<div class=\"product-info\">"
        + "<div class=\"product-category\">" + category + "</div>"
        + "<h3 class=\"product-title\">" + title + "</h3>"
        + "<p class=\"product-desc\">" + shortDesc + "</p>"
        + "<div class=\"product-price-row\">"
        + "<span class=\"product-price\">Rs." + formatPrice(product.price) + "</span>"
        + originalPriceHtml
        + "</div>"
        + "<a href=\"" + waUrl + "\" target=\"_blank\" class=\"btn-whatsapp-buy\">"
        + "<i class=\"fab fa-whatsapp\"></i> Buy Now on WhatsApp"
        + "</a>"
        + "</div>";

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
    var prevDisabled = currentPage === 1 ? " disabled" : "";
    html += "<button class=\"page-btn" + prevDisabled + "\" data-page=\"" + (currentPage - 1) + "\"><i class=\"fas fa-chevron-left\"></i></button>";

    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += "<button class=\"page-btn\" data-page=\"1\">1</button>";
        if (startPage > 2) { html += "<span style=\"padding:0 5px;color:#999\">...</span>"; }
    }
    for (var i = startPage; i <= endPage; i++) {
        var activeClass = i === currentPage ? " active" : "";
        html += "<button class=\"page-btn" + activeClass + "\" data-page=\"" + i + "\">" + i + "</button>";
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) { html += "<span style=\"padding:0 5px;color:#999\">...</span>"; }
        html += "<button class=\"page-btn\" data-page=\"" + totalPages + "\">" + totalPages + "</button>";
    }

    var nextDisabled = currentPage === totalPages ? " disabled" : "";
    html += "<button class=\"page-btn" + nextDisabled + "\" data-page=\"" + (currentPage + 1) + "\"><i class=\"fas fa-chevron-right\"></i></button>";
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
    var slider = document.getElementById("bannerSlider");
    var dotsContainer = document.getElementById("bannerDots");
    if (!slider) { return; }

    var fallbackHtml = "<div class=\"banner-slide active\">"
        + "<img src=\"https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1400\" alt=\"Banner\">"
        + "<div class=\"banner-content\">"
        + "<h1>Luxury Timepieces</h1>"
        + "<p>Discover Our Exclusive Collection</p>"
        + "<div class=\"banner-btn-group\">"
        + "<a href=\"collection.html\" class=\"btn-banner btn-banner-primary\">Shop Now</a>"
        + "<a href=\"about.html\" class=\"btn-banner btn-banner-outline\">Learn More</a>"
        + "</div></div></div>";

    supabaseQuery("banners", {
        filters: ["is_active=eq.true"],
        order: "sort_order.asc"
    }).then(function(result) {
        var banners = result.data;

        if (!banners || banners.length === 0) {
            slider.innerHTML = fallbackHtml;
            return;
        }

        var slidesHtml = "";
        var dotsHtml = "";

        for (var i = 0; i < banners.length; i++) {
            var b = banners[i];
            var activeClass = i === 0 ? " active" : "";
            var loadingVal = i === 0 ? "eager" : "lazy";
            var titleText = b.title ? b.title : "Luxury Watches";
            var subtitleText = b.subtitle ? b.subtitle : "Discover Our Collection";

            slidesHtml += "<div class=\"banner-slide" + activeClass + "\">"
                + "<img src=\"" + b.image_url + "\" alt=\"" + titleText + "\" loading=\"" + loadingVal + "\">"
                + "<div class=\"banner-content\">"
                + "<h1>" + titleText + "</h1>"
                + "<p>" + subtitleText + "</p>"
                + "<div class=\"banner-btn-group\">"
                + "<a href=\"collection.html\" class=\"btn-banner btn-banner-primary\">Shop Now</a>"
                + "<a href=\"about.html\" class=\"btn-banner btn-banner-outline\">Learn More</a>"
                + "</div></div></div>";

            dotsHtml += "<button class=\"banner-dot" + activeClass + "\" data-index=\"" + i + "\"></button>";
        }

        slider.innerHTML = slidesHtml;
        if (dotsContainer) { dotsContainer.innerHTML = dotsHtml; }

        var currentSlide = 0;
        var slides = slider.querySelectorAll(".banner-slide");
        var dots = dotsContainer ? dotsContainer.querySelectorAll(".banner-dot") : [];

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

        if (dots.length > 0) {
            for (var d = 0; d < dots.length; d++) {
                dots[d].addEventListener("click", function() {
                    goToSlide(parseInt(this.getAttribute("data-index")));
                });
            }
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

    }).catch(function(err) {
        console.error("Banner error:", err);
        if (slider) { slider.innerHTML = fallbackHtml; }
    });
}

var featuredPage = 1;

function loadFeaturedProducts(page) {
    if (!page) { page = 1; }
    var container = document.getElementById("featuredProducts");
    var paginationContainer = document.getElementById("featuredPagination");
    if (!container) { return; }

    showSkeletons(container, ITEMS_PER_PAGE_FEATURED);
    featuredPage = page;

    var offset = (page - 1) * ITEMS_PER_PAGE_FEATURED;

    supabaseQuery("products", {
        filters: ["is_featured=eq.true"],
        order: "created_at.desc",
        limit: ITEMS_PER_PAGE_FEATURED,
        offset: offset,
        count: true
    }).then(function(result) {
        var data = result.data;
        var count = result.count;

        if (!data || data.length === 0) {
            container.innerHTML = "<div class=\"no-products\">"
                + "<i class=\"fas fa-clock\"></i>"
                + "<h3>No Featured Watches Yet</h3>"
                + "<p>Check back soon!</p>"
                + "</div>";
            if (paginationContainer) { paginationContainer.innerHTML = ""; }
            return;
        }

        container.innerHTML = "";
        for (var i = 0; i < data.length; i++) {
            container.appendChild(createProductCard(data[i]));
        }

        if (paginationContainer) {
            var totalPages = Math.ceil(count / ITEMS_PER_PAGE_FEATURED);
            paginationContainer.innerHTML = createPagination(page, totalPages);
            bindPagination("featuredPagination", totalPages, function(pg) {
                loadFeaturedProducts(pg);
                var sec = document.querySelector(".featured-section");
                if (sec) { sec.scrollIntoView({ behavior: "smooth", block: "start" }); }
            });
        }

    }).catch(function(err) {
        console.error("Featured products error:", err);
        container.innerHTML = "<div class=\"no-products\"><h3>Error loading products</h3></div>";
    });
}

var collectionState = {
    page: 1,
    category: "",
    minPrice: null,
    maxPrice: null,
    sort: "newest"
};

function initCollection() {
    var urlParams = new URLSearchParams(window.location.search);
    var catParam = urlParams.get("category");
    if (catParam) { collectionState.category = catParam; }

    loadCategories();
    loadCollectionProducts();
    setupCollectionListeners();
}

function loadCategories() {
    var container = document.getElementById("categoryFilters");
    if (!container) { return; }

    supabaseQuery("products", { select: "category" }).then(function(result) {
        var data = result.data;
        var categoryMap = {};
        var total = 0;

        for (var i = 0; i < data.length; i++) {
            var cat = data[i].category || "General";
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
            total++;
        }

        var html = "<label class=\"filter-option\">"
            + "<input type=\"radio\" name=\"category\" value=\"\"" + (!collectionState.category ? " checked" : "") + ">"
            + "<span class=\"radio-custom\"></span>"
            + "<span>All Watches</span>"
            + "<span class=\"filter-count\">" + total + "</span>"
            + "</label>";

        var cats = Object.keys(categoryMap);
        for (var j = 0; j < cats.length; j++) {
            var c = cats[j];
            var isChecked = collectionState.category === c ? " checked" : "";
            html += "<label class=\"filter-option\">"
                + "<input type=\"radio\" name=\"category\" value=\"" + c + "\"" + isChecked + ">"
                + "<span class=\"radio-custom\"></span>"
                + "<span>" + c + "</span>"
                + "<span class=\"filter-count\">" + categoryMap[c] + "</span>"
                + "</label>";
        }

        container.innerHTML = html;

        var inputs = container.querySelectorAll("input[name=\"category\"]");
        for (var k = 0; k < inputs.length; k++) {
            inputs[k].addEventListener("change", function() {
                collectionState.category = this.value;
                collectionState.page = 1;
                loadCollectionProducts();
                closeFilterSidebar();
            });
        }

    }).catch(function(err) {
        console.error("Categories error:", err);
    });
}

function loadCollectionProducts() {
    var container = document.getElementById("collectionProducts");
    var paginationContainer = document.getElementById("collectionPagination");
    var resultsInfo = document.getElementById("resultsInfo");
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
    if (collectionState.sort === "price_low") { order = "price.asc"; }
    else if (collectionState.sort === "price_high") { order = "price.desc"; }
    else if (collectionState.sort === "name_asc") { order = "title.asc"; }

    var offset = (collectionState.page - 1) * ITEMS_PER_PAGE_COLLECTION;

    supabaseQuery("products", {
        filters: filters,
        order: order,
        limit: ITEMS_PER_PAGE_COLLECTION,
        offset: offset,
        count: true
    }).then(function(result) {
        var data = result.data;
        var count = result.count;

        if (resultsInfo) {
            var start = offset + 1;
            var end = Math.min(offset + ITEMS_PER_PAGE_COLLECTION, count);
            var info = "Showing " + start + "-" + end + " of " + (count || 0) + " watches";
            if (collectionState.category) { info += " in " + collectionState.category; }
            resultsInfo.textContent = info;
        }

        if (!data || data.length === 0) {
            container.innerHTML = "<div class=\"no-products\">"
                + "<i class=\"fas fa-search\"></i>"
                + "<h3>No Watches Found</h3>"
                + "<p>Try adjusting your filters.</p>"
                + "</div>";
            if (paginationContainer) { paginationContainer.innerHTML = ""; }
            return;
        }

        container.innerHTML = "";
        for (var i = 0; i < data.length; i++) {
            container.appendChild(createProductCard(data[i]));
        }

        if (paginationContainer) {
            var totalPages = Math.ceil(count / ITEMS_PER_PAGE_COLLECTION);
            paginationContainer.innerHTML = createPagination(collectionState.page, totalPages);
            bindPagination("collectionPagination", totalPages, function(pg) {
                collectionState.page = pg;
                loadCollectionProducts();
                var area = document.querySelector(".products-area");
                if (area) { area.scrollIntoView({ behavior: "smooth", block: "start" }); }
            });
        }

    }).catch(function(err) {
        console.error("Collection error:", err);
        container.innerHTML = "<div class=\"no-products\"><h3>Error loading</h3></div>";
    });
}

function setupCollectionListeners() {
    var sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", function() {
            collectionState.sort = this.value;
            collectionState.page = 1;
            loadCollectionProducts();
        });
    }

    var applyPrice = document.getElementById("applyPrice");
    if (applyPrice) {
        applyPrice.addEventListener("click", function() {
            var minVal = document.getElementById("minPrice").value;
            var maxVal = document.getElementById("maxPrice").value;
            collectionState.minPrice = minVal ? parseFloat(minVal) : null;
            collectionState.maxPrice = maxVal ? parseFloat(maxVal) : null;
            collectionState.page = 1;
            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    var resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
        resetBtn.addEventListener("click", function() {
            collectionState.category = "";
            collectionState.minPrice = null;
            collectionState.maxPrice = null;
            collectionState.sort = "newest";
            collectionState.page = 1;

            var minEl = document.getElementById("minPrice");
            var maxEl = document.getElementById("maxPrice");
            var sortEl = document.getElementById("sortSelect");
            if (minEl) { minEl.value = ""; }
            if (maxEl) { maxEl.value = ""; }
            if (sortEl) { sortEl.value = "newest"; }

            var allRadio = document.querySelector("input[name=\"category\"][value=\"\"]");
            if (allRadio) { allRadio.checked = true; }

            loadCollectionProducts();
            closeFilterSidebar();
        });
    }

    var filterToggle = document.getElementById("filterToggle");
    var filterSidebar = document.getElementById("filterSidebar");
    var closeFilterBtn = document.getElementById("closeFilter");

    if (filterToggle && filterSidebar) {
        var overlay = document.createElement("div");
        overlay.className = "filter-overlay";
        overlay.id = "filterOverlay";
        document.body.appendChild(overlay);

        filterToggle.addEventListener("click", function() {
            filterSidebar.classList.add("active");
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });

        function closeFunc() {
            filterSidebar.classList.remove("active");
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        }

        if (closeFilterBtn) { closeFilterBtn.addEventListener("click", closeFunc); }
        overlay.addEventListener("click", closeFunc);
    }
}

function closeFilterSidebar() {
    var sidebar = document.getElementById("filterSidebar");
    var overlay = document.getElementById("filterOverlay");
    if (sidebar) { sidebar.classList.remove("active"); }
    if (overlay) { overlay.classList.remove("active"); }
    document.body.style.overflow = "";
}

function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) { return; }

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var submitBtn = document.getElementById("submitBtn");
        var btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
        var btnLoading = submitBtn ? submitBtn.querySelector(".btn-loading") : null;

        if (btnText) { btnText.style.display = "none"; }
        if (btnLoading) { btnLoading.style.display = "inline-flex"; }
        if (submitBtn) { submitBtn.disabled = true; }

        var formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        supabaseInsert("contact_messages", formData).then(function(success) {
            if (success) {
                form.style.display = "none";
                var successEl = document.getElementById("formSuccess");
                if (successEl) { successEl.style.display = "block"; }
            } else {
                alert("Something went wrong. Please call or WhatsApp us directly.");
            }
        }).catch(function() {
            alert("Something went wrong. Please call or WhatsApp us directly.");
        }).finally(function() {
            if (btnText) { btnText.style.display = "inline"; }
            if (btnLoading) { btnLoading.style.display = "none"; }
            if (submitBtn) { submitBtn.disabled = false; }
        });
    });
}