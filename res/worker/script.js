const { ipcRenderer } = require("electron");

const $ = require("jquery");
const _ = require("lodash");

let keysPressed = [];

$("body").on("keydown", (e) => {
    const { keyCode } = e;

    if (keysPressed.includes(keyCode)) return;

    ipcRenderer.invoke("overlayWindow", {
        eventType: "keydown",
        keyCode: keyCode,
    });

    keysPressed.push(keyCode);
});
$("body").on("keyup", (e) => {
    const { keyCode } = e;

    keysPressed = _.remove(keysPressed, keyCode);

    ipcRenderer.invoke("overlayWindow", {
        eventType: "keyup",
        keyCode: keyCode,
    });
});
