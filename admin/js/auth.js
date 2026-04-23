var AUTH_SALT = "LUXE_WATCHES_2025_SECURE";

function simpleHash(str) {
    var combined = str + AUTH_SALT;
    var h1 = 0, h2 = 0, h3 = 5381;
    for (var i = 0; i < combined.length; i++) {
        var c = combined.charCodeAt(i);
        h1 = ((h1 << 5) - h1) + c; h1 = h1 & h1;
        h2 = c + ((h2 << 6) + (h2 << 16) - h2); h2 = h2 & h2;
        h3 = ((h3 << 5) + h3) + c; h3 = h3 & h3;
    }
    var x1 = Math.abs(h1).toString(16);
    while (x1.length < 12) { x1 = "0" + x1; }
    var x2 = Math.abs(h2).toString(16);
    while (x2.length < 12) { x2 = "0" + x2; }
    var x3 = Math.abs(h3).toString(16);
    while (x3.length < 12) { x3 = "0" + x3; }
    return x1 + x2 + x3;
}

function generateToken() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var t = "";
    for (var i = 0; i < 32; i++) {
        t += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return t + "_" + Date.now();
}

function validateEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function validatePassword(p) {
    var errs = [];
    if (p.length < 6)          { errs.push("Min 6 chars"); }
    if (!/[a-zA-Z]/.test(p))   { errs.push("Need a letter"); }
    if (!/[0-9]/.test(p))      { errs.push("Need a number"); }
    return { valid: errs.length === 0, errors: errs };
}

function validateUsername(u) {
    if (u.length < 3) { return { valid: false, error: "Min 3 chars" }; }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) {
        return { valid: false, error: "Letters, numbers, _ only" };
    }
    return { valid: true, error: "" };
}

function loginUser(username, password) {
    if (!SUPABASE_URL || SUPABASE_URL.indexOf("supabase.co") === -1) {
        initAdminConfig();
    }
    var hash = simpleHash(password);
    console.log("Login:", username, "Hash:", hash);
    return adminQuery("admin_users", {
        filters: ["username=eq." + username.toLowerCase()]
    })
    .then(function(r) {
        if (!r.data || r.data.length === 0) {
            return { success: false, error: "Username not found" };
        }
        var user = r.data[0];
        console.log("DB hash:", user.password_hash);
        console.log("My hash:", hash);
        if (user.password_hash !== hash) {
            return { success: false, error: "Wrong password" };
        }
        if (user.is_active === false) {
            return { success: false, error: "Account deactivated" };
        }
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminUser",     user.username);
        sessionStorage.setItem("adminUserId",   String(user.id));
        sessionStorage.setItem("adminRole",     user.role || "admin");
        sessionStorage.setItem("adminFullName", user.full_name || user.username);
        sessionStorage.setItem("adminEmail",    user.email || "");
        adminUpdate("admin_users", user.id, {
            last_login: new Date().toISOString()
        });
        return { success: true, user: user };
    })
    .catch(function(err) {
        console.error("loginUser:", err);
        return { success: false, error: "Connection error" };
    });
}

function signupUser(data) {
    if (!data.username || !data.email || !data.password || !data.fullName) {
        return Promise.resolve({ success: false, error: "All fields required" });
    }
    var uc = validateUsername(data.username);
    if (!uc.valid) { return Promise.resolve({ success: false, error: uc.error }); }
    if (!validateEmail(data.email)) {
        return Promise.resolve({ success: false, error: "Invalid email" });
    }
    var pc = validatePassword(data.password);
    if (!pc.valid) {
        return Promise.resolve({ success: false, error: pc.errors.join(", ") });
    }
    return adminQuery("admin_users", {
        filters: ["username=eq." + data.username.toLowerCase()]
    })
    .then(function(r1) {
        if (r1.data && r1.data.length > 0) {
            return { success: false, error: "Username taken" };
        }
        return adminQuery("admin_users", {
            filters: ["email=eq." + data.email.toLowerCase()]
        })
        .then(function(r2) {
            if (r2.data && r2.data.length > 0) {
                return { success: false, error: "Email registered" };
            }
            var hash = simpleHash(data.password);
            return adminInsert("admin_users", {
                username:      data.username.toLowerCase(),
                email:         data.email.toLowerCase(),
                password_hash: hash,
                full_name:     data.fullName,
                role:          "admin",
                is_active:     true
            })
            .then(function(ok) {
                if (ok) {
                    return { success: true, message: "Account created! Login now." };
                }
                return { success: false, error: "Create failed" };
            });
        });
    })
    .catch(function() {
        return { success: false, error: "Connection error" };
    });
}

