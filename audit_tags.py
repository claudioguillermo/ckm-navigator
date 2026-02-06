import re
import sys

def check_balanced_tags(content, filename):
    print(f"Auditing {filename}...")
    
    # Simple regex for common tags
    tags = ['div', 'span', 'p', 'button', 'svg', 'path', 'circle', 'line', 'g', 'header', 'nav', 'section', 'main', 'aside', 'footer']
    
    # We are looking for strings like '<div>...</div>' inside JS/HTML
    # This is tricky because we have templates.
    # Let's just find all occurrences of <tag and </tag
    
    # For HTML, we can just count. For JS strings, it's more complex.
    # We'll focus on the template literals in JS.
    
    template_literals = re.findall(r'`([^`]*)`', content, re.DOTALL)
    
    errors = []
    
    for i, literal in enumerate(template_literals):
        # Count tags in this literal
        for tag in tags:
            opens = len(re.findall(f'<{tag}[>\s]', literal))
            closes = len(re.findall(f'</{tag}>', literal))
            
            # Especially for SVG tags which might be self-closing
            if tag in ['path', 'circle', 'line', 'image', 'rect', 'ellipse', 'polyline', 'polygon']:
                # Count self-closing: <path ... />
                self_closes = len(re.findall(f'<{tag}[^>]*/>', literal))
                if opens != (closes + self_closes):
                    errors.append(f"Literal {i}: Tag <{tag}> is unbalanced: {opens} opens, {closes} closes, {self_closes} self-closes")
            else:
                if opens != closes:
                    errors.append(f"Literal {i}: Tag <{tag}> is unbalanced: {opens} opens, {closes} closes")
                    
    if errors:
        print(f"Found {len(errors)} potential tag imbalances in {filename}:")
        for err in errors[:10]: # Limit output
            print(f"  - {err}")
    else:
        print(f"No obvious tag imbalances found in template literals of {filename}.")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        with open(arg, 'r') as f:
            check_balanced_tags(f.read(), arg)
