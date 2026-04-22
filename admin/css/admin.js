/* ========================================
   LUXE WATCHES ADMIN - Main JavaScript
   ======================================== */

// ⚠️ SAME SUPABASE CREDENTIALS - APNA DAALO
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

/* ========================================
   AUTH CHECK
   ======================================== */
function checkAuth() {
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }

    // Set admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = sessionStorage.getItem('adminUser') || 'Admin';
    }

    // Logout
    document.addEventListener('click', (e) => {
        if (e.target.closest('#logoutBtn')) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('adminLoggedIn');
                sessionStorage.removeItem('adminUser');
                window.location.href = 'index.html';
            }
        }
    });

    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        if (sidebarClose) sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));

        // Close on outside click on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

/* ========================================
   SUPABASE HELPERS (CRUD)
   ======================================== */

// READ
async function adminQuery(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    const params = [];

    params.push(`select=${options.select || '*'}`);

    if (options.filters) {
        options.filters.forEach(f => params.push(f));
    }
    if (options.order) params.push(`order=${options.order}`);
    if (options.limit !== undefined) params.push(`limit=${options.limit}`);
    if (options.offset !== undefined) params.push(`offset=${options.offset}`);

    url += params.join('&');

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };

    if (options.count) headers['Prefer'] = 'count=exact';

    const res = await fetch(url, { headers });

    let count = null;
    if (options.count) {
        const cr = res.headers.get('content-range');
        if (cr) count = parseInt(cr.split('/')[1]);
    }

    const data = await res.json();
    return { data, count };
}

// CREATE
async function adminInsert(table, body) {
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

// UPDATE
async function adminUpdate(table, id, body) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
    const res = await fetch(url, {
        method: 'PATCH',
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

// DELETE
async function adminDelete(table, id) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    return res.ok;
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/* ========================================
   ADMIN PAGINATION
   ======================================== */
function renderAdminPagination(containerId, currentPage, totalPages, callback) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = '';

    // Prev
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
    </button>`;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (start > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (start > 2) html += `<span style="padding:0 5px;color:#999">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span style="padding:0 5px;color:#999">...</span>`;
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
    </button>`;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const pg = parseInt(btn.dataset.page);
            if (pg >= 1 && pg <= totalPages) callback(pg);
        });
    });
}

/* ========================================
   TIME AGO HELPER
   ======================================== */
function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}