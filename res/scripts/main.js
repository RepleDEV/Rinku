const { ipcRenderer } = require('electron');
const robotjs = require('robotjs');

window.$ = window.jQuery = require("jquery");

async function sendMethod(method, ...extraArgs) {
    return await ipcRenderer.invoke("mainWindow", method, extraArgs);
}

var currentMenu = "";

// function startMouseTracker() {
//     requestAnimationFrame(startMouseTracker);

//     const { x, y } = robot.getMousePos();

//     $("#currentMouse").html(`MouseX: ${x} | MouseY: ${y}`);
// }

function switchMenu(menu) {
    if (currentMenu !== "")
        $(`.menu.${currentMenu}`).hide();

    $(`.menu.${menu}`).show();

    currentMenu = menu;
}

ipcRenderer.on("mainWindowMsg", (e, data) => {
    console.log(data);
});

window.onload = () => {
    updateCursor();
    switchMenu("main");
};

$("#btn_server").on("click", async () => {
    await sendMethod("start server", 3011, "localhost", "testpass");
    switchMenu("server");
});

$("#btn_client").on("click", () => {
    switchMenu("client");
});

$("#btn_server_send_msg").on("click", async () => {
    const msg = $("#input_server_send_msg").val();

    await sendMethod("send message", msg);

    $("#input_server_send_msg").val("");
});

$("#btn_client_send_msg").on("click", async () => {
    const msg = $("#input_client_send_msg").val();

    await sendMethod("send message", msg);

    $("#input_client_send_msg").val("");
});

function updateCursor() {
    requestAnimationFrame(updateCursor);

    const cursor = robotjs.getMousePos();

    sendMethod("update cursor", cursor.x, cursor.y);
}