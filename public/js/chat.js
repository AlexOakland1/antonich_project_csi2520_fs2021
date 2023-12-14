let chatButton = document.querySelector('#upload');
let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

let serverPublicKey;

fetch('/publickey')
  .then(response => response.json())
  .then(data => {
    serverPublicKey = data.publicKey;
    console.log(serverPublicKey);
  })
  .catch(error => console.error('Error fetching public key:', error));

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

      // Add fetched and decrypted messages to the chat space
      data.data.forEach(message => {
        // Decrypt the message with the client's private key
        const decryptedMessage = crypto.privateDecrypt(privateKey, Buffer.from(message.message, 'base64')).toString('utf8');

        let chatmsg = document.createElement('p');
        let chatText = document.createTextNode(`${message.username}: ${decryptedMessage}`);
        chatmsg.appendChild(chatText);
        chatSpace.appendChild(chatmsg);
      });
    })
    .catch(error => console.error('Error fetching messages:', error));
}

chatButton.addEventListener('click', function () {
  const chatMessage = chatBox.value;

  // Check if the public key is available
  if (!serverPublicKey) {
    console.error('Public key not available');
    return;
  }

  // Create a new JSEncrypt instance
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(serverPublicKey);

  // Generate a random AES key
  const aesKey = crypto.getRandomValues(new Uint8Array(16)); // 128-bit key

  // Convert the AES key to a string for RSA encryption
  const aesKeyString = btoa(String.fromCharCode.apply(null, aesKey));

  // Encrypt the AES key with the server's public key
  const encryptedAesKey = encrypt.encrypt(aesKeyString);

  // Use the AES key to encrypt the message
  const aesCipher = crypto.createCipher('aes-128-cbc', aesKey);
  let encryptedMessage = aesCipher.update(chatMessage, 'utf8', 'base64');
  encryptedMessage += aesCipher.final('base64');

  // Use Fetch API to send the encrypted message and AES key to the server
  fetch('/sendmessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: user, message: encryptedMessage, aesKey: encryptedAesKey }),
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
