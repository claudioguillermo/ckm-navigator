#!/usr/bin/env python3
"""
Security Fix Verification Script
Validates that all security patches have been properly applied
"""

import os
import re
import json
from pathlib import Path

class SecurityValidator:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def log_pass(self, check, details=""):
        self.passed.append({"check": check, "details": details})
        print(f"✅ PASS: {check}")
        if details:
            print(f"   → {details}")

    def log_fail(self, check, details=""):
        self.failed.append({"check": check, "details": details})
        print(f"❌ FAIL: {check}")
        if details:
            print(f"   → {details}")

    def log_warning(self, check, details=""):
        self.warnings.append({"check": check, "details": details})
        print(f"⚠️  WARN: {check}")
        if details:
            print(f"   → {details}")

def check_file_exists(validator, filepath, description):
    """Check if a required file exists"""
    print(f"\n📄 Checking: {description}")
    if os.path.exists(filepath):
        validator.log_pass(f"{description} exists", filepath)
        return True
    else:
        validator.log_fail(f"{description} missing", filepath)
        return False

def check_main_js_patches(validator):
    """Verify main.js has all security patches"""
    print("\n🔒 Validating main.js Security Patches")
    print("-" * 50)

    if not os.path.exists('main.js'):
        validator.log_fail("main.js not found")
        return

    with open('main.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check 1: No onclick attributes
    onclick_matches = re.findall(r'onclick="', content)
    if len(onclick_matches) == 0:
        validator.log_pass("No inline onclick attributes")
    else:
        validator.log_fail(f"Found {len(onclick_matches)} onclick attributes")
        for match in onclick_matches[:3]:
            print(f"      Found: {match[:50]}...")

    # Check 2: No unsafe innerHTML
    unsafe_innerHTML = []
    for match in re.finditer(r'(\w+)\.innerHTML\s*=\s*', content):
        # Exclude DOMUtils calls
        context = content[max(0, match.start()-100):match.end()+50]
        if 'DOMUtils' not in context:
            unsafe_innerHTML.append(match.group(0))

    if len(unsafe_innerHTML) == 0:
        validator.log_pass("No unsafe innerHTML assignments")
    else:
        validator.log_fail(f"Found {len(unsafe_innerHTML)} unsafe innerHTML assignments")

    # Check 3: DOMUtils usage
    domutils_count = content.count('DOMUtils.safeSetHTML')
    if domutils_count > 0:
        validator.log_pass(f"DOMUtils.safeSetHTML used {domutils_count} times")
    else:
        validator.log_warning("DOMUtils.safeSetHTML not found - may not be needed")

    # Check 4: secureStorage initialization
    if 'secureStorage: null' in content:
        validator.log_pass("secureStorage property initialized")
    else:
        validator.log_fail("secureStorage property not initialized")

    # Check 5: async init method
    if 'async init()' in content:
        validator.log_pass("async init() method exists")
    else:
        validator.log_fail("async init() method missing")

    # Check 6: Race condition protection
    if 'activeLanguageRequest' in content:
        validator.log_pass("Race condition protection implemented")
    else:
        validator.log_fail("Race condition protection missing")

    # Check 7: Event delegation
    if 'data-action' in content and 'addEventListener' in content:
        validator.log_pass("Event delegation system in place")
    else:
        validator.log_warning("Event delegation may not be complete")

    # Check 8: localStorage replaced with secureStorage
    localStorage_direct = len(re.findall(r'localStorage\.(set|get)Item\((?!.*secureStorage)', content))
    if localStorage_direct == 0:
        validator.log_pass("No direct localStorage usage found")
    else:
        validator.log_warning(f"Found {localStorage_direct} direct localStorage calls - verify if intentional")

def check_security_files(validator):
    """Check for required security files"""
    print("\n📦 Validating Security Infrastructure")
    print("-" * 50)

    required_files = [
        ('js/dom-utils.js', 'XSS Prevention Utilities'),
        ('js/secure-storage.js', 'Secure Storage Module'),
        ('server.js', 'Backend API Proxy'),
        ('package.json', 'Node.js Dependencies'),
        ('.env.example', 'Environment Config Template'),
        ('.gitignore', 'Git Security Rules')
    ]

    for filepath, description in required_files:
        check_file_exists(validator, filepath, description)

def check_html_security(validator):
    """Verify index.html security headers"""
    print("\n🌐 Validating HTML Security Headers")
    print("-" * 50)

    if not os.path.exists('index.html'):
        validator.log_fail("index.html not found")
        return

    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check CSP
    if 'Content-Security-Policy' in content:
        validator.log_pass("Content Security Policy header present")
    else:
        validator.log_fail("Content Security Policy header missing")

    # Check DOMPurify
    if 'dompurify' in content.lower():
        validator.log_pass("DOMPurify library included")
    else:
        validator.log_fail("DOMPurify library not included")

    # Check script loading order
    scripts_order = re.findall(r'<script[^>]*src="([^"]+)"', content)
    if scripts_order:
        # dom-utils and secure-storage should load before main.js
        try:
            dom_utils_idx = next(i for i, s in enumerate(scripts_order) if 'dom-utils' in s)
            secure_storage_idx = next(i for i, s in enumerate(scripts_order) if 'secure-storage' in s)
            main_idx = next(i for i, s in enumerate(scripts_order) if s.endswith('main.js'))

            if dom_utils_idx < main_idx and secure_storage_idx < main_idx:
                validator.log_pass("Security scripts load before main.js")
            else:
                validator.log_fail("Security scripts load AFTER main.js")
        except StopIteration:
            validator.log_warning("Could not verify script loading order")

def check_service_worker(validator):
    """Verify service worker security"""
    print("\n⚙️  Validating Service Worker")
    print("-" * 50)

    if not os.path.exists('sw.js'):
        validator.log_warning("Service worker not found (optional)")
        return

    with open('sw.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for skipWaiting in install event
    install_event = re.search(r'addEventListener\(["\']install["\'],.*?\}\)', content, re.DOTALL)
    if install_event:
        if 'skipWaiting()' in install_event.group(0):
            validator.log_fail("skipWaiting() found in install event - may cause issues")
        else:
            validator.log_pass("No skipWaiting() in install event")

    # Check for message handler
    if "addEventListener('message'" in content or 'addEventListener("message"' in content:
        validator.log_pass("Message handler for controlled updates exists")
    else:
        validator.log_warning("No message handler - manual updates may be difficult")

def check_search_engine_fixes(validator):
    """Verify search engine bug fixes"""
    print("\n🔍 Validating Search Engine Fixes")
    print("-" * 50)

    if not os.path.exists('js/search-engine.js'):
        validator.log_warning("search-engine.js not found")
        return

    with open('js/search-engine.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check BM25 division by zero fix
    if 'Math.max(0.01' in content and 'numerator' in content:
        validator.log_pass("BM25 division by zero protection implemented")
    else:
        validator.log_warning("BM25 fix may not be applied - check manually")

    # Check semantic search fix
    if re.search(r'if\s*\(\s*queryTerms\.size\s*>\s*0\s*&&\s*chunkTerms\.size\s*>\s*0', content):
        validator.log_pass("Semantic search division by zero protection implemented")
    else:
        validator.log_warning("Semantic search fix may not be applied - check manually")

def check_chatbot_security(validator):
    """Verify chatbot backend integration"""
    print("\n💬 Validating Chatbot Security")
    print("-" * 50)

    if not os.path.exists('js/chatbot.js'):
        validator.log_warning("chatbot.js not found")
        return

    with open('js/chatbot.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for exposed API key
    api_key_patterns = [
        r'sk-ant-api[0-9a-zA-Z-]+',
        r'x-api-key["\']:\s*["\'][^"\']+["\']',
        r'ANTHROPIC_API_KEY\s*=\s*["\'][^"\']+["\']'
    ]

    found_key = False
    for pattern in api_key_patterns:
        if re.search(pattern, content):
            found_key = True
            break

    if found_key:
        validator.log_fail("API key found in chatbot.js - CRITICAL SECURITY ISSUE")
    else:
        validator.log_pass("No API key found in chatbot.js")

    # Check for backend proxy
    if '/api/chat' in content or 'backendUrl' in content:
        validator.log_pass("Backend proxy integration present")
    else:
        validator.log_warning("Backend proxy may not be configured")

def generate_report(validator):
    """Generate final report"""
    print("\n" + "=" * 50)
    print("📊 SECURITY VALIDATION REPORT")
    print("=" * 50)
    print()

    total_checks = len(validator.passed) + len(validator.failed) + len(validator.warnings)

    print(f"✅ Passed:   {len(validator.passed)}/{total_checks}")
    print(f"❌ Failed:   {len(validator.failed)}/{total_checks}")
    print(f"⚠️  Warnings: {len(validator.warnings)}/{total_checks}")
    print()

    if validator.failed:
        print("❌ FAILED CHECKS:")
        for item in validator.failed:
            print(f"   • {item['check']}")
            if item['details']:
                print(f"     {item['details']}")
        print()

    if validator.warnings:
        print("⚠️  WARNINGS:")
        for item in validator.warnings:
            print(f"   • {item['check']}")
            if item['details']:
                print(f"     {item['details']}")
        print()

    # Overall status
    if len(validator.failed) == 0:
        print("🎉 ALL CRITICAL SECURITY CHECKS PASSED!")
        print()
        print("✅ Ready for testing phase")
        print("   Next steps:")
        print("   1. Run the application locally")
        print("   2. Test all features thoroughly")
        print("   3. Run security tests from TEST_SUITE.md")
        print("   4. Deploy backend server")
        return 0
    else:
        print("⚠️  SOME CHECKS FAILED - REVIEW REQUIRED")
        print()
        print("Please address the failed checks before deployment")
        return 1

def main():
    print("🔒 EMPOWER-CKM Security Validation")
    print("=" * 50)
    print()

    validator = SecurityValidator()

    # Run all checks
    check_security_files(validator)
    check_main_js_patches(validator)
    check_html_security(validator)
    check_service_worker(validator)
    check_search_engine_fixes(validator)
    check_chatbot_security(validator)

    # Generate report
    exit_code = generate_report(validator)

    # Save report
    report = {
        'timestamp': str(os.popen('date').read().strip()),
        'passed': validator.passed,
        'failed': validator.failed,
        'warnings': validator.warnings,
        'summary': {
            'total': len(validator.passed) + len(validator.failed) + len(validator.warnings),
            'passed': len(validator.passed),
            'failed': len(validator.failed),
            'warnings': len(validator.warnings)
        }
    }

    with open('security-validation-report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: security-validation-report.json")
    print()

    return exit_code

if __name__ == '__main__':
    exit(main())
