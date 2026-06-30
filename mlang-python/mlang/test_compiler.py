from interpreter import transpile, execute

def test_compiler():
    code = 'bol("Namaskar")'
    print(f"--- Phase 5: Transpiler Demo ---")
    print(f"Input Roman Marathi Code:\n{code}\n")
    
    # Transpile code
    python_code = transpile(code)
    print(f"Transpiled Python Code:\n{python_code}\n")
    
    # Execute code
    print("Execution Output:")
    execute(code)

if __name__ == "__main__":
    test_compiler()
