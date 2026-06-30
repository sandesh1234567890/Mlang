# Compiled by MLang Compiler

def bol(*args, **kwargs):
    print(*args, **kwargs)

def vichar(prompt=""):
    return input(prompt)

# --- Compiled Code ---


nav = vichar("Tujha nav kay? ")

if nav == "Sandesh":
    bol("Kai bhava!")
else:
    bol("Swagat ahe!")

