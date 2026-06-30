from lexer import tokenize

def test_lexer():
    code = 'bol("Hello")'
    print(f"Input:\n{code}\n")
    print("Tokens:")
    tokens = tokenize(code)
    for token in tokens:
        print(token)

if __name__ == "__main__":
    test_lexer()
