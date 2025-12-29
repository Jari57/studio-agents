
import re

def check_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    open_braces = 0
    for i, line in enumerate(lines):
        line = line.strip()
        # Remove comments
        line = re.sub(r'/\*.*?\*/', '', line)
        
        # Count braces
        open_braces += line.count('{')
        open_braces -= line.count('}')
        
        if open_braces < 0:
            print(f"Error: Extra closing brace at line {i+1}")
            return

        # Check for property outside block
        # Heuristic: line contains ':' and ends with ';' but open_braces is 0
        # Exclude @ rules
        if open_braces == 0 and ':' in line and line.endswith(';') and not line.startswith('@'):
            # Check if it's a selector with pseudo-class like input:checked
            if not re.match(r'^[^:{]+:[^:{]+$', line): # simple property check
                 # It might be a property
                 # But selectors can have colons (pseudo-classes)
                 # Properties usually have a space after colon, selectors usually don't (except :not())
                 if ': ' in line:
                     print(f"Suspicious property outside block at line {i+1}: {line}")

    if open_braces > 0:
        print(f"Error: Missing closing brace(s). Open count: {open_braces}")

check_css('frontend/src/App.css')
