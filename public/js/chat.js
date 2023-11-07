let chatButton = document.querySelector('#upload');
let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

chatButton.addEventListener('click', function () {
    // user's input
    const userMessage = chatBox.value;

    // encrypt user's message
    const encryptionKey = 3;
    const encryptedMessage = encryptMessage(userMessage, encryptionKey);

    let chatmsg = document.createElement('p');
    let chatText = document.createTextNode(user + "(Encrypted message): " + encryptedMessage); // Display the encrypted message
    chatmsg.appendChild(chatText);
    chatSpace.insertBefore(chatmsg, bar);

   // decrypt and display message
   const decryptedMessage = decryptMessage(encryptedMessage, encryptionKey);
   let decryptedChatMsg = document.createElement('p');
   let decryptedChatText = document.createTextNode(user + " (Decrypted message): " + decryptedMessage);
   decryptedChatMsg.appendChild(decryptedChatText);
   chatSpace.insertBefore(decryptedChatMsg, bar);
});

// encryption function
function encryptMessage(message, key) {
    let encryptedMessage = '';
    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const encryptedCharCode = charCode + key;
        encryptedMessage += String.fromCharCode(encryptedCharCode);
    }
    return encryptedMessage;
}

// decryption function
function decryptMessage(encryptedMessage, key) {
    let decryptedMessage = '';
    for (let i = 0; i < encryptedMessage.length; i++) {
        const charCode = encryptedMessage.charCodeAt(i);
        const decryptedCharCode = charCode - key;
        decryptedMessage += String.fromCharCode(decryptedCharCode);
    }
    return decryptedMessage;
}
