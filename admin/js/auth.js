var AUTH_SALT = "LUXE_WATCHES_2025_SECURE";

function simpleHash(str) {
    var combined = str + AUTH_SALT;
    var hash = 0;
    for (var i = 0; i < combined.length; i++) {
        var c = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash;
    }
    var hex = Math.abs(hash).toString(16);
    while (hex.length < 12) { hex = "0" + hex; }

    var hash2 = 0;
    for (var j = 0; j < combined.length; j++) {
        hash2 = combined.charCodeAt(j) + ((hash2 << 6) + (hash2 << 16) - hash2);
        hash2 = hash2 & hash2;
    }
    var hex2 = Math.abs(hash2).toString(16);
    while (hex2.length < 12) { hex2 = "0" + hex2; }

    var hash3 = 5381;
    for (var k = 0; k < combined.length; k++) {
        hash3 = ((hash3 << 5) + hash3) + combined.charCodeAt(k);
        hash3 = hash3 & hash3;
    }
    var hex3 = Math.abs(hash3).toString(16);
    while (hex3.length < 12) { hex3 = "0" + hex3; }

    return hex + hex2 + hex3;
}

function generateToken() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var token = "";
    for (var i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token + "_" + Date.now();
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    var errors = [];
    if (password.length < 6) { errors.push("At least 6 characters"); }
    if (!/[a-zA-Z]/.test(password)) { errors.push("At least one letter"); }
    if (!/[0-9]/.test(password)) { errors.push("At least one number"); }
    return { valid: errors.length === 0, errors: errors };
}

function validateUsername(username) {
    if (username.length < 3) { return { valid: false, error: "At least 3 characters" }; }
    if (username.length > 30) { return { valid: false, error: "Max 30 characters" }; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { return { valid: false, error: "Letters, numbers, underscore only" }; }
    return { valid: true, error: "" };
}

function loginUser(username, password) {
    var passwordHash = simpleHash(password);
    console.log("Login attempt:", username);
    console.log("Hash:", passwordHash);
    console.log("Supabase URL:", SUPABASE_URL);

    return adminQuery("admin_users", {
        filters: ["username=eq." + username.toLowerCase()]
    }).then(function(result) {
        console.log("Result:", result);
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Username not found" };
        }
        var user = result.data[0];
        console.log("DB Hash:", user.password_hash);
        console.log("My Hash:", passwordHash);
        console.log("Match:", user.password_hash === passwordHash);

        if (user.password_hash !== passwordHash) {
            return { success: false, error: "Wrong password" };
        }
        if (user.is_active === false) {
            return { success: false, error: "Account deactivated" };
        }
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminUser", user.username);
        sessionStorage.setItem("adminUserId", String(user.id));
        sessionStorage.setItem("adminRole", user.role || "admin");
        sessionStorage.setItem("adminFullName", user.full_name || user.username);
        sessionStorage.setItem("adminEmail", user.email || "");
        adminUpdate("admin_users", user.id, { last_login: new Date().toISOString() });
        return { success: true, user: user };
    }).catch(function(err) {
        console.error("loginUser error:", err);
        return { success: false, error: "Connection error" };
    });
}

function signupUser(data) {
    if (!data.username || !data.email || !data.password || !data.fullName) {
        return Promise.resolve({ success: false, error: "All fields required" });
    }
    var uc = validateUsername(data.username);
    if (!uc.valid) { return Promise.resolve({ success: false, error: uc.error }); }
    if (!validateEmail(data.email)) { return Promise.resolve({ success: false, error: "Invalid email" }); }
    var pc = validatePassword(data.password);
    if (!pc.valid) { return Promise.resolve({ success: false, error: pc.errors.join(", ") }); }

    return adminQuery("admin_users", {
        filters: ["username=eq." + data.username.toLowerCase()]
    }).then(function(r1) {
        if (r1.data && r1.data.length > 0) {
            return { success: false, error: "Username already taken" };
        }
        return adminQuery("admin_users", {
            filters: ["email=eq." + data.email.toLowerCase()]
        }).then(function(r2) {
            if (r2.data && r2.data.length > 0) {
                return { success: false, error: "Email already registered" };
            }
            var hash = simpleHash(data.password);
            console.log("Signup hash:", hash);
            return adminInsert("admin_users", {
                username: data.username.toLowerCase(),
                email: data.email.toLowerCase(),
                password_hash: hash,
                full_name: data.fullName,
                role: "admin",
                is_active: true
            }).then(function(ok) {
                if (ok) { return { success: true, message: "Account created! You can now login." }; }
                return { success: false, error: "Failed to create account" };
            });
        });
    }).catch(function(err) {
        console.error("signupUser error:", err);
        return { success: false, error: "Connection error" };
    });
}