function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        return Promise.resolve({ success: false, error: "All fields required" });
    }
    var pc = validatePassword(newPassword);
    if (!pc.valid) {
        return Promise.resolve({ success: false, error: pc.errors.join(", ") });
    }
    if (currentPassword === newPassword) {
        return Promise.resolve({ success: false, error: "Must be different" });
    }
    return adminQuery("admin_users", { filters: ["id=eq." + userId] })
    .then(function(r) {
        if (!r.data || r.data.length === 0) {
            return { success: false, error: "User not found" };
        }
        if (r.data[0].password_hash !== simpleHash(currentPassword)) {
            return { success: false, error: "Wrong current password" };
        }
        return adminUpdate("admin_users", userId, {
            password_hash: simpleHash(newPassword),
            updated_at:    new Date().toISOString()
        })
        .then(function(ok) {
            return ok
                ? { success: true,  message: "Password changed!" }
                : { success: false, error: "Failed" };
        });
    })
    .catch(function() {
        return { success: false, error: "Connection error" };
    });
}

function updateProfile(userId, data) {
    var ud = { updated_at: new Date().toISOString() };
    if (data.fullName)  { ud.full_name  = data.fullName; }
    if (data.email) {
        if (!validateEmail(data.email)) {
            return Promise.resolve({ success: false, error: "Invalid email" });
        }
        ud.email = data.email.toLowerCase();
    }
    if (data.avatarUrl) { ud.avatar_url = data.avatarUrl; }
    return adminUpdate("admin_users", userId, ud)
    .then(function(ok) {
        if (ok) {
            if (data.fullName) {
                sessionStorage.setItem("adminFullName", data.fullName);
            }
            if (data.email) {
                sessionStorage.setItem("adminEmail", data.email);
            }
            return { success: true, message: "Updated!" };
        }
        return { success: false, error: "Failed" };
    });
}

function generateResetToken(email) {
    return adminQuery("admin_users", {
        filters: ["email=eq." + email.toLowerCase()]
    })
    .then(function(r) {
        if (!r.data || r.data.length === 0) {
            return { success: false, error: "Email not found" };
        }
        var token = generateToken();
        var exp   = new Date();
        exp.setHours(exp.getHours() + 1);
        return adminInsert("password_reset_tokens", {
            user_id:    r.data[0].id,
            token:      token,
            expires_at: exp.toISOString()
        })
        .then(function(ok) {
            return ok
                ? { success: true, token: token }
                : { success: false, error: "Failed" };
        });
    });
}

function resetPasswordWithToken(token, newPassword) {
    var pc = validatePassword(newPassword);
    if (!pc.valid) {
        return Promise.resolve({ success: false, error: pc.errors.join(", ") });
    }
    return adminQuery("password_reset_tokens", {
        filters: ["token=eq." + token, "used=eq.false"]
    })
    .then(function(r) {
        if (!r.data || r.data.length === 0) {
            return { success: false, error: "Invalid token" };
        }
        var td = r.data[0];
        if (new Date() > new Date(td.expires_at)) {
            return { success: false, error: "Token expired" };
        }
        return adminUpdate("admin_users", td.user_id, {
            password_hash: simpleHash(newPassword)
        })
        .then(function(ok) {
            if (ok) {
                adminUpdate("password_reset_tokens", td.id, { used: true });
                return { success: true, message: "Password reset!" };
            }
            return { success: false, error: "Failed" };
        });
    });
}

function getCurrentUserId() {
    var id = sessionStorage.getItem("adminUserId");
    return id ? parseInt(id) : null;
}

function getCurrentUser() {
    return {
        id:       getCurrentUserId(),
        username: sessionStorage.getItem("adminUser")     || "",
        fullName: sessionStorage.getItem("adminFullName") || "",
        email:    sessionStorage.getItem("adminEmail")    || "",
        role:     sessionStorage.getItem("adminRole")     || "admin"
    };
}

function isSuperAdmin() {
    return sessionStorage.getItem("adminRole") === "superadmin";
}

function logoutUser() {
    sessionStorage.clear();
    window.location.href = "index.html";
}