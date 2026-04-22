var AUTH_SALT = "LUXE_WATCHES_2025_SECURE";

function simpleHash(str) {
    var hash = 0;
    var combined = str + AUTH_SALT;
    for (var i = 0; i < combined.length; i++) {
        var char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    var hex = Math.abs(hash).toString(16);
    while (hex.length < 12) {
        hex = "0" + hex;
    }

    var hash2 = 0;
    for (var j = 0; j < combined.length; j++) {
        hash2 = combined.charCodeAt(j) + ((hash2 << 6) + (hash2 << 16) - hash2);
        hash2 = hash2 & hash2;
    }
    var hex2 = Math.abs(hash2).toString(16);
    while (hex2.length < 12) {
        hex2 = "0" + hex2;
    }

    var hash3 = 5381;
    for (var k = 0; k < combined.length; k++) {
        hash3 = ((hash3 << 5) + hash3) + combined.charCodeAt(k);
        hash3 = hash3 & hash3;
    }
    var hex3 = Math.abs(hash3).toString(16);
    while (hex3.length < 12) {
        hex3 = "0" + hex3;
    }

    return hex + hex2 + hex3;
}

function generateToken() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var token = "";
    for (var i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token + "_" + Date.now();
}

function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    var errors = [];
    if (password.length < 6) {
        errors.push("At least 6 characters required");
    }
    if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
        errors.push("At least one letter required");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("At least one number required");
    }
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function validateUsername(username) {
    if (username.length < 3) {
        return { valid: false, error: "At least 3 characters required" };
    }
    if (username.length > 30) {
        return { valid: false, error: "Maximum 30 characters allowed" };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: "Only letters, numbers and underscore allowed" };
    }
    return { valid: true, error: "" };
}

function loginUser(username, password) {
    var passwordHash = simpleHash(password);
    console.log("Login attempt:", username);
    console.log("Password hash:", passwordHash);

    return adminQuery("admin_users", {
        filters: [
            "username=eq." + encodeURIComponent(username),
            "password_hash=eq." + encodeURIComponent(passwordHash)
        ]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Invalid username or password" };
        }

        var user = result.data[0];

        if (!user.is_active) {
            return { success: false, error: "Account is deactivated. Contact super admin." };
        }

        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminUser", user.username);
        sessionStorage.setItem("adminUserId", user.id.toString());
        sessionStorage.setItem("adminRole", user.role || "admin");
        sessionStorage.setItem("adminFullName", user.full_name || user.username);
        sessionStorage.setItem("adminEmail", user.email || "");

        adminUpdate("admin_users", user.id, {
            last_login: new Date().toISOString()
        });

        adminInsert("admin_login_logs", {
            user_id: user.id,
            username: user.username,
            status: "success",
            user_agent: navigator.userAgent
        });

        return { success: true, user: user };
    }).catch(function(err) {
        console.error("Login error:", err);
        return { success: false, error: "Connection error. Try again." };
    });
}

function signupUser(data) {
    if (!data.username || !data.email || !data.password || !data.fullName) {
        return Promise.resolve({ success: false, error: "All fields are required" });
    }

    var usernameCheck = validateUsername(data.username);
    if (!usernameCheck.valid) {
        return Promise.resolve({ success: false, error: usernameCheck.error });
    }

    if (!validateEmail(data.email)) {
        return Promise.resolve({ success: false, error: "Invalid email address" });
    }

    var passCheck = validatePassword(data.password);
    if (!passCheck.valid) {
        return Promise.resolve({ success: false, error: passCheck.errors.join(", ") });
    }

    return adminQuery("admin_users", {
        filters: ["username=eq." + encodeURIComponent(data.username)]
    }).then(function(r1) {
        if (r1.data && r1.data.length > 0) {
            return { success: false, error: "Username already exists" };
        }

        return adminQuery("admin_users", {
            filters: ["email=eq." + encodeURIComponent(data.email)]
        }).then(function(r2) {
            if (r2.data && r2.data.length > 0) {
                return { success: false, error: "Email already registered" };
            }

            var passwordHash = simpleHash(data.password);

            return adminInsert("admin_users", {
                username: data.username.toLowerCase(),
                email: data.email.toLowerCase(),
                password_hash: passwordHash,
                full_name: data.fullName,
                role: "admin",
                is_active: true
            }).then(function(ok) {
                if (ok) {
                    return { success: true, message: "Account created successfully!" };
                } else {
                    return { success: false, error: "Failed to create account. Try again." };
                }
            });
        });
    }).catch(function(err) {
        console.error("Signup error:", err);
        return { success: false, error: "Connection error. Try again." };
    });
}

