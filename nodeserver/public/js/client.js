// Connect to the server
const socket = io('https://0267-49-204-27-149.ngrok-free.app');

// Select DOM elements
const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector(".container");
const typingIndicator = document.getElementById('typing-indicator');
const clearChatBtn = document.getElementById('clearChatBtn');
const fileInput = document.getElementById('fileInput');  // Select file input
const usernameModal = document.getElementById('usernameModal');
const submitNameButton = document.getElementById('submitName');
const usernameInput = document.getElementById('usernameInput');
const userList = document.getElementById('user-list'); // New: User list container

// Load notification sound
const audio = new Audio('ting.mp3');
let username = '';
let activePrivateChat = null; // New: Track the active private cha

// Function to append messages to the chat container
var append = (message, position, timestamp = new Date()) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', position);

    // Add timestamp
    const timestampElement = document.createElement('span');
    timestampElement.classList.add('timestamp');
    timestampElement.innerText = timestamp.toLocaleTimeString();

    // Add message content
    const contentElement = document.createElement('span');
    contentElement.innerText = message;

    messageElement.append(contentElement, timestampElement);
    messageContainer.append(messageElement);

    messageContainer.scrollTop = messageContainer.scrollHeight;
};
// Function to start typing the welcome text
function typeText(name) {
    const welcomeText = `Welcome to the Chat! ${name}`;  // Customize your welcome message
    const welcomeElement = document.getElementById("welcome-text");
    let i = 0;

    function typing() {
        if (i < welcomeText.length) {
            welcomeElement.textContent += welcomeText.charAt(i);
            i++;
            setTimeout(typing, 100);  // Adjust the speed of typing here (100ms)
        }
    }
    typing();
}


// Show the modal dialog to enter the username
usernameModal.style.display = 'flex';


// Submit username
submitNameButton.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name) {
        username = name;
        usernameModal.style.display = 'none';  // Hide modal
        socket.emit('new-user-joined', name);  // Notify server with the name
        document.getElementById("welcome-text").textContent = '';  // Clear welcome text before typing starts
        typeText(name);  // Start typing the welcome text after the name is submitted
        usernameInput.value = "";
    }
});

// Handle form submission to send a message
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (message.trim()) {
        if (activePrivateChat) {
            append(`You (to ${activePrivateChat}): ${message}`, 'right-message');
            socket.emit('private-message', { to: activePrivateChat, message });
        } else {
            append(`You: ${message}`, 'right-message');
            socket.emit('send', message);
        }
        messageInput.value = "";
        messageInput.blur();
    }
})

// Listen for events from the server
socket.on('user-joined', (name) => {
    append(`${name} joined the chat`, 'left-message');
    updateUserList(); // Update the user list when a new user join
});

socket.on('receive', (data) => {
    append(`${data.name}: ${data.message}`, 'left-message');
});

socket.on('left', (name) => {
    append(`${name} left the chat`, 'left-message');
    updateUserList(); // Update the user list when a user leaves
});


// Listen for private messages
socket.on('private-message', (data) => {
    append(`Private from ${data.from}: ${data.message}`, 'left-message');
});

function updateUserList() {
    socket.emit('get-users'); // Request the list of users from the server
}

socket.on('user-list', (users) => {
    userList.innerHTML = ''; // Clear the existing list
    users.forEach((user) => {
        if (user !== username) { // Exclude the current user
            const userElement = document.createElement('li');
            userElement.classList.add('user-card');
            
            // Create Avatar Section
            const avatar = document.createElement('div');
            avatar.classList.add('avatar');
            const img = document.createElement('img');
            img.src = 'https://via.placeholder.com/40';  // Placeholder avatar, change later to real avatar
            avatar.appendChild(img);

            // Create User Info Section
            const userInfo = document.createElement('div');
            userInfo.classList.add('user-info');
            const userName = document.createElement('span');
            userName.classList.add('user-name');
            userName.innerText = user;
            userInfo.appendChild(userName);

            // Create Status Indicator
            const status = document.createElement('span');
            status.classList.add('status', 'online');  // Change to offline or other status dynamically
            userElement.append(avatar, userInfo, status);
            
            // Event listener for private chat
            userElement.addEventListener('click', () => {
                activePrivateChat = user; // Set the selected user for private chat
                alert(`Private chat started with ${user}`);
                document.getElementById("chat-status").innerText = `Private Chat with ${user}`; // Update chat status
            });

            userList.appendChild(userElement);
        }
    });
});


const endPrivateChatBtn = document.getElementById('endPrivateChatBtn');

endPrivateChatBtn.addEventListener('click', () => {
    // Reset the active private chat
    activePrivateChat = null;
    alert("Private chat ended.");
    // Optionally, clear the message container or reset UI elements
    
    document.getElementById("chat-status").innerText = "Public Chat";  // Optionally reset the status
});

// Show typing indicator
messageInput.addEventListener("input", () => {
    socket.emit("typing");
});

// Listen for typing notifications
socket.on("user-typing", () => {
    typingIndicator.style.display = "block";
    setTimeout(() => {
        typingIndicator.style.display = "none";
    }, 1000);
});

// Function to handle file selection
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = reader.result;
            socket.emit('send-file', { fileData, name: username, fileName: file.name });
        };
        reader.readAsDataURL(file);  // Converts the file to a base64 string
    }
});

// Clear Chat functionality
clearChatBtn.addEventListener('click', () => {
    messageContainer.innerHTML = '';  // Clear all messages
});


// Get the theme toggle button
const themeToggleButton = document.getElementById("themeToggle");

// Add event listener for the button
themeToggleButton.addEventListener("click", () => {
    // Toggle between 'light-theme' and 'dark-theme' classes
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");

    // Optionally, change the button icon when switching themes
    const sunIcon = themeToggleButton.querySelector(".fa-sun");
    const moonIcon = document.createElement("i");
    moonIcon.classList.add("fa", "fa-moon");

    // If dark theme is active, show moon icon (for dark mode), else sun icon (for light mode)
    if (document.body.classList.contains("dark-theme")) {
        themeToggleButton.replaceChild(moonIcon, sunIcon);
    } else {
        themeToggleButton.replaceChild(sunIcon, moonIcon);
    }
});

