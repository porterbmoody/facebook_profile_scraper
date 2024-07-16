from flask import Flask, request, send_from_directory, jsonify
import json
import os
from threading import Thread
import time

app = Flask(__name__, static_folder='.')

def run_bot(username, password, group_url, number_of_hours):
    # Simulate bot running
    for i in range(number_of_hours):
        time.sleep(1)
        print(f"Running bot: {i + 1}/{number_of_hours} hours")

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/run-bot', methods=['POST'])
def run_bot_route():
    data = request.json
    username = data['username']
    password = data['password']
    group_url = data['group_url']
    number_of_hours = int(data['number_of_hours'])

    # Save to meta_data.json
    meta_data = {
        'username': username,
        'password': password,
        'group_url': group_url,
        'number_of_hours': number_of_hours
    }
    with open('meta_data.json', 'w') as f:
        json.dump(meta_data, f, indent=2)

    # Start the bot in a new thread
    bot_thread = Thread(target=run_bot, args=(username, password, group_url, number_of_hours))
    bot_thread.start()

    return jsonify(message="Bot execution started successfully!")

if __name__ == '__main__':
    app.run(port=3000, debug=True)
