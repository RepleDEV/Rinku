const { ipcRenderer } = require('electron');
const keycode = require('keycode');

window.$ = window.jQuery = require("jquery");

async function sendIPCMessage(message) {
    return await ipcRenderer.invoke("mainWindow", message);
}

function startKeyLog() {
    sendIPCMessage("mainWindow", "startKeylog");
    return;
}

var currentKeysPressed = [];

ipcRenderer.on("mainWindowMsg", (e, data) => {
    if (data.type == "keyEvent") {
        const key = keycode(data.keycode);
        if (data.keyEvent == "keydown") {
            if (currentKeysPressed.indexOf(key) < 0) {
                currentKeysPressed.push(key);
            }
        } else {
            currentKeysPressed.splice(currentKeysPressed.indexOf(key), 1);
        }
    }
    $("#currentKeys").html(currentKeysPressed.join(", "));
});