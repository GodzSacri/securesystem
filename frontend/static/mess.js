// ==================== CONSTANTS AND CONFIGURATION ====================
const CONFIG = {
    API_URL: "https://securesys-backend.onrender.com",
    TOKEN_KEY: "token",
    EMAIL_KEY: "email",
    ALLOWED_PATHS: ['/', '/login', '/register'],
    REQUEST_TIMEOUT: 10000,
    NOTIFICATION_DURATION: 3000
};

console.log("=== MESS.JS LOADED ===");
console.log("Config:", { ...CONFIG, API_URL: CONFIG.API_URL });

const Auth = {
    getToken: () => localStorage.getItem(CONFIG.TOKEN_KEY),
    setToken: (token) => {
        console.log("Setting token:", token ? `${token.substring(0, 50)}...` : "null");
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },
    clearToken: () => {
        console.log("Clearing token");
        localStorage.removeItem(CONFIG.TOKEN_KEY);
    },
    getEmail: () => localStorage.getItem(CONFIG.EMAIL_KEY),
    setEmail: (email) => {
        console.log("Setting email:", email);
        localStorage.setItem(CONFIG.EMAIL_KEY, email);
    },
    clearEmail: () => {
        console.log("Clearing email");
        localStorage.removeItem(CONFIG.EMAIL_KEY);
    },
    clearAll: () => {
        console.log("Clearing all localStorage");
        localStorage.clear();
    },
    
    isTokenValid: () => {
        const token = Auth.getToken();
        if (!token) {
            console.log("Token validation: No token present");
            return false;
        }
        
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const isValid = tokenData.exp * 1000 > Date.now();
            console.log(`Token validation: ${isValid ? "VALID" : "EXPIRED"} (expires: ${new Date(tokenData.exp * 1000).toLocaleString()})`);
            return isValid;
        } catch (e) {
            console.error("Token validation error:", e);
            return false;
        }
    },
    
    checkAuth: () => {
        const currentPath = window.location.pathname;
        const isAllowedPath = CONFIG.ALLOWED_PATHS.some(
            path => currentPath === path || currentPath.startsWith(path + '/')
        );
        
        console.log(`Checking auth for path: ${currentPath}, isAllowed: ${isAllowedPath}`);
        
        if (!Auth.isTokenValid() && !isAllowedPath) {
            console.log("Auth failed - redirecting to login");
            Auth.clearAll();
            window.location.href = '/';
            return false;
        }
        console.log("Auth passed");
        return true;
    }
};

/**
 * API Communication - FIXED for FormData
 */
