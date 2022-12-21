const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const Filter = require('bad-words');
const { generateMessage, generateLocation } = require('./utils/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  console.log('connection start');

  socket.on('join', (options, callback) => {
    const { error, user} = addUser({id: socket.id, ...options});

    console.log(error, user)
    if(error) {
      return callback(error);
    }

    socket.join(user.room)

    socket.broadcast.to(user.room).emit('writeMessage', generateMessage('Admin', user.username + ' is Joined now'));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  })


  
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    if(!user) {
      return callback('user not found')
    }

    const filter = new Filter();
    
    if(filter.isProfane(message)) {
      return callback('Profine world not allowed')
    }
    
    io.to(user.room).emit('writeMessage', generateMessage(user.username, message));
    callback()
  })

  socket.on('location', (location, callback) => {
    const user = getUser(socket.id);
    if(!user) {
      return callback('user not found')
    }
    const { lat, long } = location;
    io.to(user.room).emit('writeLocation', generateLocation(user.username,`https://google.com/maps?q=${lat},${long}`));
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if(user) {
      io.to(user.room).emit('writeMessage', generateMessage('Admin', user.username + ' left a chat'));
      io.to(user.room).emit('roomData', {
        room:user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
  
})

server.listen(port, () => {
  console.log('start server at port ' + port);
})