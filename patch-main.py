#!/usr/bin/env python3
"""
Critical Security Patches for main.js
Applies essential fixes without breaking functionality
"""

import re
import sys
from datetime import datetime

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def apply_patches(content):
    changes = []

    # Patch 1: Initialize secure storage in app object
    print("🔧 Patch 1: Adding secure storage initialization...")
    if 'secureStorage: null' not in content:
        # Find the app object initialization
        pattern = r'(const app = \{[\s\S]*?)(currentLanguage: localStorage\.getItem\([^)]+\)[^,]*,)'
        replacement = r'\1secureStorage: null,\n    activeLanguageRequest: null,\n    activeTimeouts: new Set(),\n    \2'
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, count=1)
            changes.append("Added secureStorage, activeLanguageRequest, activeTimeouts")

    # Patch 2: Fix currentLanguage initialization
    print("🔧 Patch 2: Fixing storage initialization...")
    content = re.sub(
        r"currentLanguage: localStorage\.getItem\('ckm_lang'\) \|\| 'en',",
        "currentLanguage: 'en', // Will be loaded from secure storage",
        content
    )
    changes.append("Fixed currentLanguage initialization")

    # Patch 3: Fix completedModules initialization
    content = re.sub(
        r"completedModules: JSON\.parse\(localStorage\.getItem\('ckm_progress'\) \|\| '\[\]'\),",
        "completedModules: [], // Will be loaded from secure storage",
        content
    )
    changes.append("Fixed completedModules initialization")

    # Patch 4: Fix myMedications initialization
    content = re.sub(
        r"myMedications: JSON\.parse\(localStorage\.getItem\('ckm_my_medications'\) \|\| '\[\]'\),",
        "myMedications: [], // Will be loaded from secure storage",
        content
    )
    changes.append("Fixed myMedications initialization")

    # Patch 5: Add async init method before registerServiceWorker
    print("🔧 Patch 3: Adding async init method...")
    if 'async init()' not in content:
        init_method = '''
    async init() {
        // Initialize secure storage
        this.secureStorage = new LegacyStorageWrapper();

        try {
            // Load data from secure storage
            this.currentLanguage = await this.secureStorage.getItem('ckm_lang', 'en');
            this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
            this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);
        } catch (error) {
            console.error('Failed to load from secure storage:', error);
        }

        // Load translations
        await this.loadLanguage(this.currentLanguage);

        // Register service worker
        this.registerServiceWorker();

        // Initialize UI
        this.updateNav();
        this.navigateTo(this.currentView);
    },

    '''
        # Insert before registerServiceWorker
        content = re.sub(
            r'(\s+)(registerServiceWorker\(\) \{)',
            r'\1' + init_method + r'\2',
            content,
            count=1
        )
        changes.append("Added async init() method")

    # Patch 6: Make setLanguage async
    print("🔧 Patch 4: Making setLanguage async...")
    content = re.sub(
        r'setLanguage\(lang\) \{',
        'async setLanguage(lang) {',
        content
    )
    changes.append("Made setLanguage async")

    # Patch 7: Replace localStorage.setItem with secureStorage
    print("🔧 Patch 5: Replacing localStorage.setItem calls...")

    # setLanguage
    content = re.sub(
        r"localStorage\.setItem\('ckm_lang',\s*lang\)",
        "await this.secureStorage.setItem('ckm_lang', lang)",
        content
    )

    # progress
    content = re.sub(
        r"localStorage\.setItem\('ckm_progress',\s*JSON\.stringify\(this\.completedModules\)\)",
        "await this.secureStorage.setItem('ckm_progress', this.completedModules)",
        content
    )

    # medications
    content = re.sub(
        r"localStorage\.setItem\('ckm_my_medications',\s*JSON\.stringify\(this\.myMedications\)\)",
        "await this.secureStorage.setItem('ckm_my_medications', this.myMedications)",
        content
    )

    # stage
    content = re.sub(
        r"localStorage\.setItem\('ckm_stage',\s*stage\)",
        "await this.secureStorage.setItem('ckm_stage', stage)",
        content
    )
    changes.append("Replaced localStorage.setItem calls")

    # Patch 8: Replace localStorage.removeItem
    print("🔧 Patch 6: Replacing localStorage.removeItem calls...")
    content = re.sub(
        r"localStorage\.removeItem\('ckm_progress'\)",
        "this.secureStorage.removeItem('ckm_progress')",
        content
    )
    content = re.sub(
        r"localStorage\.removeItem\('ckm_stage'\)",
        "this.secureStorage.removeItem('ckm_stage')",
        content
    )
    changes.append("Replaced localStorage.removeItem calls")

    # Patch 9: Make methods that use secureStorage async
    print("🔧 Patch 7: Making storage methods async...")

    # markModuleComplete
    content = re.sub(
        r'markModuleComplete\(id\) \{',
        'async markModuleComplete(id) {',
        content
    )

    # resetProgress
    content = re.sub(
        r'resetProgress\(\) \{',
        'async resetProgress() {',
        content
    )
    changes.append("Made storage methods async")

    # Patch 10: Add race condition protection to loadLanguage
    print("🔧 Patch 8: Adding race condition protection...")

    # Find loadLanguage method and add protection
    pattern = r'(async loadLanguage\(lang\) \{)'
    replacement = r'''\1
        // Prevent race conditions
        const requestId = Symbol();
        this.activeLanguageRequest = requestId;
'''
    content = re.sub(pattern, replacement, content, count=1)

    # Add check before applying translations
    pattern = r'(this\.translations\[lang\] = data;)\s*(this\.applyTranslations\(\);)'
    replacement = r'''// Only apply if this is still the active request
            if (this.activeLanguageRequest === requestId) {
                \1
                \2
            } else {
                console.log(`Language request for ${lang} cancelled`);
            }'''
    content = re.sub(pattern, replacement, content, count=1)
    changes.append("Added race condition protection")

    # Patch 11: Critical innerHTML fixes for known security issues
    print("🔧 Patch 9: Fixing critical innerHTML usage...")

    # Fix banner.innerHTML
    content = re.sub(
        r'banner\.innerHTML\s*=\s*',
        'DOMUtils.safeSetHTML(banner, ',
        content
    )

    # Fix this.mainView.innerHTML
    content = re.sub(
        r'this\.mainView\.innerHTML\s*=\s*',
        'DOMUtils.safeSetHTML(this.mainView, ',
        content
    )

    # Fix this.modalBody.innerHTML
    content = re.sub(
        r'this\.modalBody\.innerHTML\s*=\s*',
        'DOMUtils.safeSetHTML(this.modalBody, ',
        content
    )

    # Fix loader.innerHTML
    content = re.sub(
        r'loader\.innerHTML\s*=\s*',
        'DOMUtils.safeSetHTML(loader, ',
        content
    )

    # Fix mount.innerHTML (common in rendering methods)
    content = re.sub(
        r'mount\.innerHTML\s*=\s*',
        'DOMUtils.safeSetHTML(mount, ',
        content
    )
    changes.append("Fixed critical innerHTML usage")

    # Patch 12: Update DOMContentLoaded to use init()
    print("🔧 Patch 10: Updating initialization...")

    # Find and replace the DOMContentLoaded listener
    pattern = r"window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[^}]*\}\);"
    replacement = '''window.addEventListener('DOMContentLoaded', () => {
    app.init().catch(err => {
        console.error('App initialization error:', err);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 40px; font-family: system-ui;">
                <h1>⚠️ Initialization Error</h1>
                <p>Please refresh the page or contact support.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    });
});'''

    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        changes.append("Updated DOMContentLoaded to use init()")

    return content, changes