function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        return Promise.resolve({ success: false, error: "All fields required" });
    }
    var pc = validatePassword(newPassword);
    if (!pc.valid) { return Promise.resolve({ success: false, error: pc.errors.join(", ") }); }
    if (currentPassword === newPassword) {
        return Promise.resolve({ success: false, error: "New password must be different" });
    }
    var currentHash = simpleHash(currentPassword);
    return adminQuery("admin_users", {
        filters: ["id=eq." + userId]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "User not found" };
        }
        var user = result.data[0];
        if (user.password_hash !== currentHash) {
            return { success: false, error: "Current password is incorrect" };
        }
        var newHash = simpleHash(newPassword);
        return adminUpdate("admin_users", userId, {
            password_hash: newHash,
            updated_at: new Date().toISOString()
        }).then(function(ok) {
            if (ok) { return { success: true, message: "Password changed!" }; }
            return { success: false, error: "Update failed" };
        });
    }).catch(function(err) {
        console.error("changePassword error:", err);
        return { success: false, error: "Connection error" };
    });
}

function updateProfile(userId, data) {
    var updateData = { updated_at: new Date().toISOString() };
    if (data.fullName) { updateData.full_name = data.fullName; }
    if (data.email) {
        if (!validateEmail(data.email)) {
            return Promise.resolve({ success: false, error: "Invalid email" });
        }
        updateData.email = data.email.toLowerCase();
    }
    if (data.avatarUrl) { updateData.avatar_url = data.avatarUrl; }
    return adminUpdate("admin_users", userId, updateData).then(function(ok) {
        if (ok) {
            if (data.fullName) { sessionStorage.setItem("adminFullName", data.fullName); }
            if (data.email) { sessionStorage.setItem("adminEmail", data.email); }
            return { success: true, message: "Profile updated!" };
        }
        return { success: false, error: "Update failed" };
    });
}

function generateResetToken(email) {
    return adminQuery("admin_users", {
        filters: ["email=eq." + email.toLowerCase()]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Email not found" };
        }
        var user = result.data[0];
        var token = generateToken();
        var expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        return adminInsert("password_reset_tokens", {
            user_id: user.id,
            token: token,
            expires_at: expiresAt.toISOString()
        }).then(function(ok) {
            if (ok) { return { success: true, token: token, userId: user.id }; }
            return { success: false, error: "Token generation failed" };
        });
    });
}

function resetPasswordWithToken(token, newPassword) {
    var pc = validatePassword(newPassword);
    if (!pc.valid) { return Promise.resolve({ success: false, error: pc.errors.join(", ") }); }
    return adminQuery("password_reset_tokens", {
        filters: ["token=eq." + token, "used=eq.false"]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Invalid or expired token" };
        }
        var tokenData = result.data[0];
        if (new Date() > new Date(tokenData.expires_at)) {
            return { success: false, error: "Token expired" };
        }
        var newHash = simpleHash(newPassword);
        return adminUpdate("admin_users", tokenData.user_id, {
            password_hash: newHash,
            updated_at: new Date().toISOString()
        }).then(function(ok) {
            if (ok) {
                adminUpdate("password_reset_tokens", tokenData.id, { used: true });
                return { success: true, message: "Password reset! Login now." };
            }
            return { success: false, error: "Reset failed" };
        });
    });
}

function getCurrentUserId() {
    var id = sessionStorage.getItem("adminUserId");
    return id ? parseInt(id) : null;
}

function getCurrentUser() {
    return {
        id: getCurrentUserId(),
        username: sessionStorage.getItem("adminUser") || "",
        fullName: sessionStorage.getItem("adminFullName") || "",
        email: sessionStorage.getItem("adminEmail") || "",
        role: sessionStorage.getItem("adminRole") || "admin"
    };
}

function isSuperAdmin() {
    return sessionStorage.getItem("adminRole") === "superadmin";
}

function logoutUser() {
    sessionStorage.clear();
    window.location.href = "index.html";
}