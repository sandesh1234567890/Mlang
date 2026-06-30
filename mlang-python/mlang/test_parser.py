from lexer import tokenize
from parser import parse_code, ParserError

def test_parser():
    code = "jar > 5"
    print(f"Input:\n{code}\n")
    try:
        tokens = tokenize(code)
        parse_code(tokens)
        print("Parsing successful!")
    except ParserError as e:
        print("Error:")
        print(e)

if __name__ == "__main__":
    test_parser()
