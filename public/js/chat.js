let chatButton = document.querySelector('#upload');
let chatSpace = document.querySelector('#chat');
let chatBox = document.querySelector('#chatbox');
let bar = document.querySelector('#containerbar');

chatButton.addEventListener('click', function () {
    let chatmsg = document.createElement('p');
    let chatText = document.createTextNode("<%= user %>:   " + chatBox.value);
    chatmsg.appendChild(chatText);
    chatSpace.insertBefore(chatmsg, bar);
})