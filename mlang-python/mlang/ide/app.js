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

// IDE Controls & Interactive API Communication
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

// Global run session states
let isRunning = false;

async function runCode() {
    if (isRunning) return;
    isRunning = true;
    
    // UI state
    runBtn.disabled = true;
    stopBtn.disabled = false;
    terminalOutput.innerHTML = '';
    appendToTerminal("--- Execution Started ---", "system");
    
    const code = editor.getValue();
    
    try {
        let response = await fetch('/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        let data = await response.json();
        handleServerResponse(data);
    } catch (err) {
        appendToTerminal(`Failed to communicate with execution server: ${err}`, "stderr");
        resetExecutionUI();
    }
}

async function sendTerminalInput(value) {
    terminalInput.value = '';
    terminalInput.disabled = true;
    appendToTerminal(value, "stdout"); // Echo input back to screen
    
    try {
        let response = await fetch('/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: value })
        });
        
        let data = await response.json();
        handleServerResponse(data);
    } catch (err) {
        appendToTerminal(`Communication lost: ${err}`, "stderr");
        resetExecutionUI();
    }
}

async function stopCode() {
    if (!isRunning) return;
    try {
        await fetch('/stop', { method: 'POST' });
        appendToTerminal("--- Execution Stopped by User ---", "system");
    } catch (err) {
        // ignore
    }
    resetExecutionUI();
}

function handleServerResponse(data) {
    if (data.output) {
        // Only print output if it isn't empty
        const lines = data.output.split('\n');
        lines.forEach(l => {
            if (l) appendToTerminal(l, "stdout");
        });
    }
    
    if (data.status === 'prompt') {
        // Print the prompt text and enable terminal input
        appendToTerminal(data.prompt_text, "prompt");
        terminalInput.disabled = false;
        terminalInput.focus();
    } else if (data.status === 'completed') {
        appendToTerminal("--- Execution Completed Successfully ---", "system");
        resetExecutionUI();
    } else if (data.status === 'error') {
        appendToTerminal(data.message, "stderr");
        resetExecutionUI();
    }
}

function resetExecutionUI() {
    isRunning = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
    terminalInput.disabled = true;
    terminalInput.value = '';
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
