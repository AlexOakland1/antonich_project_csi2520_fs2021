let chatButton = document.querySelector('#upload');
let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

let ciphertext;

/*
Fetch the contents of the "message" textbox, and encode it
in a form we can use for the encrypt operation.
*/
function getMessageEncoding(value) {
  let message = value;
  let enc = new TextEncoder();
  return enc.encode(message);
}

/*
Get the encoded message, encrypt it and display a representation
of the ciphertext in the "Ciphertext" element.
*/
async function encryptMessage(key, value) {
  let encoded = getMessageEncoding(value);
  ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    key,
    encoded
  );
  //console.log(ciphertextValue);
  // let chatmsg = document.createElement('p');
  // let chatText_enc = document.createTextNode(ciphertextValue);
  // chatmsg.appendChild(chatText);
  // chatSpace.appendChild(chatmsg);
}

/*
Fetch the ciphertext and decrypt it.
Write the decrypted message into the "Decrypted" box.
*/
async function decryptMessage(key, user) {
  let decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    key,
    ciphertext
  );

  let dec = new TextDecoder();
  let decryptedValue = dec.decode(decrypted);
  let buffer = new Uint8Array(ciphertext, 0, 10);
  let ciphertextValue = `Encrypted text: ${buffer}...[${ciphertext.byteLength} bytes total]`;
  let chatmsgUser = document.createElement('p');
  let chatTextUser = document.createTextNode("Username: " + user);
  chatmsgUser.appendChild(chatTextUser);
  chatSpace.appendChild(chatmsgUser);
  let chatmsg = document.createElement('p');
  let chatText = document.createTextNode(ciphertextValue);
  chatmsg.appendChild(chatText);
  chatSpace.appendChild(chatmsg);
  let chatmsg2 = document.createElement('p');
  let chatText2 = document.createTextNode("Decrypted text: " + decryptedValue);
  chatmsg2.appendChild(chatText2);
  chatSpace.appendChild(chatmsg2);
}

/*
Generate an encryption key pair, then set up event listeners
on the "Encrypt" and "Decrypt" buttons.
*/

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
      const promises = data.data.map(async (message) => {
        window.crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            // Consider using a 4096-bit key for systems that require long-term security
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
          ).then((keyPair) => {
            encryptMessage(keyPair.publicKey, message.message).then(() => {decryptMessage(keyPair.privateKey, message.username);
            });
          });
      });
      const messages = Promise.all(promises);
    })
    .catch(error => console.error('Error fetching messages:', error));
}

chatButton.addEventListener('click', function () {
  const chatMessage = chatBox.value;

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
