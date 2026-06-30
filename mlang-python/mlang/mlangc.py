import sys
import os

try:
    from .interpreter import compile_to_py, format_error
except ImportError:
    from interpreter import compile_to_py, format_error

def main():
    if len(sys.argv) < 2:
        print("Usage: mlangc <input_file.m> [output_file.py]")
        sys.exit(1)
        
    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        sys.exit(1)
        
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        # Default: replace .m extension with .py
        base, ext = os.path.splitext(input_path)
        output_path = base + ".py"
        
    with open(input_path, 'r', encoding='utf-8') as f:
        source_code = f.read()
        
    try:
        compiled_code = compile_to_py(source_code)
        # Validate syntax by compiling in-memory
        compile(compiled_code, input_path, 'exec')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(compiled_code)
        print(f"Compilation successful! Output written to: {output_path}")
    except SyntaxError as e:
        print(f"Compilation Error:\n{format_error(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Compilation Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
