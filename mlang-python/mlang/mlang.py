import sys
import os

try:
    from .interpreter import execute, format_error
except ImportError:
    from interpreter import execute, format_error

def main():
    if len(sys.argv) < 2:
        # Default to demo.m if no file is specified
        script_path = os.path.join(os.path.dirname(__file__), 'demo.m')
    else:
        script_path = sys.argv[1]

    if not os.path.exists(script_path):
        print(f"Error: File '{script_path}' not found.")
        sys.exit(1)

    with open(script_path, 'r', encoding='utf-8') as f:
        source_code = f.read()

    try:
        execute(source_code)
    except SyntaxError as e:
        print(f"Syntax Error:\n{format_error(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