function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        return Promise.resolve({ success: false, error: "All fields required" });
    }

    var passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
        return Promise.resolve({ success: false, error: passCheck.errors.join(", ") });
    }

    if (currentPassword === newPassword) {
        return Promise.resolve({ success: false, error: "New password must be different" });
    }

    var currentHash = simpleHash(currentPassword);

    return adminQuery("admin_users", {
        filters: [
            "id=eq." + userId,
            "password_hash=eq." + encodeURIComponent(currentHash)
        ]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Current password is incorrect" };
        }

        var newHash = simpleHash(newPassword);

        return adminUpdate("admin_users", userId, {
            password_hash: newHash,
            updated_at: new Date().toISOString()
        }).then(function(ok) {
            if (ok) {
                return { success: true, message: "Password changed successfully!" };
            }
            return { success: false, error: "Failed to update. Try again." };
        });
    }).catch(function(err) {
        console.error("Change password error:", err);
        return { success: false, error: "Connection error. Try again." };
    });
}

function updateProfile(userId, data) {
    var updateData = {
        updated_at: new Date().toISOString()
    };

    if (data.fullName) {
        updateData.full_name = data.fullName;
    }
    if (data.email) {
        if (!validateEmail(data.email)) {
            return Promise.resolve({ success: false, error: "Invalid email" });
        }
        updateData.email = data.email.toLowerCase();
    }
    if (data.avatarUrl) {
        updateData.avatar_url = data.avatarUrl;
    }

    return adminUpdate("admin_users", userId, updateData).then(function(ok) {
        if (ok) {
            if (data.fullName) {
                sessionStorage.setItem("adminFullName", data.fullName);
            }
            if (data.email) {
                sessionStorage.setItem("adminEmail", data.email);
            }
            return { success: true, message: "Profile updated!" };
        }
        return { success: false, error: "Update failed" };
    });
}

function generateResetToken(email) {
    return adminQuery("admin_users", {
        filters: ["email=eq." + encodeURIComponent(email.toLowerCase())]
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
            if (ok) {
                return {
                    success: true,
                    token: token,
                    userId: user.id,
                    username: user.username,
                    message: "Reset token generated. Use this token to reset your password."
                };
            }
            return { success: false, error: "Failed to generate token" };
        });
    });
}

function resetPasswordWithToken(token, newPassword) {
    var passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
        return Promise.resolve({ success: false, error: passCheck.errors.join(", ") });
    }

    return adminQuery("password_reset_tokens", {
        filters: [
            "token=eq." + encodeURIComponent(token),
            "used=eq.false"
        ]
    }).then(function(result) {
        if (!result.data || result.data.length === 0) {
            return { success: false, error: "Invalid or expired token" };
        }

        var tokenData = result.data[0];
        var now = new Date();
        var expires = new Date(tokenData.expires_at);

        if (now > expires) {
            return { success: false, error: "Token has expired. Generate a new one." };
        }

        var newHash = simpleHash(newPassword);

        return adminUpdate("admin_users", tokenData.user_id, {
            password_hash: newHash,
            updated_at: new Date().toISOString()
        }).then(function(ok) {
            if (ok) {
                adminUpdate("password_reset_tokens", tokenData.id, { used: true });
                return { success: true, message: "Password reset successfully! You can now login." };
            }
            return { success: false, error: "Failed to reset password" };
        });
    });
}

function isSuperAdmin() {
    return sessionStorage.getItem("adminRole") === "superadmin";
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

function logoutUser() {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminUser");
    sessionStorage.removeItem("adminUserId");
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminFullName");
    sessionStorage.removeItem("adminEmail");
    window.location.href = "index.html";
}