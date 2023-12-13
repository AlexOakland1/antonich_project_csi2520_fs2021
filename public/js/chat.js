let chatButton = document.querySelector('#upload');
let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

// Function to fetch messages from the server and update the chat space
function fetchMessages() {
  fetch('/chat')
    .then(response => response.json())
    .then(data => {
      // Clear existing chat messages and usernames
      chatSpace.innerHTML = '';
      usernameList.innerHTML = '';

      console.log(data)
      //Add fetched usernames to the username list
      data.usernames.forEach(username => {
        let usernameItem = document.createElement('li');
        let usernameText = document.createTextNode(username.username);
        usernameItem.appendChild(usernameText);
        usernameList.appendChild(usernameItem);
      });

      // Add fetched messages to the chat space
      data.data.forEach(message => {
        let chatmsg = document.createElement('p');
        let chatText = document.createTextNode(`${message.username}: ${message.message}`);
        chatmsg.appendChild(chatText);
        chatSpace.appendChild(chatmsg);
      });
    })
    .catch(error => console.error('Error fetching messages:', error));
}

chatButton.addEventListener('click', function () {
  const chatMessage = chatBox.value;

  // Assuming you have a global variable 'user' that contains the current user's username

  // Use Fetch API to send the message to the server
  fetch('/sendmessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: user, message: chatMessage }),
  })
    .then(response => response.json())
    .then(data => {
      // Fetch and update messages after sending a new message
      fetchMessages();
    })
    .catch(error => console.error('Error sending message:', error));

  // Clear the input box after sending the message
  chatBox.value = '';
});

// Fetch messages when the page loads
document.addEventListener('DOMContentLoaded', fetchMessages);
