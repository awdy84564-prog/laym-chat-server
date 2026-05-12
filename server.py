from flask import Flask
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

messages = []

@socketio.on('message')
def handle_message(data):
    messages.append(data)
    if len(messages) > 100: messages.pop(0)
    emit('message', data, broadcast=True)

@socketio.on('connect')
def handle_connect():
    emit('load_messages', messages)

@app.route('/')
def index():
    return "LAYM-CHAT Server is running on Render ✅"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
