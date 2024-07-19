require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { io, app, server } = require('./SOCKET/socketconfig');
require('./DATABASE/connection');

const PORT = 9000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const router = require('./Routers/routes');
app.use('/uploads',express.static('./uploads'))

app.use(router);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chatMessage', (msg) => {
        io.emit('chatMessage', msg);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING SUCCESSFULLY AT PORT NUMBER ${PORT}`);
});

app.post('/send', (req, res) => {
    const { message } = req.body;
    if (message) {
io.emit('chatMessage', message);
        res.status(200).json({ status: 'Message sent', message });
    } else {
        res.status(400).json({ status: 'Error', message: 'Message content is missing' });
    }
});
