const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

let users = {};
let rooms = {
  'main': { id: 'main', name: 'العام', owner: null, users: [], goldenSettings: { micLocked: false, chatLocked: false, color: '#9D4EDD' } }
};
let rankPasswords = {
  'rank_vip': 'VIP123',
  'rank_master': 'MASTER123',
  'rank_root': 'ROOT123',
  'rank_moasses': 'MOASSES123',
  'rank_founder': 'LAYM_Founder_2026'
};
let privateChats = new Map();
let userImageCount = new Map();

function isFounder(socketId) {
  return users[socketId]?.rank === 'founder';
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ username, password }) => {
    let rank = 'member';
    if (password) {
      for (let [key, val] of Object.entries(rankPasswords)) {
        if (val === password) {
          rank = key.replace('rank_', '');
          break;
        }
      }
    }

    users[socket.id] = { id: socket.id, username, rank, roomId: 'main' };
    rooms['main'].users.push(socket.id);
    socket.join('main');

    socket.emit('joined', { roomId: 'main', roomName: rooms['main'].name, rank });
    socket.emit('rankUpdate', rank);

    io.to('main').emit('userJoined', { username, rank });
    io.to('main').emit('roomUsers', getRoomUsers('main'));
  });  socket.on('sendMessage', (msg) => {
    const user = users[socket.id];
    if (!user) return;
    const room = rooms[user.roomId];
    if (room?.goldenSettings.chatLocked && user.rank === 'member') return;

    io.to(user.roomId).emit('message', {
      username: user.username,
      rank: user.rank,
      text: msg,
      time: Date.now()
    });
  });

  socket.on('sendImage', (data) => {
    const user = users[socket.id];
    if (!user || user.rank === 'member') return;

    const today = new Date().toDateString();
    const key = `${socket.id}_${today}`;
    const count = userImageCount.get(key) || 0;

    if (count >= 3) {
      socket.emit('systemMessage', { text: 'وصلت للحد اليومي 3 صور' });
      return;
    }

    userImageCount.set(key, count + 1);
    io.to(user.roomId).emit('image', {
      username: user.username,
      rank: user.rank,
      image: data,
      time: Date.now()
    });
  });

  socket.on('founderGetData', () => {
    if (!isFounder(socket.id)) return;
    socket.emit('founderData', {
      rooms: Object.values(rooms).map(r => ({
        id: r.id, name: r.name, usersCount: r.users.length, owner: r.owner, users: r.users
      })),
      users: Object.values(users).map(u => ({
        id: u.id, username: u.username, rank: u.rank, roomId: u.roomId
      })),
      passwords: rankPasswords
    });
  });

  socket.on('founderChangePassword', ({ rank, newPass }) => {
    if (!isFounder(socket.id)) return;
    rankPasswords[`rank_${rank}`] = newPass;
    io.emit('systemMessage', { text: `تم تغيير كلمة سر ${rank}` });
  });

  socket.on('founderGrantRoomOwner', ({ targetId, roomId }) => {
    if (!isFounder(socket.id)) return;
    if (users[targetId] && rooms[roomId]) {
      users[targetId].rank = 'roomOwner';
      rooms[roomId].owner = targetId;
      io.to(targetId).emit('rankUpdate', 'roomOwner');
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      if (rooms[user.roomId]) {
        rooms[user.roomId].users = rooms[user.roomId].users.filter(id => id!== socket.id);
        io.to(user.roomId).emit('userLeft', { username: user.username });
      }
      delete users[socket.id];
    }
  });
});

function getRoomUsers(roomId) {
  return rooms[roomId].users.map(id => ({
    id, username: users[id]?.username, rank: users[id]?.rank
  }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));