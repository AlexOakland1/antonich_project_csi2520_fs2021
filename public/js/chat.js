let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

function getMessageEncoding() {
    const messageBox = document.querySelector("#chatbox");
    let message = messageBox.value;
    let enc = new TextEncoder();
    return enc.encode(message);
  }

  async function encryptMessage(key) {
    let encoded = getMessageEncoding();
    ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      key,
      encoded
    );

    let buffer = new Uint8Array(ciphertext, 0, 20);
    let chatmsg = document.createElement('p');
    let chatText = document.createTextNode(user + "(Encrypted message): " + `${buffer}...[${ciphertext.byteLength} bytes total]`); // Display the encrypted message
    chatmsg.appendChild(chatText);
    chatSpace.insertBefore(chatmsg, bar);
  }

async function decryptMessage(key) {
    let decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      key,
      ciphertext
    );

    let dec = new TextDecoder();
    //const decryptedValue = document.querySelector(".rsa-oaep .decrypted-value");
    //decryptedValue.textContent = dec.decode(decrypted);
    let chatmsg = document.createElement('p');
    let chatText = document.createTextNode(user + "(Decrypted message): " + dec.decode(decrypted)); // Display the encrypted message
    chatmsg.appendChild(chatText);
    chatSpace.insertBefore(chatmsg, bar);
  }


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
    let chatButton = document.querySelector('#upload');
    chatButton.addEventListener("click", () => {
      encryptMessage(keyPair.publicKey).then(() => {decryptMessage(keyPair.privateKey);
      });
    });
  });
// chatButton.addEventListener('click', function () {
//     // user's input
//     const userMessage = chatBox.value;
//
//     // encrypt user's message
//     const encryptedMessage = encryptMessage(keyPair.publicKey);
//
//     let chatmsg = document.createElement('p');
//     let chatText = document.createTextNode(user + "(Encrypted message): " + encryptedMessage); // Display the encrypted message
//     chatmsg.appendChild(chatText);
//     chatSpace.insertBefore(chatmsg, bar);
//
//    // decrypt and display message
//    const decryptedMessage = decryptMessage(encryptedMessage, encryptionKey);
//    let decryptedChatMsg = document.createElement('p');
//    let decryptedChatText = document.createTextNode(user + " (Decrypted message): " + decryptedMessage);
//    decryptedChatMsg.appendChild(decryptedChatText);
//    chatSpace.insertBefore(decryptedChatMsg, bar);
// });
