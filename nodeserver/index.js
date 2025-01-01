const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Import 'path' module to resolve file paths


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://cfd4-49-204-28-11.ngrok-free.app",
        methods: ["GET", "POST"],
    },
});
console.log("Starting the server..."); // Add this at the top of your index.js file

app.use(express.static('public'));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Path to the index.html file
})

const users = {};  // Object to store users by socket ID

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Handle new user joining
    socket.on('new-user-joined', (name) => {
        users[socket.id] = name;  // Store user's name with socket ID
        socket.broadcast.emit('user-joined', name);  // Notify other users
    });

    // Handle sending messages
    socket.on('send', (message) => {
        const userName = users[socket.id];  // Retrieve the sender's name
        if (userName) {
            socket.broadcast.emit('receive', { message, name: userName });  // Broadcast the message
        }
    });

    // Handle file sending
    socket.on('send-file', (fileData) => {
        const userName = users[socket.id];  // Retrieve the sender's name
        if (userName) {
            socket.broadcast.emit('receive-file', { fileData, name: userName });
        }
    });
    
    // Handle user typing
    socket.on('typing', () => {
        const userName = users[socket.id];  // Retrieve the user's name
        if (userName) {
            socket.broadcast.emit('user-typing', userName);  // Broadcast the typing event
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const userName = users[socket.id];  // Retrieve the user's name
        if (userName) {
            socket.broadcast.emit('left', userName);  // Notify others the user has left
        }
        delete users[socket.id];  // Remove the user from the users object
    });
});

    server.listen(8001, () => {
        console.log('Server is running on http://localhost:8001');
    });

