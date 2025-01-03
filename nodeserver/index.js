const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Import 'path' module to resolve file paths


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://0267-49-204-27-149.ngrok-free.app",
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
        sendUserList();  // Update user list for all clients
    });

    // Handle public messages
    socket.on('send', (message) => {
        const userName = users[socket.id];  // Retrieve the sender's name
        if (userName) {
            socket.broadcast.emit('receive', { message, name: userName });  // Broadcast the message
        }
    });

    // Handle private messages
    socket.on('private-message', (data) => {
        const targetSocketId = Object.keys(users).find(
            (id) => users[id] === data.to
        );
        if (targetSocketId) {
            io.to(targetSocketId).emit('private-message', {
                message: data.message,
                from: users[socket.id],
            });
        }
    });

    socket.on('get-users', () => {
        const userList = Object.values(users); // Get all usernames
        socket.emit('user-list', userList); // Send the list to the requesting client
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
        sendUserList();  // Update user list for all clients
    });

    // Send updated user list to all clients
    function sendUserList() {
        const userList = Object.values(users);
        io.emit('user-list', userList);
    }

});

    server.listen(8001, () => {
        console.log('Server is running on http://localhost:8001');
    });

