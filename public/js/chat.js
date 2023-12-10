let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

function encryptMessage(message, publicKey) {
  return window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    new TextEncoder().encode(message)
  );
}

console.log(publickey);

// Assuming the user and publicKey are obtained from the server
let username = user; // Replace with the actual username
let publicKey; // Replace with the actual public key received from the server

// Fetch the public key before allowing the user to send messages
async function fetchPublicKey() {
  try {
    const response = await fetch('/publicKey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username }) // Pass the current username
    });

    const data = await response.json();

    console.log(data); // Log the data received from the server

    if (data.publicKey) {
      // Use btoa() to encode binary data to base64
      publicKey = await crypto.subtle.importKey(
        'spki',
        btoa(String.fromCharCode.apply(null, new Uint8Array(data.publicKey))),
        { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
        true,
        ['encrypt']
      );
    } else {
      console.error("Public key not received from the server");
    }
  } catch (error) {
    console.error("Error fetching public key:", error);
  }
}

fetchPublicKey().then(() => {
  let chatButton = document.querySelector('#upload');
  chatButton.addEventListener("click", () => {
    const userMessage = chatBox.value;
    encryptMessage(userMessage, publicKey).then((encryptedMessageBuffer) => {
      const encryptedMessageBase64 = Buffer.from(encryptedMessageBuffer).toString('base64');

      // Send the encrypted message to the server
      fetch('/sendmessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: encryptedMessageBase64 })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Optionally, you can display a success message or handle the response accordingly
          console.log("Message sent successfully");
        } else {
          console.error("Failed to send message");
        }
      });
    });
  });
});
