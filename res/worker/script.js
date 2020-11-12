const { ipcRenderer } = require("electron");

const $ = require("jquery");
const _ = require("lodash");

// Keydown listener
$("body").on("keydown", (e) => {
    const { keyCode } = e;

    ipcRenderer.invoke("overlayWindow", "keydown", { keyCode: keyCode });
});

// Keyup listener
$("body").on("keyup", (e) => {
    const { keyCode } = e;

    ipcRenderer.invoke("overlayWindow", "keyup", { keyCode: keyCode });
});

// Mouse down listener
$("body").on("mousedown", (e) => {
    const { which: mouseBtn } = e;

    ipcRenderer.invoke("overlayWindow", "mousedown", { mouseBtn: mouseBtn });
});

// Mouse up listener
$("body").on("mouseup", (e) => {
    const { which: mouseBtn } = e;

    ipcRenderer.invoke("overlayWindow", "mouseup", { mouseBtn: mouseBtn });
});
