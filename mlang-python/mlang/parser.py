class ParserError(Exception):
    pass

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.current = 0

    def parse(self):
        while self.current < len(self.tokens):
            token = self.tokens[self.current]
            
            if token.type == 'JAR':
                # Check what follows 'jar'
                if self.current + 1 < len(self.tokens):
                    next_token = self.tokens[self.current + 1]
                    if next_token.type in ('COMPARE', 'EE', 'EQUALS'):
                        raise ParserError("Jar nantar condition pahije.")
                else:
                    raise ParserError("Jar nantar condition pahije.")
                    
            self.current += 1
            
def parse_code(tokens):
    parser = Parser(tokens)
    parser.parse()
