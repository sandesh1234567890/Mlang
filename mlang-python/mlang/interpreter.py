import re

def transpile_line(line):
    # 1. Extract strings to protect them from keyword replacement
    strings = []
    def repl(match):
        strings.append(match.group(0))
        return f"__MLANG_STR_{len(strings)-1}__"
    
    # Match double or single quoted strings
    protected = re.sub(r'("[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\')', repl, line)
    
    # 2. Check for chalu / bass
    stripped = protected.strip()
    if stripped in ('chalu', 'bass'):
        return ""
    
    # 3. Replace keywords with word boundaries
    replacements = {
        'jar': 'if',
        'nahitar': 'else',
        'jovar': 'while',
        'fir': 'for',
        'kaam': 'def',
        'paratDe': 'return',
        'ho': 'True',
        'nahi': 'False',
        'bol': 'print',
        'vichar': 'input',
    }
    
    for mlang_kw, py_kw in replacements.items():
        protected = re.sub(r'\b' + mlang_kw + r'\b', py_kw, protected)
        
    # 4. Add colons to control flow statements if missing
    stripped_replaced = protected.strip()
    needs_colon = False
    if any(stripped_replaced.startswith(kw + ' ') or stripped_replaced == kw for kw in ('if', 'else', 'while', 'for', 'def')):
        needs_colon = True
        
    if needs_colon and not stripped_replaced.endswith(':'):
        if '#' in protected:
            parts = protected.split('#', 1)
            protected = parts[0].rstrip() + ':' + ' #' + parts[1]
        else:
            protected = protected.rstrip() + ':'
            
    # 5. Restore strings
    for i, s in enumerate(strings):
        protected = protected.replace(f"__MLANG_STR_{i}__", s)
        
    return protected

def transpile(source_code):
    lines = source_code.splitlines()
    transpiled_lines = [transpile_line(line) for line in lines]
    # Filter out empty lines to keep it clean
    return "\n".join(line for line in transpiled_lines if line.strip())

def compile_to_py(source_code):
    transpiled = transpile(source_code)
    header = """# Compiled by MLang Compiler

# --- Compiled Code ---
"""
    return header + transpiled

def format_error(e):
    if isinstance(e, SyntaxError):
        line_info = f" (Line {e.lineno})" if e.lineno else ""
        error_msg = f"Arre! Ithe kahi tari chukla.{line_info}"
        if e.text:
            error_msg += f"\nHe word ithe nako hota: '{e.text.strip()}'"
        return error_msg
    return str(e)

def execute(source_code):
    py_code = transpile(source_code)
    
    # Run the transpiled python code directly
    try:
        exec(py_code, {})
    except SyntaxError as e:
        raise SyntaxError(format_error(e)) from e
