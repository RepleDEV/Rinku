const { ipcRenderer } = require('electron');
const robot = require('robotjs');

window.$ = window.jQuery = require("jquery");

async function sendMethod(method, ...extraArgs) {
    return await ipcRenderer.invoke("mainWindow", method, extraArgs);
}
 
function startMouseTracker() {
    requestAnimationFrame(startMouseTracker);

    const { x, y } = robot.getMousePos();

    $("#currentMouse").html(`MouseX: ${x} | MouseY: ${y}`);
}

ipcRenderer.on("mainWindowMsg", (e, data) => {
    console.log(data);
});

window.onload = () => {
    startMouseTracker();
};