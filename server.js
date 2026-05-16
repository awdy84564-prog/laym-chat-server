const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const ROLES = {
  member: { level: 1, color: '#fff' },
  vip: { level: 2, color: '#00ff00' },
  master: { level: 3, color: '#ffaa00' },
  root: { level: 4, color: '#ff0000' },
  founder: { level: 5, color: '#aa00ff' }
};

const PASSWORDS = {
  member: 'member123',
  vip: 'vip123',
  master: 'master123',
  root: 'root123',
  founder: 'founder123'
};

let users = {};
let chatLocked = false;
let reports = [];

io.on('connection', (socket) => {
  socket.on('login', ({ username, role, password }) => {
    if (PASSWORDS[role]!== password) {
      socket.emit('loginError', 'كلمة السر غلط');
      return;
    }
    users[socket.id] = { username, role, level: ROLES[role].level, color: ROLES[role].color };
    socket.emit('loginSuccess', { role, username });
    io.emit('userList', Object.values(users));
    socket.emit('reports', reports);
  });

  socket.on('message', (msg) => {
    if (chatLocked && users[socket.id].level < 4) return;
    io.emit('message', {
      username: users[socket.id].username,
      role: users[socket.id].role,
      color: users[socket.id].color,
      text: msg,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('privateMessage', ({ to, text }) => {
    const target = Object.keys(users).find(id => users[id].username === to);
    if (target) {
      io.to(target).emit('privateMessage', { from: users[socket.id].username, text });
      socket.emit('privateMessage', { from: 'أنت لـ ' + to, text });
    }
  });

  socket.on('report', ({ reportedUser, message, type }) => {
    reports.push({ reportedUser, message, type, time: new Date().toLocaleString() });
    if (users[socket.id]) {
      io.to(socket.id).emit('reportSent', 'تم ارسال البلاغ');
    }
    Object.keys(users).forEach(id => {
      if (users[id].role === 'founder') {
        io.to(id).emit('newReport', reports[reports.length - 1]);
      }
    });
  });

  socket.on('lockChat', (state) => {
    if (users[socket.id].level >= 4) {
      chatLocked = state;
      io.emit('system', chatLocked? 'الشات مقفل' : 'الشات مفتوح');
    }
  });

  socket.on('changePassword', ({ role, newPass }) => {
    if (users[socket.id].role === 'founder') {
      PASSWORDS[role] = newPass;
      socket.emit('system', `تم تغيير كلمة سر ${role}`);
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userList', Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on ' + PORT));