from http.server import SimpleHTTPRequestHandler
import socketserver
import urllib.request

PORT = 8080

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.proxy()
        else:
            super().do_GET()
            
    def do_POST(self):
        self.proxy()
        
    def do_DELETE(self):
        self.proxy()
        
    def do_OPTIONS(self):
        self.proxy()

    def proxy(self):
        url = 'http://localhost:8000' + self.path
        req = urllib.request.Request(url, method=self.command)
        for k, v in self.headers.items():
            if k.lower() not in ['host']:
                req.add_header(k, v)
        length = int(self.headers.get('Content-Length', 0))
        if length:
            req.data = self.rfile.read(length)
        
        try:
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for k, v in response.headers.items():
                    if k.lower() not in ['transfer-encoding']:
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ['transfer-encoding']:
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
