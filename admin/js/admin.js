var SUPABASE_URL = "https://fxpxsmnakwqczgrhiwkl.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cHhzbW5ha3dxY3pncmhpd2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU5MzAsImV4cCI6MjA5MjQwMTkzMH0.-gmIrIiWakuHKOiuDnlW9ZQOJWRntDHUTkzXiU79Hao";

function setSupabaseConfig(url, key) {
    SUPABASE_URL = url;
    SUPABASE_KEY = key;
}

function checkAuth() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "index.html";
        return;
    }

    var adminNameEl = document.getElementById("adminName");
    if (adminNameEl) {
        var storedUser = sessionStorage.getItem("adminUser");
        adminNameEl.textContent = storedUser ? storedUser : "Admin";
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to logout?")) {
                sessionStorage.removeItem("adminLoggedIn");
                sessionStorage.removeItem("adminUser");
                window.location.href = "index.html";
            }
        });
    }

    var menuToggle = document.getElementById("menuToggle");
    var sidebar = document.getElementById("sidebar");
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
    if (!options) {
        options = {};
    }

    var params = [];

    if (options.select) {
        params.push("select=" + options.select);
    } else {
        params.push("select=*");
    }

    if (options.filters && options.filters.length > 0) {
        for (var fi = 0; fi < options.filters.length; fi++) {
            params.push(options.filters[fi]);
        }
    }

    if (options.order) {
        params.push("order=" + options.order);
    }

    if (options.limit !== undefined && options.limit !== null) {
        params.push("limit=" + options.limit);
    }

    if (options.offset !== undefined && options.offset !== null) {
        params.push("offset=" + options.offset);
    }

    var url = SUPABASE_URL + "/rest/v1/" + table + "?" + params.join("&");

    var fetchOptions = {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": options.count ? "count=exact" : ""
        }
    };

    return fetch(url, fetchOptions).then(function(res) {
        var count = null;
        if (options.count) {
            var cr = res.headers.get("content-range");
            if (cr) {
                var parts = cr.split("/");
                if (parts.length > 1) {
                    count = parseInt(parts[1]);
                }
            }
        }
        return res.json().then(function(data) {
            return { data: data, count: count };
        });
    }).catch(function(err) {
        console.error("adminQuery error:", err);
        return { data: [], count: 0 };
    });
}

function adminInsert(table, body) {
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
    }).catch(function(err) {
        console.error("adminInsert error:", err);
        return false;
    });
}

function adminUpdate(table, id, body) {
    var url = SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id;
    return fetch(url, {
        method: "PATCH",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        body: JSON.stringify(body)
    }).then(function(res) {
        return res.ok;
    }).catch(function(err) {
        console.error("adminUpdate error:", err);
        return false;
    });
}

function adminDelete(table, id) {
    var url = SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id;
    return fetch(url, {
        method: "DELETE",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY
        }
    }).then(function(res) {
        return res.ok;
    }).catch(function(err) {
        console.error("adminDelete error:", err);
        return false;
    });
}

function showToast(message, type) {
    if (!type) {
        type = "success";
    }

    var container = document.getElementById("toastContainer");
    if (!container) {
        return;
    }

    var toast = document.createElement("div");
    toast.className = "toast " + type;

    var icon = document.createElement("i");
    if (type === "success") {
        icon.className = "fas fa-check-circle";
    } else {
        icon.className = "fas fa-exclamation-circle";
    }

    var msgSpan = document.createElement("span");
    msgSpan.textContent = message;

    var closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";

    var closeIcon = document.createElement("i");
    closeIcon.className = "fas fa-times";
    closeBtn.appendChild(closeIcon);

    closeBtn.addEventListener("click", function() {
        if (toast.parentElement) {
            toast.remove();
        }
    });

    toast.appendChild(icon);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(function() {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

function renderAdminPagination(containerId, currentPage, totalPages, callback) {
    var container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    var html = "";

    if (currentPage === 1) {
        html += "<button class=\"page-btn disabled\" data-page=\"0\">";
    } else {
        html += "<button class=\"page-btn\" data-page=\"" + (currentPage - 1) + "\">";
    }
    html += "<i class=\"fas fa-chevron-left\"></i></button>";

    var startP = currentPage - 2;
    if (startP < 1) { startP = 1; }

    var endP = currentPage + 2;
    if (endP > totalPages) { endP = totalPages; }

    if (startP > 1) {
        html += "<button class=\"page-btn\" data-page=\"1\">1</button>";
        if (startP > 2) {
            html += "<span style=\"padding:0 5px;color:#999\">...</span>";
        }
    }

    for (var i = startP; i <= endP; i++) {
        if (i === currentPage) {
            html += "<button class=\"page-btn active\" data-page=\"" + i + "\">" + i + "</button>";
        } else {
            html += "<button class=\"page-btn\" data-page=\"" + i + "\">" + i + "</button>";
        }
    }

    if (endP < totalPages) {
        if (endP < totalPages - 1) {
            html += "<span style=\"padding:0 5px;color:#999\">...</span>";
        }
        html += "<button class=\"page-btn\" data-page=\"" + totalPages + "\">" + totalPages + "</button>";
    }

    if (currentPage === totalPages) {
        html += "<button class=\"page-btn disabled\" data-page=\"0\">";
    } else {
        html += "<button class=\"page-btn\" data-page=\"" + (currentPage + 1) + "\">";
    }
    html += "<i class=\"fas fa-chevron-right\"></i></button>";

    container.innerHTML = html;

    var btns = container.querySelectorAll(".page-btn");
    for (var j = 0; j < btns.length; j++) {
        if (!btns[j].classList.contains("disabled") && !btns[j].classList.contains("active")) {
            btns[j].addEventListener("click", function() {
                var pg = parseInt(this.getAttribute("data-page"));
                if (pg >= 1 && pg <= totalPages) {
                    callback(pg);
                }
            });
        }
    }
}

function timeAgo(dateStr) {
    var now = new Date();
    var date = new Date(dateStr);
    var seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
        return "Just now";
    }
    if (seconds < 3600) {
        return Math.floor(seconds / 60) + "m ago";
    }
    if (seconds < 86400) {
        return Math.floor(seconds / 3600) + "h ago";
    }
    if (seconds < 604800) {
        return Math.floor(seconds / 86400) + "d ago";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}