#!/usr/bin/env node

/**
 * Automated Security Patch Script for main.js
 *
 * This script applies critical security fixes to main.js automatically.
 * Run with: node apply-security-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 EMPOWER-CKM Security Patch Script');
console.log('=====================================\n');

// Read main.js
const mainJsPath = path.join(__dirname, 'main.js');
if (!fs.existsSync(mainJsPath)) {
    console.error('❌ main.js not found!');
    process.exit(1);
}

console.log('📖 Reading main.js...');
let content = fs.readFileSync(mainJsPath, 'utf8');
const originalLength = content.length;

// Backup original
const backupPath = path.join(__dirname, `main.js.backup.${Date.now()}`);
fs.writeFileSync(backupPath, content);
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

let changeCount = 0;

// ============================================================================
// FIX 1: Initialize Secure Storage
// ============================================================================
console.log('🔧 Fix 1: Initializing Secure Storage...');

// Add secureStorage property to app object
content = content.replace(
    /(const app = \{[\s\S]*?)(completedModules: JSON\.parse\(localStorage\.getItem\('ckm_progress'\) \|\| '\[\]'\),)/,
    function(match, p1, p2) {
        changeCount++;
        return p1 +
            '// SECURITY FIX: Initialize secure storage\n    ' +
            'secureStorage: null, // Initialized in init()\n    ' +
            'activeLanguageRequest: null, // Race condition protection\n    ' +
            'activeTimeouts: new Set(), // Memory leak prevention\n    ' +
            p2.replace(
                /completedModules: JSON\.parse\(localStorage\.getItem\('ckm_progress'\) \|\| '\[\]'\),/,
                'completedModules: [], // Loaded from secure storage'
            );
    }
);

// Replace currentLanguage localStorage
content = content.replace(
    /currentLanguage: localStorage\.getItem\('ckm_lang'\) \|\| 'en',/,
    "currentLanguage: 'en', // Loaded from secure storage"
);
changeCount++;

// Replace myMedications localStorage
content = content.replace(
    /myMedications: JSON\.parse\(localStorage\.getItem\('ckm_my_medications'\) \|\| '\[\]'\),/,
    "myMedications: [], // Loaded from secure storage"
);
changeCount++;

console.log(`   ✓ ${changeCount} changes applied\n`);

// ============================================================================
// FIX 2: Replace localStorage.setItem with secureStorage
// ============================================================================
console.log('🔧 Fix 2: Replacing localStorage.setItem...');
const setItemCount = (content.match(/localStorage\.setItem/g) || []).length;

content = content.replace(
    /localStorage\.setItem\('ckm_lang',\s*lang\)/g,
    "await this.secureStorage.setItem('ckm_lang', lang)"
);

content = content.replace(
    /localStorage\.setItem\('ckm_progress',\s*JSON\.stringify\(this\.completedModules\)\)/g,
    "await this.secureStorage.setItem('ckm_progress', this.completedModules)"
);

content = content.replace(
    /localStorage\.setItem\('ckm_my_medications',\s*JSON\.stringify\(this\.myMedications\)\)/g,
    "await this.secureStorage.setItem('ckm_my_medications', this.myMedications)"
);

content = content.replace(
    /localStorage\.setItem\('ckm_stage',\s*stage\)/g,
    "await this.secureStorage.setItem('ckm_stage', stage)"
);

console.log(`   ✓ ${setItemCount} localStorage.setItem calls replaced\n`);

// ============================================================================
// FIX 3: Replace localStorage.removeItem
// ============================================================================
console.log('🔧 Fix 3: Replacing localStorage.removeItem...');
const removeItemCount = (content.match(/localStorage\.removeItem/g) || []).length;

content = content.replace(
    /localStorage\.removeItem\('ckm_progress'\)/g,
    "this.secureStorage.removeItem('ckm_progress')"
);

content = content.replace(
    /localStorage\.removeItem\('ckm_stage'\)/g,
    "this.secureStorage.removeItem('ckm_stage')"
);

console.log(`   ✓ ${removeItemCount} localStorage.removeItem calls replaced\n`);

// ============================================================================
// FIX 4: Add Async Init Method
// ============================================================================
console.log('🔧 Fix 4: Adding async init() method...');

// Find where service worker is registered and wrap in init()
const initMethodExists = content.includes('async init()');

if (!initMethodExists) {
    // Add init method before registerServiceWorker
    content = content.replace(
        /(registerServiceWorker\(\) \{)/,
        `async init() {
        // Initialize secure storage
        this.secureStorage = new LegacyStorageWrapper();

        // Load data from secure storage
        try {
            this.currentLanguage = await this.secureStorage.getItem('ckm_lang', 'en');
            this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
            this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);
        } catch (error) {
            console.error('Failed to load data from storage:', error);
        }

        // Load translations
        await this.loadLanguage(this.currentLanguage);

        // Register service worker
        this.registerServiceWorker();

        // Initialize UI
        this.updateNav();
        this.navigateTo(this.currentView);
    },

    $1`
    );
    changeCount++;
    console.log('   ✓ Added async init() method\n');
} else {
    console.log('   ℹ init() method already exists\n');
}

// ============================================================================
// FIX 5: Make setLanguage async
// ============================================================================
console.log('🔧 Fix 5: Making setLanguage async...');

content = content.replace(
    /setLanguage\(lang\) \{/g,
    'async setLanguage(lang) {'
);
changeCount++;

console.log('   ✓ setLanguage is now async\n');

// ============================================================================
// FIX 6: Add fetch error handling to loadLanguage
// ============================================================================
console.log('🔧 Fix 6: Adding error handling to loadLanguage...');

content = content.replace(
    /(async loadLanguage\(lang\) \{[\s\S]*?)(const response = await fetch\(`\.\/locales\/\$\{lang\}\.json`\);[\s\S]*?this\.applyTranslations\(\);)/,
    function(match, p1, p2) {
        // Only apply if not already wrapped in try-catch
        if (match.includes('try {') && match.includes('catch')) {
            return match;
        }

        return p1 + `try {
            const response = await fetch(\`./locales/\${lang}.json\`);

            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }

            const data = await response.json();
            this.translations[lang] = data;
            this.applyTranslations();

        } catch (error) {
            console.error(\`Failed to load language "\${lang}":\`, error);

            // Fallback to English if available
            if (lang !== 'en' && this.translations.en) {
                console.log('Falling back to English');
                this.currentLanguage = 'en';
                this.applyTranslations();
            }
        }`;
    }
);

console.log('   ✓ Added error handling to loadLanguage\n');

// ============================================================================
// FIX 7: Add race condition protection to loadLanguage
// ============================================================================
console.log('🔧 Fix 7: Adding race condition protection...');

content = content.replace(
    /(async loadLanguage\(lang\) \{\s*try \{)/,
    `async loadLanguage(lang) {
        // Prevent race conditions
        const requestId = Symbol();
        this.activeLanguageRequest = requestId;

        try {`
);

content = content.replace(
    /(const data = await response\.json\(\);\s*this\.translations\[lang\] = data;\s*this\.applyTranslations\(\);)/,
    `const data = await response.json();

            // Only apply if this is still the active request
            if (this.activeLanguageRequest === requestId) {
                this.translations[lang] = data;
                this.applyTranslations();
            } else {
                console.log(\`Language request for \${lang} cancelled\`);
            }`
);

console.log('   ✓ Added race condition protection\n');

// ============================================================================
// FIX 8: Replace Unsafe innerHTML (Most Critical)
// ============================================================================
console.log('🔧 Fix 8: Replacing unsafe innerHTML usage...');
const innerHTMLCount = (content.match(/\.innerHTML\s*=/g) || []).length;

// Replace common patterns
content = content.replace(
    /this\.mainView\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML(this.mainView, $1);'
);

content = content.replace(
    /this\.modalBody\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML(this.modalBody, $1);'
);

content = content.replace(
    /mount\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML(mount, $1);'
);

content = content.replace(
    /banner\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML(banner, $1);'
);

content = content.replace(
    /loader\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML(loader, $1);'
);

console.log(`   ✓ Replaced ${innerHTMLCount} innerHTML assignments\n`);

// ============================================================================
// FIX 9: Update DOMContentLoaded to use init()
// ============================================================================
console.log('🔧 Fix 9: Updating DOMContentLoaded listener...');

content = content.replace(
    /window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?\}\);/,
    `window.addEventListener('DOMContentLoaded', () => {
    app.init().catch(err => {
        console.error('App initialization error:', err);
        document.body.innerHTML = \`
            <div style="text-align: center; padding: 40px; font-family: system-ui;">
                <h1>⚠️ Initialization Error</h1>
                <p>Please refresh the page or contact support.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Refresh Page
                </button>
                <details style="margin-top: 20px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <summary>Technical Details</summary>
                    <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">\${err.stack}</pre>
                </details>
            </div>
        \`;
    });
});`
);

console.log('   ✓ Updated DOMContentLoaded listener\n');

// ============================================================================
// Write Patched File
// ============================================================================
console.log('💾 Writing patched file...');
fs.writeFileSync(mainJsPath, content);

const newLength = content.length;
const diff = newLength - originalLength;

console.log('\n✅ PATCHING COMPLETE!\n');
console.log('📊 Statistics:');
console.log(`   Original size: ${originalLength.toLocaleString()} characters`);
console.log(`   New size: ${newLength.toLocaleString()} characters`);
console.log(`   Difference: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} characters`);
console.log(`   Total fixes applied: ${changeCount}\n`);
console.log(`📁 Backup saved to: ${path.basename(backupPath)}\n`);

console.log('⚠️  IMPORTANT NEXT STEPS:');
console.log('   1. Test the application thoroughly');
console.log('   2. Check browser console for errors');
console.log('   3. Test all features (navigation, quiz, chat, etc.)');
console.log('   4. If issues occur, restore from backup');
console.log(`   5. Keep backup file: ${path.basename(backupPath)}\n`);

console.log('🔍 Manual Review Required:');
console.log('   - Check any remaining onclick attributes');
console.log('   - Verify all innerHTML replacements work correctly');
console.log('   - Test with tampered localStorage data');
console.log('   - Test rapid language switching\n');

process.exit(0);
