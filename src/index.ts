import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as robotjs from "robotjs";
import * as _ from "lodash";

import { Server } from "./modules/server/";
import { Client } from "./modules/client/";

import { ScreenMap, CoordinateObject } from "./modules/screenmap/";

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

        screenMap.addScreen(1366, 768, {x: 1366, y: 0}, "gh");

        Mouse.start();
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
    return await IpcMethods.exec(args);
});

ipcMain.handle("cursorWindow", async (e, ...args) => {});

const server = new Server(e => {
    const { eventType, screenArgs, message, clientId } = e;
    switch (eventType) {
        case "client.connect":
            screenMap.addScreen(screenArgs.screen.width, screenArgs.screen.height, screenArgs.pos, clientId);
            break;
        case "client.disconnect":
            screenMap.removeById(clientId);
            break;
        case "client.disconnect.force":
            screenMap.removeById(clientId);
            break;
        default:
            break;
    }
});
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

class IpcMethods {
    static server = {
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
    };
    static client = {
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
    };
    static async exec(args: any[]) {
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

                return await this.server.start(
                    extraArgs[0],
                    extraArgs[1],
                    extraArgs[2]
                );
            case "stop server":
                if (currentInstance != "Server")
                    return "You must be a server / must first start a server to stop a server!";

                currentInstance = "Standby";

                return this.server.stop();
            case "send message":
                if (extraArgs[0] === undefined)
                    return "You have to provide the message to send!";

                if (currentInstance == "Server")
                    return this.server.sendMessage(extraArgs[0]);
                else return this.client.sendMessage(extraArgs[0]);
            case "connect to server":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";
                else if (currentInstance == "Client")
                    return "Already connnected to server!";

                currentInstance = "Client";

                return await client.connect(
                    extraArgs[0],
                    extraArgs[1],
                    extraArgs[2],
                    {
                        screen: robotjs.getScreenSize(),
                        pos: {
                            x: extraArgs[3],
                            y: extraArgs[4]
                        }
                    }
                );
            case "disconnect from server":
                if (currentInstance != "Client")
                    return "You aren't connected to a server!";

                return this.client.disconnect();
            case "retry auth":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";

                return this.client.retryAuth(extraArgs[0]);
            case "tests":
                cursorWindow.show();
                cursorWindow.focus();
                return;
            default:
                return "Unknown Method. Better luck next time ¯\\_(ツ)_/¯";
        }
    }
}
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

class Mouse {
    static loop: NodeJS.Timeout;
    static update(): void {
        const mousePos = robotjs.getMousePos();
        const { x: mouseX, y: mouseY } = mousePos;

        if (isOutside) {
            const distance = [
                mouseX - restingPlace[0],
                mouseY - restingPlace[1],
            ];

            mouseCoordinates[0] += distance[0];
            mouseCoordinates[1] += distance[1];

            let translatedCoordinate = screenMap.translate({
                x: mouseCoordinates[0],
                y: mouseCoordinates[1],
            });
            const currentScreen = screenMap.getById(currentScreenId);

            // This is to prevent it from going off-borders
            if (_.isUndefined(translatedCoordinate)) {
                mouseCoordinates[0] -= distance[0];
                mouseCoordinates[1] -= distance[1];
                   
                const translatedCoordinateBefore = screenMap.translate({
                    x: mouseCoordinates[0],
                    y: mouseCoordinates[1]
                });

                const translatedCoordinateAfter: [number, number] = [
                    translatedCoordinateBefore.pos.x + distance[0],
                    translatedCoordinateBefore.pos.y + distance[1]
                ];

                if (translatedCoordinateAfter[0] <= 0) {
                    distance[0] += Math.abs(translatedCoordinateAfter[0]);
                }
                if (translatedCoordinateAfter[1] <= 0) {
                    distance[1] += Math.abs(translatedCoordinateAfter[1]);
                }
                if (translatedCoordinateAfter[0] >= currentScreen.width) {
                    distance[0] -= translatedCoordinateAfter[0] + distance[0] - currentScreen.width;
                }
                if (translatedCoordinateAfter[1] >= currentScreen.height) {
                    distance[1] -= translatedCoordinateAfter[1] + distance[1] - currentScreen.height;
                }

                mouseCoordinates[0] += distance[0];
                mouseCoordinates[1] += distance[1];

                translatedCoordinate = screenMap.translate({
                    x: mouseCoordinates[0],
                    y: mouseCoordinates[1]
                });
            }

            if (translatedCoordinate.id == "master") {
                Mouse.move(mouseCoordinates[0], mouseCoordinates[1]);

                isOutside = false;

                cursorWindow.blur();
                cursorWindow.hide();

                winswitcher.activateStoredWindow();
            } else {
                Mouse.moveOnId(
                    translatedCoordinate.id,
                    translatedCoordinate.pos
                );

                Mouse.reset();
            }

            currentScreenId = translatedCoordinate.id;

            return;
        } else {
            mouseCoordinates = [mouseX, mouseY];
        }

        const onScreenEdge = this.onScreenEdge(mousePos);

        if (!_.isUndefined(onScreenEdge)) {
            const edges = onScreenEdge.split("");

            for (const edge of edges) {
                const coords = _.clone(mousePos);

                switch (edge) {
                    case "w":
                        coords.x -= 1
                        break;
                    case "n":
                        coords.y -= 1;
                        break;
                    case "e":
                        coords.x += 1;
                        break;
                    case "s":
                        coords.y += 1;
                        break;
                    default:
                        break;
                }

                const translatedCoordinate = screenMap.translate(coords);

                if (!_.isUndefined(translatedCoordinate) && translatedCoordinate.id != "master") {
                    mouseCoordinates[0] = coords.x;
                    mouseCoordinates[1] = coords.y;

                    this.moveOnId(
                        translatedCoordinate.id,
                        translatedCoordinate.pos
                    );

                    this.reset();

                    isOutside = true;

                    winswitcher.storeActiveWindow();

                    cursorWindow.show();
                    cursorWindow.focus();

                    break;
                }
            }
        }
    }
    static onScreenEdge(mousePos: CoordinateObject, id = "master"): "n" | "ne" | "e" | "se"| "s" | "sw" | "w" | "nw" {
        const screen = screenMap.getById(id);

        if (mousePos.x <= 0 && mousePos.y <= 0) {
            return "nw";
        } else if (mousePos.x >= screen.width - 1 && mousePos.y <= 0) {
            return "ne";
        } else if (mousePos.x >= screen.width - 1 && mousePos.y >= screen.height - 1) {
            return "se"
        } else if (mousePos.x <= 0 && mousePos.y >= screen.height - 1) {
            return "sw"
        } else if (mousePos.x <= 0) {
            return "w"
        } else if (mousePos.y <= 0) {
            return "n"
        } else if (mousePos.x >= screen.width - 1) {
            return "e"
        } else if (mousePos.y >= screen.height - 1) {
            return "s"
        }
    }
    static reset(): void {
        robotjs.moveMouse(restingPlace[0], restingPlace[1]);
    }
    static move(mouseX: number, mouseY: number): void {
        robotjs.moveMouse(mouseX, mouseY);
    }
    static start(delay = 5): void {
        if (_.isUndefined(Mouse.loop)) {
            this.loop = setInterval(() => {
                this.update();
            }, delay);
        }
    }
    static stop(): void {
        if (_.isUndefined(this.loop)) {
            clearInterval(this.loop);

            mouseCoordinates = undefined;
        }
    }
    static moveOnId(id: string, mousePos: CoordinateObject): void {
        server.sendMethodToClient(id, "mouse.move", {
            pos: mousePos
        });
    }
}