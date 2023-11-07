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
    let caesarMessage = '';
    let base64Message = window.btoa(message);
    for (let i = 0; i < base64Message.length; i++) {
        const charCode = base64Message.charCodeAt(i);
        const encryptedCharCode = charCode + key;
        caesarMessage += String.fromCharCode(encryptedCharCode);
    }
    let encryptedMessage = window.btoa(caesarMessage);
    return encryptedMessage;
}

// decryption function
function decryptMessage(encryptedMessage, key) {
    let caesarMessage = window.atob(encryptedMessage);
    let base64Message = '';
    for (let i = 0; i < caesarMessage.length; i++) {
        const charCode = caesarMessage.charCodeAt(i);
        const decryptedCharCode = charCode - key;
        base64Message += String.fromCharCode(decryptedCharCode);
    }
    let decryptedMessage = window.atob(base64Message);
    return decryptedMessage;
}
