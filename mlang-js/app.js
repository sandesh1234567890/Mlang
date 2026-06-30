// Monaco Editor Integration & Custom MLang Language Definition
let editor;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    // 1. Register Custom MLang Language
    monaco.languages.register({ id: 'mlang' });

    // 2. Define Language Tokens (Syntax Highlighting)
    monaco.languages.setMonarchTokensProvider('mlang', {
        keywords: [
            'chalu', 'bass', 'jar', 'nahitar', 'jovar', 'fir', 'kaam', 'paratDe', 'ho', 'nahi'
        ],
        builtins: [
            'bol', 'vichar'
        ],
        operators: [
            '=', '==', '>', '<', '>=', '<=', '!=', '+', '-', '*', '/'
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
            root: [
                // Identifiers & Keywords
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@builtins': 'predefined',
                        '@default': 'identifier'
                    }
                }],
                // Numbers
                [/\d+/, 'number'],
                // String literals
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                // Operators
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                // Comments
                [/#.*$/, 'comment'],
            ]
        }
    });

    // 3. Define Theme & Editor Configurations
    monaco.editor.defineTheme('mlangDarkTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'c084fc', fontStyle: 'bold' },
            { token: 'predefined', foreground: '60a5fa', fontStyle: 'italic' },
            { token: 'string', foreground: '34d399' },
            { token: 'number', foreground: 'fb7185' },
            { token: 'comment', foreground: '6b7280' },
            { token: 'operator', foreground: 'f472b6' }
        ],
        colors: {
            'editor.background': '#0f172a',
            'editor.lineHighlightBackground': '#1e293b',
        }
    });

    // 4. Create Editor Instance
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: `chalu\nnav = vichar("Tujha nav kay? ")\n\njar nav == "Sandesh"\n    bol("Kai bhava!")\nnahitar\n    bol("Swagat ahe!")\nbass`,
        language: 'mlang',
        theme: 'mlangDarkTheme',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        automaticLayout: true,
        minimap: { enabled: false },
        lineNumbersMinChars: 3
    });
});

