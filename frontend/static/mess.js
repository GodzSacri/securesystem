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

// ==================== ENCRYPTION MODULE ====================
const Encryption = {
    // Generate a random salt
    generateSalt: () => {
        return crypto.getRandomValues(new Uint8Array(16));
    },
    
    // Generate a random IV for AES-GCM
    generateIV: () => {
        return crypto.getRandomValues(new Uint8Array(12));
    },
    
    // Derive a proper AES key from a password/OTP using PBKDF2
    deriveKey: async (password, salt) => {
        console.log("Deriving AES key from password...");
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 }, // 256-bit AES key
            false,
            ["encrypt", "decrypt"]
        );
        
        console.log("AES key derived successfully");
        return key;
    },
    
    // Encrypt message with AES-GCM
    encryptMessage: async (plaintext, password) => {
        console.log("Encrypting message...");
        try {
            const salt = Encryption.generateSalt();
            const iv = Encryption.generateIV();
            const key = await Encryption.deriveKey(password, salt);
            
            const encodedMessage = new TextEncoder().encode(plaintext);
            const encrypted = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encodedMessage
            );
            
            // Convert to base64 for transmission
            const encryptedData = {
                ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
                iv: btoa(String.fromCharCode(...iv)),
                salt: btoa(String.fromCharCode(...salt))
            };
            
            console.log("Message encrypted successfully");
            return encryptedData;
        } catch (error) {
            console.error("Encryption failed:", error);
            throw new Error("Failed to encrypt message: " + error.message);
        }
    },
    
    // Decrypt message (for viewing)
    decryptMessage: async (encryptedData, password) => {
        console.log("Decrypting message...");
        try {
            const ciphertext = new Uint8Array(atob(encryptedData.ciphertext).split('').map(c => c.charCodeAt(0)));
            const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
            const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
            
            const key = await Encryption.deriveKey(password, salt);
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            
            const decryptedText = new TextDecoder().decode(decrypted);
            console.log("Message decrypted successfully");
            return decryptedText;
        } catch (error) {
            console.error("Decryption failed:", error);
            throw new Error("Failed to decrypt message: " + error.message);
        }
    },
    
    // Generate a random OTP for message viewing
    generateOTP: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};

/**
 * API Communication - FIXED for encrypted messages
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

    sendMessage: async (messageData) => {
        console.log("Sending encrypted message...");
        const token = Auth.getToken();
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/send`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(messageData)  // Send JSON with encrypted data
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
        attachmentInput: document.getElementById("attachment"),
        otpInput: document.getElementById("otpInput"),
        viewMessageBtn: document.getElementById("viewMessageBtn")
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
                <div class="message-item ${msg.is_encrypted ? 'encrypted-message' : ''}" data-id="${msg.id}" data-encrypted='${JSON.stringify(msg.encrypted_data)}'>
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
                        ${msg.is_encrypted ? '<span class="encryption-badge"><i class="fas fa-lock"></i> Encrypted - Requires OTP</span>' : ''}
                    </div>
                    ${msg.is_encrypted ? `
                        <div class="message-otp-section" style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                            <input type="text" id="otp-${msg.id}" placeholder="Enter OTP to view message" style="width: 200px; margin-right: 10px;">
                            <button onclick="window.viewEncryptedMessage('${msg.id}')">View Message</button>
                        </div>
                    ` : `
                        <div class="message-body" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 5px;">
                            ${msg.body || 'No content'}
                        </div>
                    `}
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
            '<i class="fas fa-lock"></i> Message will be encrypted with OTP' :
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
                    isEncrypted ? "Encryption enabled - OTP will be required to view" : "Encryption disabled", 
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

// Global function to view encrypted messages
window.viewEncryptedMessage = async (messageId) => {
    console.log("Viewing encrypted message:", messageId);
    const otpInput = document.getElementById(`otp-${messageId}`);
    const otp = otpInput?.value;
    
    if (!otp) {
        UI.showNotification("Please enter the OTP to view this message", true);
        return;
    }
    
    try {
        // Find the message element
        const messageElement = document.querySelector(`.message-item[data-id="${messageId}"]`);
        const encryptedData = JSON.parse(messageElement.getAttribute('data-encrypted') || '{}');
        
        if (!encryptedData.ciphertext) {
            UI.showNotification("No encrypted data found", true);
            return;
        }
        
        // Decrypt the message
        const decryptedBody = await Encryption.decryptMessage(encryptedData, otp);
        
        // Display the decrypted message
        const existingBody = messageElement.querySelector('.message-body');
        if (existingBody) {
            existingBody.innerHTML = decryptedBody;
        } else {
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'message-body';
            bodyDiv.style.marginTop = '10px';
            bodyDiv.style.padding = '10px';
            bodyDiv.style.background = '#e8f5e9';
            bodyDiv.style.borderRadius = '5px';
            bodyDiv.innerHTML = `<strong>Decrypted Message:</strong><br>${decryptedBody}`;
            messageElement.appendChild(bodyDiv);
        }
        
        // Remove OTP input section
        const otpSection = messageElement.querySelector('.message-otp-section');
        if (otpSection) otpSection.remove();
        
        UI.showNotification("Message decrypted successfully");
    } catch (error) {
        console.error("Failed to decrypt message:", error);
        UI.showNotification("Invalid OTP or corrupted message", true);
    }
};

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
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Encrypting & Sending...';

        let messageBody = body;
        let isEncrypted = false;
        let encryptedData = null;
        let otp = null;
        
        // Encrypt the message if requested
        if (shouldEncrypt) {
            // Generate a random OTP for this message
            otp = Encryption.generateOTP();
            console.log("Generated OTP for message:", otp);
            
            // Encrypt the message body with the OTP
            encryptedData = await Encryption.encryptMessage(body, otp);
            messageBody = "[ENCRYPTED MESSAGE - Requires OTP to view]";
            isEncrypted = true;
            
            // Show OTP to user (in production, this would be sent via email/SMS)
            UI.showNotification(`Message encrypted! Share this OTP with recipient: ${otp}`, false);
            console.log("OTP for recipient:", otp);
        }
        
        // Prepare message data for API
        const messageData = {
            recipient_email: recipient,
            subject: subject,
            body: messageBody,
            is_encrypted: isEncrypted,
            encrypt_message: shouldEncrypt
        };
        
        // Add encrypted data if applicable
        if (encryptedData) {
            messageData.encrypted_data = encryptedData;
            messageData.encryption_otp = otp; // In production, send this via secure channel
        }
        
        // Handle attachments if any
        if (attachmentInput && attachmentInput.files.length > 0) {
            // For simplicity, we'll note that attachments exist
            // In production, you'd encrypt attachments too
            messageData.has_attachments = true;
            messageData.attachment_count = attachmentInput.files.length;
        }

        const result = await API.sendMessage(messageData);

        if (!result.success) throw new Error(result.msg);

        UI.showNotification(isEncrypted ? "Encrypted message sent successfully! OTP shared above." : "Message sent successfully!");
        UI.clearForm();
        
        // Clear file input
        if (attachmentInput) attachmentInput.value = '';
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
