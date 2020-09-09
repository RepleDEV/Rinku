const { ipcRenderer } = require('electron');
const keycode = require('keycode');

window.$ = window.jQuery = require("jquery");

async function sendIPCMessage(channel, ...args) {
    return await ipcRenderer.invoke(channel, args[0]);
}

function startKeyLog() {
    sendIPCMessage("mainWindow", {method: "keylog", options: {value: "start"}});
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