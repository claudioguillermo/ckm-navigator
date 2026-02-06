/**
 * Secure localStorage with Data Integrity
 *
 * SECURITY FIX: Protects against data tampering with HMAC signatures
 */

class SecureStorage {
    constructor(secretKey) {
        this.secretKey = secretKey || this.generateSecretKey();
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Generate a secret key (stored in sessionStorage, regenerated each session)
     */
    generateSecretKey() {
        let key = sessionStorage.getItem('_ckm_session_key');
        if (!key) {
            key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            sessionStorage.setItem('_ckm_session_key', key);
        }
        return key;
    }

    /**
     * Safely store item with integrity check
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON.stringify'd)
     */
    async setItem(key, value) {
        try {
            const data = JSON.stringify(value);
            const signature = await this.sign(data);
            const payload = {
                data,
                signature,
                timestamp: Date.now(),
                version: '1.0'
            };

            localStorage.setItem(key, JSON.stringify(payload));
            return true;
        } catch (error) {
            console.error(`SecureStorage.setItem error for key "${key}":`, error);
            return false;
        }
    }

    /**
     * Safely retrieve item with integrity verification
     * @param {string} key - Storage key
     * @param {*} fallback - Fallback value if retrieval fails
     * @returns {*} Stored value or fallback
     */
    async getItem(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;

            let payload;
            try {
                payload = JSON.parse(raw);
            } catch (parseError) {
                // Handle legacy data stored as plain strings (pre-SecureStorage migration)
                // e.g., old language preferences stored as "en" instead of JSON object
                console.info(`Migrating legacy plain-string data for key "${key}"`);
                const legacyValue = raw;
                // Migrate to new secure format
                await this.setItem(key, legacyValue);
                return legacyValue;
            }

            // Validate structure - handle legacy non-object data
            if (!payload || typeof payload !== 'object' || !payload.version) {
                // This might be legacy JSON data (e.g., an array or simple value stored directly)
                console.info(`Migrating legacy JSON data for key "${key}"`);
                await this.setItem(key, payload);
                return payload;
            }

            const { data, signature, timestamp, version } = payload;

            // Check version
            if (version !== '1.0') {
                console.warn(`Unknown version ${version} for key "${key}"`);
                localStorage.removeItem(key);
                return fallback;
            }

            // Verify signature
            const isValid = await this.verify(data, signature);
            if (!isValid) {
                console.error(`Data integrity check failed for key "${key}". Data may have been tampered with.`);
                localStorage.removeItem(key);
                return fallback;
            }

            // Check age (optional: expire old data)
            const age = Date.now() - timestamp;
            const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
            if (age > MAX_AGE) {
                console.warn(`Data expired for key "${key}"`);
                localStorage.removeItem(key);
                return fallback;
            }

            return JSON.parse(data);

        } catch (error) {
            console.error(`SecureStorage.getItem error for key "${key}":`, error);
            localStorage.removeItem(key);
            return fallback;
        }
    }

    /**
     * Remove item
     * @param {string} key - Storage key
     */
    removeItem(key) {
        localStorage.removeItem(key);
    }

    /**
     * Clear all secure storage items
     */
    clear() {
        localStorage.clear();
    }

    /**
     * Sign data with HMAC-SHA256
     * @param {string} data - Data to sign
     * @returns {Array<number>} Signature bytes
     */
    async sign(data) {
        const keyData = this.encoder.encode(this.secretKey);
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            this.encoder.encode(data)
        );

        return Array.from(new Uint8Array(signature));
    }

    /**
     * Verify data signature
     * @param {string} data - Data to verify
     * @param {Array<number>} signature - Signature bytes
     * @returns {boolean} True if signature is valid
     */
    async verify(data, signature) {
        try {
            const keyData = this.encoder.encode(this.secretKey);
            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            );

            return await crypto.subtle.verify(
                'HMAC',
                key,
                new Uint8Array(signature),
                this.encoder.encode(data)
            );
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    /**
     * Encrypt sensitive data (for medical information)
     * @param {*} data - Data to encrypt
     * @param {string} password - Encryption password
     * @returns {Object} Encrypted payload
     */
    async encrypt(data, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Derive key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // Encrypt data
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            this.encoder.encode(JSON.stringify(data))
        );

        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            salt: Array.from(salt),
            iv: Array.from(iv)
        };
    }

    /**
     * Decrypt sensitive data
     * @param {Object} payload - Encrypted payload
     * @param {string} password - Decryption password
     * @returns {*} Decrypted data
     */
    async decrypt(payload, password) {
        const { encrypted, salt, iv } = payload;

        // Derive key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt data
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(encrypted)
        );

        return JSON.parse(this.decoder.decode(decrypted));
    }
}

/**
 * Backward-compatible wrapper for existing localStorage usage
 */
class LegacyStorageWrapper {
    constructor() {
        this.secureStorage = new SecureStorage();
        this.migrated = new Set();
    }

    /**
     * Safely parse JSON with fallback
     */
    safeJSONParse(str, fallback = null) {
        if (!str) return fallback;

        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('JSON parse error:', error);
            return fallback;
        }
    }

    /**
     * Get item (tries secure storage first, falls back to legacy)
     */
    async getItem(key, fallback = null) {
        // Try secure storage first
        const secureValue = await this.secureStorage.getItem(key, undefined);
        if (secureValue !== undefined && secureValue !== null) {
            return secureValue;
        }

        // Fallback to legacy localStorage
        const legacyValue = this.safeJSONParse(localStorage.getItem(key), fallback);

        // Migrate to secure storage
        if (legacyValue !== fallback && !this.migrated.has(key)) {
            await this.setItem(key, legacyValue);
            this.migrated.add(key);
        }

        return legacyValue;
    }

    /**
     * Set item (uses secure storage)
     */
    async setItem(key, value) {
        return this.secureStorage.setItem(key, value);
    }

    /**
     * Remove item
     */
    removeItem(key) {
        this.secureStorage.removeItem(key);
    }
}

// Make available globally
window.SecureStorage = SecureStorage;
window.LegacyStorageWrapper = LegacyStorageWrapper;
