import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as robotjs from "robotjs";
import * as _ from "lodash";

import Server = require("./modules/server");
import Client = require("./modules/client/");

import ScreenMap = require("./modules/screenmap");

import * as winswitcher from "@repledev/rinku_winswitcher";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

let domHasLoaded = false;

// Main Window
let mainWindow: BrowserWindow;

// Cursor Window
let cursorWindow: BrowserWindow;

const createMainWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
        },
        title: "Rinku",
    });

    // Fixes Node fs issues as seen here https://github.com/electron/electron/issues/22119
    app.allowRendererProcessReuse = false;

    // Disable menu bar
    mainWindow.setMenuBarVisibility(false);

    // Maximize window
    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../res/main/index.html"));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Once dom is ready
    mainWindow.webContents.on("dom-ready", () => {
        // Set domHasLoaded to true
        domHasLoaded = true;

        // screenMap.addScreen(1366, 768, {x: -1366, y: 0}, "a");
        // screenMap.addScreen(1366, 768, {x: 1366, y: 0}, "b");
        console.log(screenMap.calculateEdgeIntersect({x: -2, y: 2}, {x: 2, y: -2}));
        // Mouse.start();
    });
};

const createCursorWindow = () => {
    cursorWindow = new BrowserWindow({
        // Hide for now
        show: false,
        // Make it 100% constant
        resizable: false,
        movable: false,
        // Frameless. No X, minimize, or maximize button
        frame: false,

        webPreferences: {
            // Integrate require func
            nodeIntegration: true,
        },
        // Make it not show in the taskbar
        skipTaskbar: true,
        // And make it transparent
        opacity: 0.2,
    });

    cursorWindow.setMenuBarVisibility(false);

    cursorWindow.setAlwaysOnTop(true, "normal");

    cursorWindow.maximize();

    cursorWindow.loadFile(path.join(__dirname, "../res/worker/index.html"));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    createMainWindow();
    createCursorWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

/* 
	
	1 ==> Main IPC server / client functions

*/

// Electron IPC
function sendMessageToMainWindow(message: any) {
    if (!domHasLoaded) return "DOM HASN'T LOADED YET!";

    mainWindow.webContents.send("message", message);

    return "Sent message!";
}

function sendMessageToCursorWindow(message: any) {
    if (!domHasLoaded) return "DOM HASN'T LOADED YET!";

    cursorWindow.webContents.send("message", message);

    return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
    return await ipcMethods.exec(args);
});

ipcMain.handle("cursorWindow", async (e, ...args) => {});

const server = new Server(console.log);
const client = new Client((e) => {
    const { eventType, message, method, methodParams, error, reason } = e;

    if (eventType == "method") {
        switch (method) {
            case "mouse.move":
                Mouse.move(methodParams.pos.x, methodParams.pos.y);
                break;

            default:
                break;
        }
    }
});

type CurrentInstances = "Standby" | "Server" | "Client";

let currentInstance: CurrentInstances = "Standby";

const ipcMethods = {
    server: {
        start: async function (
            port?: number,
            host?: string,
            password?: string
        ) {
            return await server.start(port, host, password);
        },
        stop: function () {
            return server.stop();
        },
        sendMessage(message: any) {
            return server.sendMessageToAll(message);
        },
    },
    client: {
        connect: async function (
            port: number,
            host?: string,
            password?: string | undefined,
            extraData?: any
        ) {
            return await client.connect(port, host, password, extraData);
        },
        disconnect: function () {
            return client.disconnect();
        },
        sendMessage(message: any) {
            return client.sendMessage(message);
        },
        retryAuth(password: string) {
            return client.retryAuth(password);
        },
    },
    exec: async function (args: any[]) {
        const method: string = args[0];
        const extraArgs: any[] = args[1];

        if (typeof method != "string")
            return "Method parameter not of string type!";

        switch (method.toLowerCase()) {
            case "start server":
                if (currentInstance == "Client")
                    return "You can't be a server when you're a client!";

                currentInstance = "Server";

                Mouse.start();

                return await ipcMethods.server.start(
                    extraArgs[0],
                    extraArgs[1],
                    extraArgs[2]
                );
            case "stop server":
                if (currentInstance != "Server")
                    return "You must be a server / must first start a server to stop a server!";

                currentInstance = "Standby";

                return ipcMethods.server.stop();
            case "send message":
                if (extraArgs[0] === undefined)
                    return "You have to provide the message to send!";

                if (currentInstance == "Server")
                    return ipcMethods.server.sendMessage(extraArgs[0]);
                else return ipcMethods.client.sendMessage(extraArgs[0]);
            case "connect to server":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";
                else if (currentInstance == "Client")
                    return "Already connnected to server!";

                currentInstance = "Client";

                return await ipcMethods.client.connect(
                    extraArgs[0],
                    extraArgs[1],
                    extraArgs[2],
                    {
                        screen: robotjs.getScreenSize(),
                    }
                );
            case "disconnect from server":
                if (currentInstance != "Client")
                    return "You aren't connected to a server!";

                return ipcMethods.client.disconnect();
            case "retry auth":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";

                return ipcMethods.client.retryAuth(extraArgs[0]);
            case "tests":
                cursorWindow.show();
                cursorWindow.focus();
                return;
            default:
                return "Unknown Method. Better luck next time ¯\\_(ツ)_/¯";
        }
    },
};
/* 

	2 ==> Main ROBOTJS functions

*/
const screenSize = robotjs.getScreenSize();

let mouseCoordinates: [number, number];

let isOutside = false;
let currentScreenId = "master";

const screenMap = new ScreenMap(screenSize.width, screenSize.height);

