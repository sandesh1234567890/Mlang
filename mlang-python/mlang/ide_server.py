import sys
import os
import json
import queue
import threading
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Add current directory to path so interpreter.py can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class StopExecution(Exception):
    pass

class RunSession:
    def __init__(self):
        self.code = ""
        self.stdout_buffer = []
        self.input_queue = queue.Queue()
        self.output_queue = queue.Queue()
        self.thread = None
        self.running = False

    def clear(self):
        self.code = ""
        self.stdout_buffer = []
        self.input_queue = queue.Queue()
        self.output_queue = queue.Queue()
        self.thread = None
        self.running = False

session = RunSession()

def worker_thread(session, code):
    session.running = True
    
    def web_bol(*args, **kwargs):
        if not session.running:
            raise StopExecution()
        text = " ".join(map(str, args))
        session.stdout_buffer.append(text)
        
    def web_vichar(prompt_text=""):
        if not session.running:
            raise StopExecution()
            
        stdout_content = "\n".join(session.stdout_buffer)
        session.stdout_buffer.clear()
        
        # Ask client for input
        session.output_queue.put({
            "status": "prompt",
            "output": stdout_content,
            "prompt_text": prompt_text
        })
        
        # Wait for input (blocks until main thread puts input here)
        user_input = session.input_queue.get()
        
        if not session.running:
            raise StopExecution()
            
        return user_input

    try:
        from interpreter import transpile
        py_code = transpile(code)
        
        # Bind bol and vichar
        env = {
            'print': web_bol,
            'input': web_vichar,
        }
        
        exec(py_code, env)
        
        # Successful complete
        stdout_content = "\n".join(session.stdout_buffer)
        session.stdout_buffer.clear()
        session.output_queue.put({
            "status": "completed",
            "output": stdout_content
        })
    except StopExecution:
        pass
    except Exception as e:
        stdout_content = "\n".join(session.stdout_buffer)
        session.stdout_buffer.clear()
        
        # Try to format error nicely
        from interpreter import format_error
        err_msg = format_error(e)
        session.output_queue.put({
            "status": "error",
            "output": stdout_content,
            "message": err_msg
        })
    finally:
        session.running = False

class IDEHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve from mlang/ide/ subfolder
        root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ide')
        
        parsed = urllib.parse.urlparse(path)
        clean_path = parsed.path
        
        if clean_path in ('/', '/index.html'):
            return os.path.join(root, 'index.html')
        elif clean_path == '/styles.css':
            return os.path.join(root, 'styles.css')
        elif clean_path == '/app.js':
            return os.path.join(root, 'app.js')
            
        return super().translate_path(path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        
        if parsed.path == '/run':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req = json.loads(post_data.decode('utf-8'))
            
            if session.running:
                # Stop any existing run first
                session.running = False
                session.input_queue.put(None)
                if session.thread:
                    session.thread.join(timeout=1.0)
                    
            session.clear()
            session.code = req.get('code', '')
            
            # Start worker execution
            session.thread = threading.Thread(target=worker_thread, args=(session, session.code))
            session.thread.daemon = True
            session.thread.start()
            
            # Wait for first yield status (blocks until completed, error, or prompt)
            res = session.output_queue.get()
            self.send_json_response(res)
            
        elif parsed.path == '/input':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req = json.loads(post_data.decode('utf-8'))
            
            user_input = req.get('input', '')
            
            # Provide input to the blocked thread
            session.input_queue.put(user_input)
            
            # Wait for next yield status
            res = session.output_queue.get()
            self.send_json_response(res)
            
        elif parsed.path == '/stop':
            session.running = False
            session.input_queue.put(None)
            self.send_json_response({"status": "stopped"})
            
        else:
            self.send_error(404, "Not Found")

    def send_json_response(self, data):
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response_bytes))
        self.end_headers()
        self.wfile.write(response_bytes)

def main():
    # Cloud Run injects PORT environment variable
    port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    
    try:
        httpd = ThreadingHTTPServer(server_address, IDEHandler)
        print(f"MLang Web IDE is running at http://0.0.0.0:{port}/")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down MLang IDE Server...")
        sys.exit(0)

if __name__ == "__main__":
    main()
