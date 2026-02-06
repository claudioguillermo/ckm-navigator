import re
import sys

def check_balanced_tags(content, filename):
    print(f"Auditing {filename}...")
    
    tags = ['div', 'span', 'p', 'button', 'svg', 'path', 'circle', 'line', 'g', 'header', 'nav', 'section', 'main', 'aside', 'footer', 'strong', 'i', 'li', 'ul', 'h1', 'h2', 'h3', 'h4']
    
    # Improved regex to find template literals
    # This handles escaped backticks poorly but is a start
    template_literals = re.findall(r'`([^`]*)`', content, re.DOTALL)
    
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
            print(f"--- Literal {i} (Around line {content.count('\\n', 0, content.find(literal)) + 1}) ---")
            print(f"Errors: {', '.join(lit_errors)}")
            # Print first 100 chars and last 100 chars
            clean_lit = literal.strip()
            if len(clean_lit) > 200:
                print(f"Content: {clean_lit[:150]}...{clean_lit[-150:]}")
            else:
                print(f"Content: {clean_lit}")
            print("\n")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        with open(arg, 'r') as f:
            check_balanced_tags(f.read(), arg)
