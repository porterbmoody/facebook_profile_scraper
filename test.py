#%%
from flask import Flask, send_from_directory
import webbrowser
import os
import threading
import time

app = Flask(__name__)
port = 3000

@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

def open_browser():
    time.sleep(1)  # Give the server a second to start
    url = f'http://localhost:{port}'
    webbrowser.open(url)

if __name__ == '__main__':
    threading.Thread(target=open_browser).start()
    app.run(port=port, threaded=True)

#%%