const restingPlace = [screenSize.width / 2, screenSize.height * 0.05].map(
    Math.round
);

const Mouse = {
    loop: undefined,
    update(): void {
        const mousePos = robotjs.getMousePos();
        const { x: mouseX, y: mouseY } = mousePos;

        if (isOutside) {
            const distance = [mouseX - restingPlace[0], mouseY - restingPlace[1]];

            mouseCoordinates[0] += distance[0];
            mouseCoordinates[1] += distance[1];

            const translatedCoordinate = screenMap.translate({x: mouseCoordinates[0], y: mouseCoordinates[1]});
            const currentScreen = screenMap.getById(currentScreenId);

            if (translatedCoordinate.id == "master") {
                Mouse.move(mouseCoordinates[0], mouseCoordinates[1]);


                isOutside = false;
                
                cursorWindow.blur();
                cursorWindow.hide();

                winswitcher.activateStoredWindow();

                return;
            } else {
                if (translatedCoordinate.pos.x <= 0) {
                    translatedCoordinate.pos.x = 0;
                }

                if (translatedCoordinate.pos.x >= currentScreen.width) {
                    translatedCoordinate.pos.x = currentScreen.width;
                }

                if (translatedCoordinate.pos.y <= 0) {
                    translatedCoordinate.pos.y = 0;
                }

                if (translatedCoordinate.pos.y >= currentScreen.height) {
                    translatedCoordinate.pos.y = currentScreen.height;
                }

                Mouse.moveOnId(translatedCoordinate.id, translatedCoordinate.pos.x, translatedCoordinate.pos.y);

                Mouse.reset();
            }

            currentScreenId = translatedCoordinate.id;
        } else {
            mouseCoordinates = [mouseX, mouseY];
        }

        const onScreenEdge = screenMap.onScreenEdge(mousePos);

        if (!_.isUndefined(onScreenEdge)) {
            const coordToTranslate = mousePos;
            if (onScreenEdge == "n") {
                coordToTranslate.y -= 1;
            } else if (onScreenEdge == "e") {
                coordToTranslate.x += 1;
            } else if (onScreenEdge == "w") {
                coordToTranslate.x -= 1;
            } else if (onScreenEdge == "s") {
                coordToTranslate.y += 1;
            }

            const translatedCoordinate = screenMap.translate(coordToTranslate);

            if (translatedCoordinate.id != "master") {
                mouseCoordinates[0] = coordToTranslate.x;
                mouseCoordinates[1] = coordToTranslate.y;

                Mouse.moveOnId(translatedCoordinate.id, translatedCoordinate.pos.x, translatedCoordinate.pos.y);

                Mouse.reset();

                isOutside = true;

                winswitcher.storeActiveWindow();

                cursorWindow.show();
                cursorWindow.focus();
            }
        }

        // // Init
        // if (_.isUndefined(mouseCoordinates)) {
        //     mouseCoordinates = [mouseX, mouseY];
        // } else {
        //     if (isOutside) {
        //         // console.log(restingPlace[0] - mouseX);
        //         mouseCoordinates[0] += mouseX - restingPlace[0];
        //         mouseCoordinates[1] += mouseY - restingPlace[1];
        //     } else {
        //         mouseCoordinates[0] = mouseX;
        //         mouseCoordinates[1] = mouseY;
        //     }
        // }

        // const onScreenEdge = screenMap.onScreenEdge({x: mouseCoordinates[0], y: mouseCoordinates[1]});

        // const coordToTranslate = {x: mouseCoordinates[0], y: mouseCoordinates[1]};
        // switch (onScreenEdge) {
        //     case "n":
        //         coordToTranslate.y -= 1;
        //         break;
        //     case "e":
        //         coordToTranslate.x += 1;
        //         break;
        //     case "w":
        //         coordToTranslate.x -= 1;
        //         break;
        //     case "s":
        //         coordToTranslate.y += 1;
        //         break;
        // }

        // const translatedCursorPosition = screenMap.translate(coordToTranslate);

        // if (!_.isUndefined(translatedCursorPosition)) {
            
        //     if (translatedCursorPosition.id == "master") {
        //         if (isOutside) {
        //             Mouse.move(
        //                 translatedCursorPosition.pos.x,
        //                 translatedCursorPosition.pos.y
        //             );
    
        //             winswitcher.activateStoredWindow();
        //         }
                
        //         isOutside = false;
        //     } else {
        //         server.sendMessageToClient(translatedCursorPosition.id, {
        //             method: "mouse.move",
        //             params: {
        //                 pos: translatedCursorPosition.pos,
        //             },
        //         });

        //         winswitcher.storeActiveWindow();

        //         Mouse.reset();

        //         isOutside = true;
        //     }

        //     screenMap.setActive(translatedCursorPosition.id);
        // } else {
        //     console.log("UN");
        // }
    },
    reset(): void {
        robotjs.moveMouse(restingPlace[0], restingPlace[1]);
    },
    move(mouseX: number, mouseY: number): void {
        robotjs.moveMouse(mouseX, mouseY);
    },
    start(): void {
        if (_.isUndefined(Mouse.loop)) {
            Mouse.loop = setInterval(() => {
                Mouse.update();
            }, 5);
        }
    },
    stop(): void {
        if (_.isUndefined(Mouse.loop)) {
            clearInterval(Mouse.loop);

            mouseCoordinates = undefined;
        }
    },
    moveOnId(id: string, mouseX: number, mouseY: number): void {
        server.sendMessageToClient(id, { type: "method", methodType: "mouse.move", params: {
            x: mouseX,
            y: mouseY
        }});
    }
};