const API = {
    fetch: async (url, options = {}) => {
        console.log(`API.fetch: ${options.method || 'GET'} ${url}`);
        
        const fullUrl = url.startsWith('http') ? url : `${CONFIG.API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        
        // Build headers - don't set Content-Type for FormData
        const headers = {
            'Authorization': `Bearer ${Auth.getToken()}`,
            ...options.headers
        };
        
        // Only add Content-Type JSON if it's not FormData and not already set
        const isFormData = options.body instanceof FormData;
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        console.log(`Request: ${options.method || 'GET'} ${fullUrl}`);
        console.log(`Headers: Authorization=${headers.Authorization ? 'Present' : 'Missing'}, Content-Type=${headers['Content-Type'] || 'Not set (FormData)'}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            const response = await fetch(fullUrl, { 
                ...options, 
                headers,
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            
            console.log(`Response status: ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                console.log("Unauthorized - clearing auth and redirecting");
                Auth.clearAll();
                window.location.href = '/';
                throw new Error("Session expired. Please login again.");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Request failed: ${response.status}`, errorData);
                throw new Error(errorData.msg || `Request failed with status ${response.status}`);
            }

            return response;
        } catch (error) {
            console.error("API Error:", error);
            let errorMessage = "An error occurred";
            
            if (error.name === 'AbortError') {
                errorMessage = "Request timed out. Please try again.";
                console.error("Request timeout");
            } else if (error.name === 'TypeError') {
                errorMessage = "Network error. Please check your connection.";
                console.error("Network error");
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
    },

    loadInbox: async () => {
        console.log("Loading inbox messages...");
        try {
            const response = await API.fetch("/api/inbox");
            const data = await response.json();
            
            console.log(`Inbox loaded: ${data.messages?.length || 0} messages`);
            
            if (!data.success) {
                throw new Error(data.msg || "Failed to load inbox");
            }
            
            return data.messages || [];
        } catch (error) {
            console.error("Failed to load inbox:", error);
            throw error;
        }
    },

    loadSent: async () => {
        console.log("Loading sent messages...");
        try {
            const response = await API.fetch("/api/sent");
            const data = await response.json();
            
            console.log(`Sent messages loaded: ${data.messages?.length || 0} messages`);
            
            if (!data.success) {
                throw new Error(data.msg || "Failed to load sent messages");
            }
            
            return data.messages || [];
        } catch (error) {
            console.error("Failed to load sent messages:", error);
            throw error;
        }
    },

    sendMessage: async (formData) => {
        console.log("Sending message via FormData");
        const token = Auth.getToken();
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/send`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData  // Send FormData directly
            });
            
            const data = await response.json();
            console.log("Message sent:", data.success ? "SUCCESS" : "FAILED", data.msg);
            
            if (!data.success) {
                throw new Error(data.msg || "Failed to send message");
            }
            
            return data;
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    },

    getEncryptionStatus: async () => {
        console.log("Getting encryption status...");
        try {
            const response = await API.fetch("/api/encryption-status");
            const data = await response.json();
            
            console.log("Encryption status:", data);
            
            if (!data.success) {
                throw new Error(data.msg || "Failed to get encryption status");
            }
            
            return data;
        } catch (error) {
            console.error("Failed to get encryption status:", error);
            return { encryption_available: false, default_encrypt: false };
        }
    },

    checkEmail: async (email) => {
        console.log("Checking email existence:", email);
        try {
            const response = await API.fetch("/api/check-email", {
                method: "POST",
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            console.log(`Email ${email} exists: ${data.exists}`);
            return data.exists === true;
        } catch (error) {
            console.error("Failed to check email:", error);
            return null;
        }
    }
};

/**
 * UI Components and Helpers
 */
const UI = {
    elements: {
        userEmail: document.getElementById("userEmail"),
        btnLogout: document.getElementById("btnLogout"),
        btnCompose: document.getElementById("btnCompose"),
        btnInbox: document.getElementById("btnInbox"),
        btnSent: document.getElementById("btnSent"),
        messageList: document.getElementById("messageList"),
        sentList: document.getElementById("sentList"),
        sendBtn: document.getElementById("sendBtn"),
        emailInput: document.getElementById("to"),
        subjectInput: document.getElementById("subject"),
        bodyInput: document.getElementById("body"),
        encryptToggle: document.getElementById("encryptToggle"),
        encryptionStatus: document.getElementById("encryptionStatus"),
        refreshInbox: document.getElementById("refreshInbox"),
        refreshSent: document.getElementById("refreshSent"),
        notification: document.getElementById("notification"),
        emailValidationMsg: document.getElementById("emailValidationMsg"),
        attachmentInput: document.getElementById("attachment")
    },

    showNotification: (message, isError = false) => {
        console.log(`Notification: ${isError ? 'ERROR' : 'INFO'} - ${message}`);
        const { notification } = UI.elements;
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${isError ? "error" : ""} show`;
        
        setTimeout(() => {
            notification.classList.remove("show");
        }, CONFIG.NOTIFICATION_DURATION);
    },

    renderMessages: (messages, container) => {
        console.log(`Rendering ${messages.length} messages`);
        if (!container) return;
        
        container.innerHTML = messages.length ? 
            messages.map(msg => `
                <div class="message-item ${msg.is_encrypted ? 'encrypted-message' : ''}" data-id="${msg.id}">
                    <div class="message-header">
                        <span class="from">
                            <i class="fas fa-user"></i> 
                            From: ${msg.sender_email || 'Unknown sender'}
                        </span>
                        <span class="to">
                            <i class="fas fa-arrow-right"></i> 
                           To: ${msg.recipient_email || 'Unknown recipient'}
                        </span>
                        <span class="date">${new Date(msg.timestamp).toLocaleString()}</span>
                        ${msg.is_encrypted ? '<span class="encryption-badge"><i class="fas fa-lock"></i> Encrypted</span>' : ''}
                    </div>
                </div>
            `).join('') :
            '<div class="no-messages">No messages found</div>';
    },

    showLoading: (container, message = "Loading...") => {
        console.log(`Loading: ${message}`);
        if (container) {
            container.innerHTML = `
                <div class="loading-msg">
                    <i class="fas fa-spinner fa-spin"></i> ${message}
                </div>
            `;
        }
    },

    showError: (container, message = "An error occurred") => {
        console.error(`Error display: ${message}`);
        if (container) {
            container.innerHTML = `
                <div class="error-msg">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
            `;
        }
    },

    validateEmail: (email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        console.log(`Email validation: ${email} -> ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
    },

    showEmailValidation: (message, isError = false) => {
        console.log(`Email validation message: ${message} (${isError ? 'error' : 'success'})`);
        const { emailValidationMsg } = UI.elements;
        if (!emailValidationMsg) return;
        
        emailValidationMsg.textContent = message;
        emailValidationMsg.className = `validation-msg ${isError ? 'error' : 'success'}`;
        emailValidationMsg.style.display = message ? 'block' : 'none';
    },

    clearForm: () => {
        console.log("Clearing compose form");
        const { emailInput, subjectInput, bodyInput, encryptToggle } = UI.elements;
        if (emailInput) emailInput.value = '';
        if (subjectInput) subjectInput.value = '';
        if (bodyInput) bodyInput.value = '';
        if (encryptToggle) encryptToggle.checked = true;
        UI.showEmailValidation('');
        UI.updateEncryptionStatus();
    },

    updateEncryptionStatus: () => {
        const { encryptToggle, encryptionStatus } = UI.elements;
        if (!encryptionStatus) return;
        
        const isEncrypted = encryptToggle?.checked ?? true;
        encryptionStatus.innerHTML = isEncrypted ? 
            '<i class="fas fa-lock"></i> Message will be encrypted' :
            '<i class="fas fa-unlock"></i> Message will be sent as plain text';
        encryptionStatus.className = `encryption-status ${isEncrypted ? 'encrypted' : 'plain'}`;
        console.log(`Encryption status updated: ${isEncrypted ? 'ENCRYPTED' : 'PLAIN'}`);
    },

    setupEncryptionToggle: () => {
        const { encryptToggle } = UI.elements;
        
        if (encryptToggle) {
            encryptToggle.addEventListener('change', () => {
                UI.updateEncryptionStatus();
                const isEncrypted = encryptToggle.checked;
                UI.showNotification(
                    isEncrypted ? "Encryption enabled" : "Encryption disabled", 
                    !isEncrypted
                );
            });
        }
    }
};

// ==================== EVENT HANDLERS ====================

const EventHandlers = {
    setupNavigation: () => {
        console.log("Setting up navigation handlers");
        const { btnLogout, btnInbox, btnCompose, btnSent } = UI.elements;
        
        btnLogout?.addEventListener("click", () => {
            console.log("Logout clicked");
            Auth.clearAll();
            window.location.href = "/";
        });

        btnInbox?.addEventListener("click", () => {
            console.log("Navigating to inbox");
            window.location.href = "/inbox";
        });

        btnCompose?.addEventListener("click", () => {
            console.log("Navigating to compose");
            window.location.href = "/compose";
        });

        btnSent?.addEventListener("click", () => {
            console.log("Navigating to sent");
            window.location.href = "/sent";
        });
    },

    setupRefresh: () => {
        console.log("Setting up refresh handlers");
        const { refreshInbox, refreshSent } = UI.elements;
        
        refreshInbox?.addEventListener("click", async () => {
            console.log("Refresh inbox clicked");
            UI.showNotification("Refreshing inbox...");
            await loadAndRenderInbox();
        });

        refreshSent?.addEventListener("click", async () => {
            console.log("Refresh sent clicked");
            UI.showNotification("Refreshing sent messages...");
            await loadAndRenderSent();
        });
    },

    setupCompose: () => {
        console.log("Setting up compose handlers");
        const { sendBtn, emailInput, subjectInput, bodyInput } = UI.elements;
        
        UI.setupEncryptionToggle();

        let emailCheckTimeout = null;
        emailInput?.addEventListener("input", () => {
            const email = emailInput.value.trim();

            if (!email) {
                UI.showEmailValidation('');
                return;
            }

            if (!UI.validateEmail(email)) {
                UI.showEmailValidation("Invalid email format", true);
                return;
            }

            clearTimeout(emailCheckTimeout);
            UI.showEmailValidation("Checking...", false);
            emailCheckTimeout = setTimeout(async () => {
                const exists = await API.checkEmail(email);
                if (exists === null) {
                    UI.showEmailValidation("Could not verify email", true);
                } else if (exists) {
                    UI.showEmailValidation("Recipient found", false);
                } else {
                    UI.showEmailValidation("No user found with this email", true);
                }
            }, 600);
        });

        sendBtn?.addEventListener("click", async () => {
            console.log("Send button clicked");
            await handleSendMessage();
        });

        [emailInput, subjectInput].forEach(element => {
            element?.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    if (element === emailInput && subjectInput) {
                        subjectInput.focus();
                    } else if (element === subjectInput && bodyInput) {
                        bodyInput.focus();
                    }
                }
            });
        });

        bodyInput?.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
};

// ==================== APPLICATION LOGIC ====================

async function loadAndRenderInbox() {
    console.log("loadAndRenderInbox started");
    const { messageList } = UI.elements;
    
    try {
        UI.showLoading(messageList, "Loading inbox...");
        const messages = await API.loadInbox();
        UI.renderMessages(messages, messageList);
        
        if (messages.length === 0) {
            UI.showNotification("No messages in inbox");
        } else {
            const encryptedCount = messages.filter(msg => msg.is_encrypted).length;
            UI.showNotification(`Loaded ${messages.length} messages (${encryptedCount} encrypted)`);
        }
    } catch (error) {
        console.error("Failed to load inbox:", error);
        UI.showError(messageList, error.message);
        UI.showNotification(error.message || "Error loading inbox", true);
    }
}

async function loadAndRenderSent() {
    console.log("loadAndRenderSent started");
    const { sentList } = UI.elements;
    
    try {
        UI.showLoading(sentList, "Loading sent messages...");
        const messages = await API.loadSent();
        UI.renderMessages(messages, sentList);
        
        if (messages.length === 0) {
            UI.showNotification("No sent messages");
        } else {
            const encryptedCount = messages.filter(msg => msg.is_encrypted).length;
            UI.showNotification(`Loaded ${messages.length} messages (${encryptedCount} encrypted)`);
        }
    } catch (error) {
        console.error("Failed to load sent messages:", error);
        UI.showError(sentList, error.message);
        UI.showNotification(error.message || "Error loading sent messages", true);
    }
}

async function handleSendMessage() {
    console.log("handleSendMessage started");
    const { emailInput, subjectInput, bodyInput, encryptToggle, sendBtn, attachmentInput } = UI.elements;
    const recipient = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const body = bodyInput.value.trim();
    const shouldEncrypt = encryptToggle?.checked ?? true;

    console.log(`Message details - To: ${recipient}, Subject: ${subject}, Encrypted: ${shouldEncrypt}`);

    if (!recipient || !UI.validateEmail(recipient)) {
        UI.showNotification("Please enter a valid recipient email", true);
        return;
    }

    const validationMsg = UI.elements.emailValidationMsg;
    if (validationMsg && validationMsg.classList && validationMsg.classList.contains('error')) {
        UI.showNotification("Recipient email not found in the system", true);
        return;
    }

    if (!subject || !body) {
        UI.showNotification("Subject and body are required", true);
        return;
    }

    try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const formData = new FormData();
        formData.append('recipient_email', recipient);
        formData.append('subject', subject);
        formData.append('body', body);
        formData.append('encrypt_message', shouldEncrypt);

        if (attachmentInput && attachmentInput.files.length > 0) {
            console.log(`Attaching ${attachmentInput.files.length} file(s)`);
            for (let i = 0; i < attachmentInput.files.length; i++) {
                formData.append('attachments', attachmentInput.files[i]);
            }
        }

        const result = await API.sendMessage(formData);

        if (!result.success) throw new Error(result.msg);

        UI.showNotification("Message sent successfully!");
        UI.clearForm();
        const fileNamesDisplay = document.getElementById("fileNames");
        if (fileNamesDisplay) fileNamesDisplay.textContent = "";
        
        setTimeout(() => window.location.href = "/sent", 1500);
    } catch (err) {
        console.error("Send message error:", err);
        UI.showNotification(err.message || "Failed to send message", true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}

const { attachmentInput } = UI.elements;
const fileNamesDisplay = document.getElementById("fileNames");

attachmentInput?.addEventListener("change", () => {
    if (!fileNamesDisplay) return;
    const files = Array.from(attachmentInput.files).map(file => file.name);
    console.log(`Files selected: ${files.length} - ${files.join(', ')}`);
    fileNamesDisplay.textContent = files.length
        ? `Selected: ${files.join(', ')}`
        : "";
});

async function initializeEncryption() {
    console.log("Initializing encryption status");
    try {
        const encryptionStatus = await API.getEncryptionStatus();
        const { encryptToggle } = UI.elements;
        
        if (encryptToggle && encryptionStatus.encryption_available) {
            encryptToggle.checked = encryptionStatus.default_encrypt;
            UI.updateEncryptionStatus();
        }
    } catch (error) {
        console.warn("Could not initialize encryption status:", error);
    }
}

function initializeUserInfo() {
    console.log("Initializing user info");
    const { userEmail } = UI.elements;
    const email = Auth.getEmail();
    
    if (userEmail && email) {
        userEmail.innerHTML = `<i class="fas fa-user-circle"></i> ${email}`;
        console.log("User email displayed:", email);
    }
}

// ==================== INITIALIZATION ====================

async function initializeApp() {
    console.log("=== INITIALIZING APP ===");
    console.log("Current path:", window.location.pathname);
    
    if (!Auth.checkAuth()) return;
    
    initializeUserInfo();
    await initializeEncryption();
    
    EventHandlers.setupNavigation();
    EventHandlers.setupRefresh();
    EventHandlers.setupCompose();
    
    const currentPath = window.location.pathname;
    
    switch (currentPath) {
        case "/inbox":
            loadAndRenderInbox();
            break;
        case "/sent":
            loadAndRenderSent();
            break;
        case "/compose":
            const { emailInput } = UI.elements;
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
            break;
    }
}

document.addEventListener("DOMContentLoaded", initializeApp);
console.log("=== MESS.JS LOADING COMPLETE ===");
