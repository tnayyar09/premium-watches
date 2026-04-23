var SUPABASE_URL = "";
var SUPABASE_KEY = "";

(function() {
    try {
        if (window._SC && typeof window._SC.g === "function") {
            var u = window._SC.g(0);
            var k = window._SC.g(1);
            if (u && u.indexOf("supabase.co") > -1) {
                SUPABASE_URL = u;
                SUPABASE_KEY = k;
            }
        }
    } catch(e) { console.error("Admin config init:", e); }
})();

function initAdminConfig() {
    try {
        if (window._SC && typeof window._SC.g === "function") {
            var u = window._SC.g(0);
            var k = window._SC.g(1);
            if (u && u.indexOf("supabase.co") > -1) {
                SUPABASE_URL = u;
                SUPABASE_KEY = k;
            }
        }
    } catch(e) { console.error("initAdminConfig:", e); }
}

function checkAuth() {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    if (sessionStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "index.html";
        return;
    }
    var el = document.getElementById("adminName");
    if (el) {
        el.textContent = sessionStorage.getItem("adminFullName")
            || sessionStorage.getItem("adminUser") || "Admin";
    }
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm("Logout?")) {
                sessionStorage.clear();
                window.location.href = "index.html";
            }
        });
    }
    var menuToggle   = document.getElementById("menuToggle");
    var sidebar      = document.getElementById("sidebar");
    var sidebarClose = document.getElementById("sidebarClose");
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function() {
            sidebar.classList.toggle("active");
        });
    }
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener("click", function() {
            sidebar.classList.remove("active");
        });
    }
}

function adminQuery(table, options) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    if (!options) { options = {}; }
    var params = [];
    if (options.select) { params.push("select=" + options.select); }
    else { params.push("select=*"); }
    if (options.filters) {
        for (var i = 0; i < options.filters.length; i++) {
            params.push(options.filters[i]);
        }
    }
    if (options.order) { params.push("order=" + options.order); }
    if (options.limit !== undefined && options.limit !== null) {
        params.push("limit=" + options.limit);
    }
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
    return fetch(url, { method: "GET", headers: headers })
    .then(function(res) {
        var count = null;
        if (options.count) {
            var cr = res.headers.get("content-range");
            if (cr) {
                var p = cr.split("/");
                if (p.length > 1 && p[1] !== "*") { count = parseInt(p[1]); }
            }
        }
        return res.json().then(function(data) {
            return { data: Array.isArray(data) ? data : [], count: count };
        });
    })
    .catch(function(err) {
        console.error("adminQuery:", err);
        return { data: [], count: 0 };
    });
}

function adminInsert(table, body) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    return fetch(SUPABASE_URL + "/rest/v1/" + table, {
        method: "POST",
        headers: {
            "apikey":        SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal"
        },
        body: JSON.stringify(body)
    })
    .then(function(res) {
        if (!res.ok) {
            return res.text().then(function(t) {
                console.error("Insert:", t); return false;
            });
        }
        return true;
    })
    .catch(function(err) { console.error("Insert:", err); return false; });
}

function adminUpdate(table, id, body) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    return fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, {
        method: "PATCH",
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

function adminDelete(table, id) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    return fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, {
        method: "DELETE",
        headers: {
            "apikey":        SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY
        }
    })
    .then(function(res) { return res.ok; })
    .catch(function() { return false; });
}

function showToast(message, type) {
    if (!type) { type = "success"; }
    var container = document.getElementById("toastContainer");
    if (!container) { alert(message); return; }
    var toast = document.createElement("div");
    toast.className = "toast " + type;
    var icon = document.createElement("i");
    icon.className = type === "success"
        ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    var span = document.createElement("span");
    span.textContent = message;
    var closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    var ci = document.createElement("i");
    ci.className = "fas fa-times";
    closeBtn.appendChild(ci);
    closeBtn.addEventListener("click", function() {
        if (toast.parentElement) { toast.remove(); }
    });
    toast.appendChild(icon);
    toast.appendChild(span);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    setTimeout(function() {
        if (toast.parentElement) { toast.remove(); }
    }, 4000);
}

function renderAdminPagination(containerId, currentPage, totalPages, callback) {
    var c = document.getElementById(containerId);
    if (!c || !totalPages || totalPages <= 1) {
        if (c) { c.innerHTML = ""; }
        return;
    }
    var html = "";
    html += currentPage === 1
        ? "<button class=\"page-btn disabled\"><i class=\"fas fa-chevron-left\"></i></button>"
        : "<button class=\"page-btn\" data-page=\"" + (currentPage - 1)
          + "\"><i class=\"fas fa-chevron-left\"></i></button>";
    var s = Math.max(1, currentPage - 2);
    var e = Math.min(totalPages, currentPage + 2);
    if (s > 1) {
        html += "<button class=\"page-btn\" data-page=\"1\">1</button>";
        if (s > 2) { html += "<span style=\"padding:0 5px;color:#999\">...</span>"; }
    }
    for (var i = s; i <= e; i++) {
        html += i === currentPage
            ? "<button class=\"page-btn active\">" + i + "</button>"
            : "<button class=\"page-btn\" data-page=\"" + i + "\">" + i + "</button>";
    }
    if (e < totalPages) {
        if (e < totalPages - 1) {
            html += "<span style=\"padding:0 5px;color:#999\">...</span>";
        }
        html += "<button class=\"page-btn\" data-page=\""
            + totalPages + "\">" + totalPages + "</button>";
    }
    html += currentPage === totalPages
        ? "<button class=\"page-btn disabled\"><i class=\"fas fa-chevron-right\"></i></button>"
        : "<button class=\"page-btn\" data-page=\"" + (currentPage + 1)
          + "\"><i class=\"fas fa-chevron-right\"></i></button>";
    c.innerHTML = html;
    var btns = c.querySelectorAll(".page-btn[data-page]");
    for (var j = 0; j < btns.length; j++) {
        btns[j].addEventListener("click", function() {
            var pg = parseInt(this.getAttribute("data-page"));
            if (pg >= 1 && pg <= totalPages) { callback(pg); }
        });
    }
}

function timeAgo(d) {
    var s = Math.floor(
        (new Date().getTime() - new Date(d).getTime()) / 1000
    );
    if (s < 60)     { return "Just now"; }
    if (s < 3600)   { return Math.floor(s / 60) + "m ago"; }
    if (s < 86400)  { return Math.floor(s / 3600) + "h ago"; }
    if (s < 604800) { return Math.floor(s / 86400) + "d ago"; }
    return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });
}