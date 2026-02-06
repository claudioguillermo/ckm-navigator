import re
import sys

def check_balanced_tags(content, filename):
    print(f"Auditing {filename}...")
    
    tags = ['div', 'span', 'p', 'button', 'svg', 'path', 'circle', 'line', 'g', 'header', 'nav', 'section', 'main', 'aside', 'footer', 'strong', 'i', 'li', 'ul', 'h1', 'h2', 'h3', 'h4']
    
    # We'll split by ` to find literals
    parts = content.split('`')
    template_literals = parts[1::2] # Every second part is between backticks
    
    current_pos = 0
    for i, literal in enumerate(template_literals):
        lit_errors = []
        for tag in tags:
            opens = len(re.findall(f'<{tag}[>\s]', literal))
            closes = len(re.findall(f'</{tag}>', literal))
            
            if tag in ['path', 'circle', 'line', 'image', 'rect', 'ellipse', 'polyline', 'polygon']:
                self_closes = len(re.findall(f'<{tag}[^>]*/>', literal))
                if opens != (closes + self_closes):
                    lit_errors.append(f"<{tag}>: {opens} opens, {closes} closes, {self_closes} self-closes")
            else:
                if opens != closes:
                    lit_errors.append(f"<{tag}>: {opens} opens, {closes} closes")
        
        if lit_errors:
            # Find the position of this literal to estimate line number
            current_pos = content.find(literal, current_pos)
            line_no = content.count('\n', 0, current_pos) + 1
            print(f"--- Literal {i} (Around line {line_no}) ---")
            print(f"Errors: {', '.join(lit_errors)}")
            clean_lit = literal.strip()
            if len(clean_lit) > 200:
                print(f"Content: {clean_lit[:150]}...{clean_lit[-150:]}")
            else:
                print(f"Content: {clean_lit}")
            print("\n")
            current_pos += len(literal)

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        with open(arg, 'r') as f:
            check_balanced_tags(f.read(), arg)
