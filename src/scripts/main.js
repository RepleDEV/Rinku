const { ipcRenderer } = require('electron');

window.$ = window.jQuery = require("jquery");

/**
 * Sends a method using ipcRenderer to the main process;
 * @param {any} method Method to send
 */
async function sendMethod(method, ...extraArgs) {
    return await ipcRenderer.invoke("mainWindow", method, extraArgs);
}

async function startKeyLog() {
    return await sendMethod("startKeylog");
}

ipcRenderer.on("mainWindowMsg", (e, data) => {
    console.log(data);
});