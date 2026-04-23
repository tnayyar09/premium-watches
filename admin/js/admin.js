var SUPABASE_URL = "aHR0cHM6Ly9meHB4c21uYWt3cWN6Z3JoaXdrbC5zdXBhYmFzZS5jbw==";
var SUPABASE_KEY = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1aNGNIaHpiVzVoYTNkeFkzcG5jbWhwZDJ0c0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpZNE1qVTVNekFzSW1WNGNDSTZNakE1TWpRd01Ua3pNSDAuLWdtSXJJaVdha3VIS09pdURubFc5WlFPSldSbnRESFVUa3pYaVU3OUhhbw==";

function checkAuth() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "index.html";
        return;
    }
    var adminNameEl = document.getElementById("adminName");
    if (adminNameEl) {
        var stored = sessionStorage.getItem("adminUser");
        adminNameEl.textContent = stored ? stored : "Admin";
    }
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to logout?")) {
                sessionStorage.clear();
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
    if (!options) { options = {}; }
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
    if (options.order) { params.push("order=" + options.order); }
    if (options.limit !== undefined && options.limit !== null) { params.push("limit=" + options.limit); }
    if (options.offset !== undefined && options.offset !== null) { params.push("offset=" + options.offset); }

    var url = SUPABASE_URL + "/rest/v1/" + table + "?" + params.join("&");
    var headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
    };
    if (options.count) { headers["Prefer"] = "count=exact"; }

    return fetch(url, { method: "GET", headers: headers })
    .then(function(res) {
        var count = null;
        if (options.count) {
            var cr = res.headers.get("content-range");
            if (cr) {
                var parts = cr.split("/");
                if (parts.length > 1 && parts[1] !== "*") {
                    count = parseInt(parts[1]);
                }
            }
        }
        return res.json().then(function(data) {
            return { data: Array.isArray(data) ? data : [], count: count };
        });
    })
    .catch(function(err) {
        console.error("adminQuery error:", err.message);
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
    })
    .then(function(res) {
        if (!res.ok) {
            return res.text().then(function(t) {
                console.error("Insert error:", t);
                return false;
            });
        }
        return true;
    })
    .catch(function(err) {
        console.error("Insert failed:", err.message);
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
    })
    .then(function(res) { return res.ok; })
    .catch(function(err) {
        console.error("Update failed:", err.message);
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
    })
    .then(function(res) { return res.ok; })
    .catch(function(err) {
        console.error("Delete failed:", err.message);
        return false;
    });
}

function showToast(message, type) {
    if (!type) { type = "success"; }
    var container = document.getElementById("toastContainer");
    if (!container) { alert(message); return; }
    var toast = document.createElement("div");
    toast.className = "toast " + type;
    var icon = document.createElement("i");
    icon.className = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    var msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    var closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    var closeIcon = document.createElement("i");
    closeIcon.className = "fas fa-times";
    closeBtn.appendChild(closeIcon);
    closeBtn.addEventListener("click", function() {
        if (toast.parentElement) { toast.remove(); }
    });
    toast.appendChild(icon);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    setTimeout(function() {
        if (toast.parentElement) { toast.remove(); }
    }, 4000);
}

function renderAdminPagination(containerId, currentPage, totalPages, callback) {
    var container = document.getElementById(containerId);
    if (!container) { return; }
    if (!totalPages || totalPages <= 1) { container.innerHTML = ""; return; }
    var html = "";
    if (currentPage === 1) {
        html += "<button class=\"page-btn disabled\"><i class=\"fas fa-chevron-left\"></i></button>";
    } else {
        html += "<button class=\"page-btn\" data-page=\"" + (currentPage - 1) + "\"><i class=\"fas fa-chevron-left\"></i></button>";
    }
    var startP = currentPage - 2;
    if (startP < 1) { startP = 1; }
    var endP = currentPage + 2;
    if (endP > totalPages) { endP = totalPages; }
    if (startP > 1) {
        html += "<button class=\"page-btn\" data-page=\"1\">1</button>";
        if (startP > 2) { html += "<span style=\"padding:0 5px;color:#999\">...</span>"; }
    }
    for (var i = startP; i <= endP; i++) {
        if (i === currentPage) {
            html += "<button class=\"page-btn active\">" + i + "</button>";
        } else {
            html += "<button class=\"page-btn\" data-page=\"" + i + "\">" + i + "</button>";
        }
    }
    if (endP < totalPages) {
        if (endP < totalPages - 1) { html += "<span style=\"padding:0 5px;color:#999\">...</span>"; }
        html += "<button class=\"page-btn\" data-page=\"" + totalPages + "\">" + totalPages + "</button>";
    }
    if (currentPage === totalPages) {
        html += "<button class=\"page-btn disabled\"><i class=\"fas fa-chevron-right\"></i></button>";
    } else {
        html += "<button class=\"page-btn\" data-page=\"" + (currentPage + 1) + "\"><i class=\"fas fa-chevron-right\"></i></button>";
    }
    container.innerHTML = html;
    var btns = container.querySelectorAll(".page-btn[data-page]");
    for (var j = 0; j < btns.length; j++) {
        btns[j].addEventListener("click", function() {
            var pg = parseInt(this.getAttribute("data-page"));
            if (pg >= 1 && pg <= totalPages) { callback(pg); }
        });
    }
}

function timeAgo(dateStr) {
    var now = new Date();
    var date = new Date(dateStr);
    var seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) { return "Just now"; }
    if (seconds < 3600) { return Math.floor(seconds / 60) + "m ago"; }
    if (seconds < 86400) { return Math.floor(seconds / 3600) + "h ago"; }
    if (seconds < 604800) { return Math.floor(seconds / 86400) + "d ago"; }
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}