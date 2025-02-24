const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let boardState = [];

io.on('connection', (socket) => {   
    console.log('a user connected');

    socket.emit('load-board', boardState); 

    socket.on('draw', (data) => {
        console.log(`Draw event received from ${socket.id}:`, data);
        boardState.push(data);
        socket.broadcast.emit('draw', data);
    });

    socket.on('clear-board', () => {
        boardState = [];
        io.emit('clear-board');
    });

    socket.on('disconnect', () => {
        console.log(`user disconnected ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});