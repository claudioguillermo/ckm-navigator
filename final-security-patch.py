#!/usr/bin/env python3
"""
Final Security Patch for main.js
Fixes remaining innerHTML and onclick vulnerabilities
"""

import re
import sys
from datetime import datetime

def read_file(filepath):
    """Read the main.js file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        sys.exit(1)

def write_file(filepath, content):
    """Write the patched main.js file"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"❌ Error writing {filepath}: {e}")
        sys.exit(1)

def backup_file(filepath):
    """Create a backup of the file"""
    timestamp = int(datetime.now().timestamp())
    backup_path = f"{filepath}.backup.{timestamp}"
    try:
        content = read_file(filepath)
        write_file(backup_path, content)
        print(f"✅ Backup created: {backup_path}\n")
        return backup_path
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        sys.exit(1)

def fix_inline_onclick_in_buttons(content):
    """Fix onclick attributes in button elements"""
    print("🔧 Fixing inline onclick in buttons...")

    # Pattern 1: Close buttons with innerHTML=''
    pattern1 = r'<button([^>]*?)onclick="document\.getElementById\(\'med-category-detail-mount\'\)\.innerHTML=\'\'"([^>]*?)>'
    replacement1 = r'<button\1data-action="clear-mount" data-target="med-category-detail-mount"\2>'
    content = re.sub(pattern1, replacement1, content)

    # Pattern 2: Generic onclick handlers
    pattern2 = r'<button([^>]*?)onclick="([^"]*)"([^>]*?)>'

    def replace_onclick(match):
        before = match.group(1)
        onclick_code = match.group(2)
        after = match.group(3)

        # Extract function call
        func_match = re.match(r'(\w+(?:\.\w+)*)\((.*?)\)', onclick_code)
        if func_match:
            func_name = func_match.group(1)
            args = func_match.group(2)
            return f'<button{before}data-action="{func_name}" data-args="{args}"{after}>'
        else:
            # Fallback - just mark for manual review
            return f'<button{before}data-onclick-legacy="{onclick_code}"{after}>'

    content = re.sub(pattern2, replace_onclick, content)

    print("   ✓ Fixed inline onclick handlers\n")
    return content

def fix_remaining_innerhtml(content):
    """Fix remaining innerHTML assignments"""
    print("🔧 Fixing remaining innerHTML assignments...")

    # Fix modal.innerHTML
    pattern1 = r'modal\.innerHTML\s*=\s*`([^`]*)`'
    replacement1 = r'DOMUtils.safeSetHTML(modal, `\1`)'
    content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

    # Fix tooltip.innerHTML
    pattern2 = r'tooltip\.innerHTML\s*=\s*`([^`]*)`'
    replacement2 = r'DOMUtils.safeSetHTML(tooltip, `\1`)'
    content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

    # Fix generic element.innerHTML = patterns
    pattern3 = r'(\w+)\.innerHTML\s*=\s*`([^`]*)`'
    replacement3 = r'DOMUtils.safeSetHTML(\1, `\2`)'
    content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)

    print("   ✓ Fixed innerHTML assignments\n")
    return content

def add_event_delegation_handler(content):
    """Add event delegation handler for data-action buttons"""
    print("🔧 Adding event delegation handler...")

    # Find the init() method and add event delegation
    init_pattern = r'(async init\(\) \{[^}]*?)(this\.registerServiceWorker\(\);)'

    event_handler = '''
        // Event delegation for security (replaces inline onclick)
        document.body.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const target = button.dataset.target;
            const args = button.dataset.args;

            // Handle clear-mount action
            if (action === 'clear-mount' && target) {
                const element = document.getElementById(target);
                if (element) element.innerHTML = '';
                return;
            }

            // Handle app method calls
            if (action && this[action]) {
                try {
                    if (args) {
                        // Parse arguments if present
                        const parsedArgs = args.split(',').map(arg => {
                            arg = arg.trim();
                            // Try to parse as JSON, otherwise treat as string
                            try {
                                return JSON.parse(arg);
                            } catch {
                                return arg.replace(/^['"]|['"]$/g, '');
                            }
                        });
                        this[action](...parsedArgs);
                    } else {
                        this[action]();
                    }
                } catch (error) {
                    console.error(`Error executing action "${action}":`, error);
                }
            }
        });

        '''

    def add_handler(match):
        return match.group(1) + event_handler + match.group(2)

    if 'Event delegation for security' not in content:
        content = re.sub(init_pattern, add_handler, content)
        print("   ✓ Added event delegation handler\n")
    else:
        print("   ℹ Event delegation already exists\n")

    return content

def fix_onclick_in_html_strings(content):
    """Fix onclick attributes in HTML template strings"""
    print("🔧 Fixing onclick in HTML template strings...")

    # This is more complex - we need to find HTML strings and fix onclick within them
    # Pattern: onclick="app.method(...)"
    pattern = r'onclick="app\.(\w+)\(([^)]*)\)"'
    replacement = r'data-action="\1" data-args="\2"'
    content = re.sub(pattern, replacement, content)

    # Pattern: onclick="this.method(...)"
    pattern2 = r'onclick="this\.(\w+)\(([^)]*)\)"'
    replacement2 = r'data-action="\1" data-args="\2"'
    content = re.sub(pattern2, replacement2, content)

    print("   ✓ Fixed onclick in HTML strings\n")
    return content

def main():
    print("🔒 Final Security Patch for EMPOWER-CKM Navigator")
    print("=" * 50)
    print()

    filepath = 'main.js'

    # Create backup
    backup_path = backup_file(filepath)

    # Read file
    print("📖 Reading main.js...")
    content = read_file(filepath)
    original_size = len(content)
    print(f"   File size: {original_size:,} characters\n")

    # Apply fixes
    content = fix_remaining_innerhtml(content)
    content = fix_onclick_in_html_strings(content)
    content = fix_inline_onclick_in_buttons(content)
    content = add_event_delegation_handler(content)

    # Write patched file
    print("💾 Writing patched file...")
    write_file(filepath, content)
    new_size = len(content)
    print(f"   New size: {new_size:,} characters")
    print(f"   Difference: {new_size - original_size:+,} characters\n")

    # Verify fixes
    print("🔍 Verification:")
    onclick_count = len(re.findall(r'onclick="', content))
    innerhtml_count = len(re.findall(r'\.innerHTML\s*=\s*[^D]', content))
    print(f"   Remaining onclick attributes: {onclick_count}")
    print(f"   Remaining unsafe innerHTML: {innerhtml_count}\n")

    if onclick_count > 0:
        print("⚠️  Warning: Some onclick attributes may need manual review")
        # Show first few
        matches = re.finditer(r'onclick="([^"]{0,50})', content)
        for i, match in enumerate(matches):
            if i >= 3:
                break
            print(f"      - {match.group(1)}...")
        print()

    print("✅ Patching complete!")
    print(f"📁 Backup: {backup_path}")
    print()
    print("⚠️  Next Steps:")
    print("   1. Test the application thoroughly")
    print("   2. Check browser console for errors")
    print("   3. Verify buttons and interactions work")
    print("   4. Run security tests from TEST_SUITE.md")
    print()

if __name__ == '__main__':
    main()
