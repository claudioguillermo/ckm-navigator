
import re

file_path = '/Users/tomscy2000/.gemini/antigravity/scratch/ckm-navigator/main.js'

with open(file_path, 'r') as f:
    content = f.read()

# Fix 1: < space tag
# < div -> <div
content = re.sub(r'< ([a-z])', r'<\1', content)

# Fix 2: </ space tag
# </ div -> </div
content = re.sub(r'</ ([a-z])', r'</\1', content)

# Fix 3: < tag space > (This is actually valid HTML usually, but let's check < strong >)
# < strong > -> <strong>. The space after strong is fine if attrs follow.
# But < strong > implies no attrs.
# Let's fix < strong > specifically? Or < [a-z]+ >?
# But < div > is valid.

# Fix 4: < h2 > -> <h2> (Space after < was fixed by #1, so <h2 >).
# <h2 > is valid.

# Fix 5: Attributes with massive spaces? style = "..."
# Valid HTML.

# Fix 6: </ div > -> </div>.
# Fixed by #2 to </div >. 
# </div > is valid HTML.

# So mostly just the leading spaces.

with open(file_path, 'w') as f:
    f.write(content)

print("Applied HTML tag fixes.")