// IDE Controls & Interactive Client-Side Transpilation
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const runBtn = document.getElementById('run-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const filenameInput = document.getElementById('filename-input');
const saveBtn = document.getElementById('save-btn');
const openBtn = document.getElementById('open-btn');
const filePicker = document.getElementById('file-picker');

// Story Modal elements
const storyBtn = document.getElementById('story-btn');
const storyModal = document.getElementById('story-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Story Tabs elements
const tabBtnMarathi = document.getElementById('tab-btn-marathi');
const tabBtnEnglish = document.getElementById('tab-btn-english');
const tabBtnTasks = document.getElementById('tab-btn-tasks');
const storyContentMarathi = document.getElementById('story-content-marathi');
const storyContentEnglish = document.getElementById('story-content-english');
const storyContentTasks = document.getElementById('story-content-tasks');

function appendToTerminal(text, type = 'stdout') {
    const line = document.createElement('div');
    if (type === 'stdout') {
        line.className = 'stdout-line';
        line.innerText = text;
    } else if (type === 'stderr') {
        line.className = 'stderr-line';
        line.innerText = text;
    } else if (type === 'system') {
        line.className = 'system-message';
        line.innerText = text;
    } else if (type === 'prompt') {
        line.className = 'input-prompt-line';
        line.innerText = text;
    }
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Client-Side Python-to-JS Transpiler
function transpileToJS(code) {
    let lines = code.split('\n');
    let jsLines = [];
    let indentStack = [0];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let stripped = line.trim();
        
        if (!stripped || stripped === 'chalu' || stripped === 'bass') {
            continue;
        }
        
        // Get indentation
        let indent = line.length - line.trimStart().length;
        
        // Dedent: close corresponding blocks
        while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
            indentStack.pop();
            jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
        }
        
        // Indent: open a block
        if (indent > indentStack[indentStack.length - 1]) {
            indentStack.push(indent);
            // Insert '{' at the end of the previous line
            let prevIndex = jsLines.length - 1;
            while (prevIndex >= 0 && jsLines[prevIndex].trim() === '') {
                prevIndex--;
            }
            if (prevIndex >= 0) {
                jsLines[prevIndex] = jsLines[prevIndex] + ' {';
            }
        }
        
        // Protect string literals
        let strings = [];
        let protectedLine = stripped.replace(/("[^"\\]*(?:\\.[^"\\]*)*"|'[^\'\\]*(?:\\.[^\'\\]*)*')/g, (match) => {
            strings.push(match);
            return `__STR_${strings.length - 1}__`;
        });
        
        // Translate vocabulary keywords
        // bol(...) -> await bol(...)
        protectedLine = protectedLine.replace(/\bbol\((.*)\)/g, 'await bol($1)');
        // vichar(...) -> await vichar(...)
        protectedLine = protectedLine.replace(/\bvichar\((.*)\)/g, 'await vichar($1)');
        
        // jar <cond> -> if (<cond>)
        if (protectedLine.startsWith('jar ')) {
            let cond = protectedLine.substring(4).trim();
            protectedLine = `if (${cond})`;
        }
        // nahitar -> else
        else if (protectedLine === 'nahitar') {
            protectedLine = 'else';
        }
        // jovar <cond> -> while (<cond>)
        else if (protectedLine.startsWith('jovar ')) {
            let cond = protectedLine.substring(6).trim();
            protectedLine = `while (${cond})`;
        }
        // fir <loop> -> for (<loop>)
        else if (protectedLine.startsWith('fir ')) {
            let loop = protectedLine.substring(4).trim();
            protectedLine = `for (${loop})`;
        }
        // kaam <func> -> async function <func>
        else if (protectedLine.startsWith('kaam ')) {
            let func = protectedLine.substring(5).trim();
            protectedLine = `async function ${func}`;
        }
        // paratDe <val> -> return <val>
        else if (protectedLine.startsWith('paratDe ')) {
            let val = protectedLine.substring(8).trim();
            protectedLine = `return ${val}`;
        }
        else if (protectedLine === 'paratDe') {
            protectedLine = 'return';
        }
        
        // ho -> true, nahi -> false
        protectedLine = protectedLine.replace(/\bho\b/g, 'true');
        protectedLine = protectedLine.replace(/\bnahi\b/g, 'false');
        
        // restore strings
        for (let sIdx = 0; sIdx < strings.length; sIdx++) {
            protectedLine = protectedLine.replace(`__STR_${sIdx}__`, strings[sIdx]);
        }
        
        // Add semicolon if not a block starter
        let isBlockStarter = protectedLine.startsWith('if') || protectedLine === 'else' || 
                             protectedLine.startsWith('while') || protectedLine.startsWith('for') || 
                             protectedLine.startsWith('async function');
        let endChar = isBlockStarter ? '' : ';';
        
        jsLines.push(' '.repeat(indent) + protectedLine + endChar);
    }
    
    // Close any remaining blocks
    while (indentStack.length > 1) {
        indentStack.pop();
        jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }
    
    return jsLines.join('\n');
}

// Global run session states
let isRunning = false;
let terminalResolve = null;

async function runCode() {
    if (isRunning) return;
    isRunning = true;
    
    runBtn.disabled = true;
    stopBtn.disabled = false;
    terminalOutput.innerHTML = '';
    appendToTerminal("--- Execution Started (Browser Static) ---", "system");
    
    const code = editor.getValue();
    const jsCode = transpileToJS(code);
    
    // Define interactive prompt variables
    const bol = async (...args) => {
        appendToTerminal(args.join(' '), 'stdout');
    };
    
    const vichar = async (promptText) => {
        appendToTerminal(promptText, 'prompt');
        terminalInput.disabled = false;
        terminalInput.focus();
        
        return new Promise((resolve) => {
            terminalResolve = resolve;
        });
    };
    
    try {
        // Evaluate the generated async JS code directly in the browser
        await eval(`(async () => {
            try {
                ${jsCode}
            } catch (innerErr) {
                throw innerErr;
            }
        })()`);
        appendToTerminal("--- Execution Completed Successfully ---", "system");
    } catch (err) {
        // Show Marathi syntax error header
        appendToTerminal(`Arre! Ithe kahi tari chukla.\nHe word ithe nako hota: ${err.message}`, "stderr");
    } finally {
        resetExecutionUI();
    }
}

async function sendTerminalInput(value) {
    terminalInput.value = '';
    terminalInput.disabled = true;
    appendToTerminal(value, "stdout"); // Echo input back to screen
    
    if (terminalResolve) {
        const resolve = terminalResolve;
        terminalResolve = null;
        resolve(value);
    }
}

async function stopCode() {
    if (!isRunning) return;
    if (terminalResolve) {
        const resolve = terminalResolve;
        terminalResolve = null;
        resolve(null);
    }
    appendToTerminal("--- Execution Stopped by User ---", "system");
    resetExecutionUI();
}

function resetExecutionUI() {
    isRunning = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
    terminalInput.disabled = true;
    terminalInput.value = '';
    terminalResolve = null;
}

// Event Listeners
runBtn.addEventListener('click', runCode);
stopBtn.addEventListener('click', stopCode);
clearBtn.addEventListener('click', () => { terminalOutput.innerHTML = ''; });

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = terminalInput.value;
        sendTerminalInput(val);
    }
});

// File Save & Open functionality
saveBtn.addEventListener('click', () => {
    const filename = filenameInput.value || 'program.m';
    const blob = new Blob([editor.getValue()], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
});

openBtn.addEventListener('click', () => {
    filePicker.click();
});

filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    filenameInput.value = file.name;
    const reader = new FileReader();
    reader.onload = function(evt) {
        editor.setValue(evt.target.result);
    };
    reader.readAsText(file);
});

// Toggle Story Modal
storyBtn.addEventListener('click', () => {
    storyModal.classList.add('active');
});

modalCloseBtn.addEventListener('click', () => {
    storyModal.classList.remove('active');
});

storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal) {
        storyModal.classList.remove('active');
    }
});

// Tab Switch Listeners
tabBtnMarathi.addEventListener('click', () => {
    tabBtnMarathi.classList.add('active');
    tabBtnEnglish.classList.remove('active');
    tabBtnTasks.classList.remove('active');
    storyContentMarathi.classList.add('active');
    storyContentEnglish.classList.remove('active');
    storyContentTasks.classList.remove('active');
});

tabBtnEnglish.addEventListener('click', () => {
    tabBtnEnglish.classList.add('active');
    tabBtnMarathi.classList.remove('active');
    tabBtnTasks.classList.remove('active');
    storyContentEnglish.classList.add('active');
    storyContentMarathi.classList.remove('active');
    storyContentTasks.classList.remove('active');
});

tabBtnTasks.addEventListener('click', () => {
    tabBtnTasks.classList.add('active');
    tabBtnMarathi.classList.remove('active');
    tabBtnEnglish.classList.remove('active');
    storyContentTasks.classList.add('active');
    storyContentMarathi.classList.remove('active');
    storyContentEnglish.classList.remove('active');
});
