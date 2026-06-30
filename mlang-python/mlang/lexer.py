import re

class Token:
    def __init__(self, type_, value):
        self.type = type_
        self.value = value

    def __repr__(self):
        # For symbols/punctuation, return the literal symbol value. Otherwise return the token type.
        if self.type in ('LPAREN', 'RPAREN', 'EQUALS', 'EE', 'COMPARE'):
            return self.value
        return self.type

TOKEN_SPECIFICATION = [
    ('BOL', r'\bbol\b'),
    ('VICHAR', r'\bvichar\b'),
    ('JAR', r'\bjar\b'),
    ('NAHITAR', r'\bnahitar\b'),
    ('JOVAR', r'\bjovar\b'),
    ('FIR', r'\bfir\b'),
    ('KAAM', r'\bkaam\b'),
    ('PARATDE', r'\bparatDe\b'),
    ('HO', r'\bho\b'),
    ('NAHI', r'\bnahi\b'),
    ('CHALU', r'\bchalu\b'),
    ('BASS', r'\bbass\b'),
    ('STRING', r'"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\''),
    ('NUMBER', r'\b\d+\b'),
    ('IDENTIFIER', r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'),
    ('EE', r'=='),
    ('EQUALS', r'='),
    ('COMPARE', r'>=|<=|>|<|!='),
    ('LPAREN', r'\('),
    ('RPAREN', r'\)'),
    ('WHITESPACE', r'[ \t]+'),
    ('NEWLINE', r'\n'),
]

def tokenize(code):
    tokens = []
    # Compile regex matching
    regex = '|'.join(f'(?P<{name}>{pattern})' for name, pattern in TOKEN_SPECIFICATION)
    
    for match in re.finditer(regex, code):
        kind = match.lastgroup
        value = match.group(kind)
        
        if kind in ('WHITESPACE', 'NEWLINE'):
            continue
            
        tokens.append(Token(kind, value))
        
    return tokens