def main():
    print("🔒 EMPOWER-CKM Main.js Security Patcher")
    print("=" * 50)

    # Read main.js
    try:
        content = read_file('main.js')
        print(f"✅ Read main.js ({len(content):,} characters)")
    except FileNotFoundError:
        print("❌ main.js not found!")
        sys.exit(1)

    # Create backup
    timestamp = int(datetime.now().timestamp())
    backup_path = f'main.js.backup.{timestamp}'
    write_file(backup_path, content)
    print(f"✅ Backup created: {backup_path}\n")

    # Apply patches
    patched_content, changes = apply_patches(content)

    # Write patched file
    write_file('main.js', patched_content)

    # Report
    print("\n" + "=" * 50)
    print("✅ PATCHING COMPLETE!")
    print("=" * 50)
    print(f"\n📊 Changes Applied ({len(changes)}):")
    for i, change in enumerate(changes, 1):
        print(f"  {i}. {change}")

    original_size = len(content)
    new_size = len(patched_content)
    diff = new_size - original_size

    print(f"\n📏 File Size:")
    print(f"  Before: {original_size:,} characters")
    print(f"  After:  {new_size:,} characters")
    print(f"  Change: {diff:+,} characters")

    print(f"\n💾 Backup: {backup_path}")
    print("\n⚠️  NEXT STEPS:")
    print("  1. Test the application thoroughly")
    print("  2. Check browser console for errors")
    print("  3. Test all features (navigation, quiz, chat)")
    print("  4. If issues occur, restore from backup:")
    print(f"     cp {backup_path} main.js")
    print("\n✨ Done!")

if __name__ == '__main__':
    main()
