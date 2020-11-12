import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as robotjs from "robotjs";
import * as _ from "lodash";
import * as url from "url";
import installExtension, {
    REACT_DEVELOPER_TOOLS,
    REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import * as addon from "@repledev/rinku_native_addons";

import { Server } from "./modules/server/";
import { Client } from "./modules/client/";

import { ScreenMap, CoordinateObject } from "./modules/screenmap/";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

// Main Window
let mainWindow: BrowserWindow | null;

// Cursor overlay Window
let overlayWindow: BrowserWindow | null;

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

    // Check if it's production
    if (process.env.NODE_ENV === "development") {
        mainWindow.loadURL("http://localhost:4000");
    } else {
        mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "renderer/index.html"),
                protocol: "file:",
                slashes: true,
            })
        );
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Once dom is ready
    mainWindow.webContents.on("dom-ready", () => {
        screenMap.addScreen(1366, 768, { x: 1366, y: 0 }, "test");

        Mouse.start();
    });

    mainWindow.on("closed", () => {
        mainWindow = null;

        overlayWindow.close();
    });
};

const createOverlayWindow = () => {
    overlayWindow = new BrowserWindow({
        show: false,
        resizable: false,
        movable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
        },
        skipTaskbar: true,
        transparent: true,
        fullscreen: true,
    });

    overlayWindow.setMenuBarVisibility(false);

    overlayWindow.setAlwaysOnTop(true, "normal");

    overlayWindow.maximize();

    overlayWindow.loadFile(path.join(__dirname, "../res/worker/index.html"));

    overlayWindow.on("closed", () => {
        overlayWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    createMainWindow();
    createOverlayWindow();
})
    .whenReady()
    .then(() => {
        if (process.env.NODE_ENV === "development") {
            installExtension(REACT_DEVELOPER_TOOLS)
                .then((name) => console.log(`Added Extension:  ${name}`))
                .catch((err) => console.log("An error occurred: ", err));
            installExtension(REDUX_DEVTOOLS)
                .then((name) => console.log(`Added Extension:  ${name}`))
                .catch((err) => console.log("An error occurred: ", err));
        }
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
    console.log(message);

    mainWindow.webContents.send("message", message);

    return "Sent message!";
}

function sendMessageToOverlayWindow(message: any) {
    console.log(message);

    overlayWindow.webContents.send("message", message);

    return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
    return await IpcMethods.exec(args);
});

ipcMain.handle("overlayWindow", async (e, ...args) => {
    return overlayWindowEventHandler(args[0], args[1]);
});

const server = new Server((e) => {
    sendMessageToMainWindow(e);
    const { eventType, screenArgs, methodType, methodParams, clientId } = e;
    switch (eventType) {
        // FIX: Removing screen from map after client disconnects. :/
        case "client.disconnect":
            screenMap.removeById(clientId);
            break;
        case "client.disconnect.force":
            screenMap.removeById(clientId);
            break;
        case "client.connect":
            server.sendMethodToClient(clientId, "screenmap.sync", {
                screenMap: screenMap.getScreenMap(),
            });
            pendingScreens.push({ ...screenArgs.screen, id: clientId });
            break;
        case "method":
            switch (methodType) {
                case "setscreen":
                    for (let i = 0; i < pendingScreens.length; ++i) {
                        const { width, height, id } = pendingScreens[i];
                        if (id === clientId) {
                            screenMap.addScreen(
                                width,
                                height,
                                methodParams.pos,
                                id
                            );
                            pendingScreens.splice(i, 1);
                            break;
                        }
                    }
                    break;
                default:
                    break;
            }
            break;
        case "server.start":
            Mouse.start();
            break;
        case "server.stop":
            Mouse.stop();
            break;
        default:
            break;
    }
});
const client = new Client((e) => {
    sendMessageToMainWindow(e);
    const { eventType, method, methodParams, error, reason } = e;

    switch (eventType) {
        case "auth.accept":
            sendMessageToMainWindow("auth.accept");
            client.sendMethod("setscreen", {
                pos: {
                    x: 1366,
                    y: 0,
                },
            });
            break;
        case "method":
            switch (method) {
                case "mouse.move":
                    sendMessageToMainWindow("movemouse");
                    Mouse.move(methodParams.pos.x, methodParams.pos.y);
                    break;
                case "screenmap.sync":
                    sendMessageToMainWindow("screenmapsync");
                    screenMap.setScreenMap(methodParams.screenMap);
                    break;
                case "keyboard.keydown":
                    addon.keyboard.keyDown(methodParams.keyCode);
                    break;
                case "keyboard.keyup":
                    addon.keyboard.keyUp(methodParams.keyCode);
                    break;
                case "mouse.down":
                    addon.mouse.down(methodParams.mouseBtn);
                    break;
                case "mouse.up":
                    addon.mouse.up(methodParams.mouseBtn);
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
});

type CurrentInstances = "Standby" | "Server" | "Client";

let currentInstance: CurrentInstances = "Standby";

type MainWindowMethodTypes =
    | "start server"
    | "stop server"
    | "connect to server"
    | "disconnect from server"
    | "retry auth";
interface MainWindowMethodArguments {
    port?: number;
    host?: string;
    password?: number | string;
    screenPos?: CoordinateObject;
}

type OverlayWindowEventTypes = "keydown" | "keyup" | "mousedown" | "mouseup";

interface OverlayWindowEventArguments {
    keyCode?: number;
    mouseBtn?: number;
}

class IpcMethods {
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
        retryAuth(password: string) {
            return client.retryAuth(password);
        },
    };
    static async exec(args: any[]) {
        const method: MainWindowMethodTypes = args[0];
        const methodArgs: MainWindowMethodArguments = args[1] || {};

        if (typeof method != "string")
            return "Method parameter not of string type!";

        switch (method.toLowerCase()) {
            case "start server":
                if (currentInstance == "Client")
                    return "You can't be a server when you're a client!";
                else if (currentInstance == "Server")
                    return "Server already started!";

                currentInstance = "Server";

                Mouse.start();

                return await server.start(
                    methodArgs.port,
                    methodArgs.host,
                    methodArgs.password
                );
            case "stop server":
                if (currentInstance != "Server")
                    return "You must be a server / must first start a server to stop a server!";

                currentInstance = "Standby";

                return server.stop();
            case "connect to server":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";
                else if (currentInstance == "Client")
                    return "Already connnected to server!";

                currentInstance = "Client";

                return await client.connect(
                    methodArgs.port,
                    methodArgs.host,
                    methodArgs.password,
                    {
                        screen: robotjs.getScreenSize(),
                    }
                );
            case "disconnect from server":
                if (currentInstance != "Client")
                    return "You aren't connected to a server!";

                return this.client.disconnect();
            case "retry auth":
                if (currentInstance == "Server")
                    return "You can't be a client if you're a server!";

                return client.retryAuth(methodArgs.password);
            default:
                return "Unknown Method. Better luck next time ¯\\_(ツ)_/¯";
        }
    }
}

function overlayWindowEventHandler(
    e: OverlayWindowEventTypes,
    args: OverlayWindowEventArguments
): void {
    switch (e) {
        case "keydown":
            server.sendMethodToClient(
                currentScreenId,
                "keyboard.keydown",
                args
            );
            break;
        case "keyup":
            server.sendMethodToClient(currentScreenId, "keyboard.keyup", args);
            break;
        case "mousedown":
            server.sendMethodToClient(currentScreenId, "mouse.down", args);
            break;
        case "mouseup":
            server.sendMethodToClient(currentScreenId, "mouse.up", args);
            break;
        default:
            break;
    }
}

/* 

	2 ==> Main ROBOTJS functions

*/
let pendingScreens: Array<{ width: number; height: number; id: string }> = []; // eslint-disable-line

const screenSize = robotjs.getScreenSize();

let mouseCoordinates: [number, number];

let isOutside = false;
let currentScreenId = "master";

const screenMap = new ScreenMap(screenSize.width, screenSize.height);

const restingPlace = [screenSize.width / 2, screenSize.height * 0.4].map(
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

            // This is to prevent it from going off-borders
            if (_.isUndefined(translatedCoordinate)) {
                const currentScreen = screenMap.getById(currentScreenId);

                mouseCoordinates[0] -= distance[0];
                mouseCoordinates[1] -= distance[1];

                const translatedCoordinateBefore = screenMap.translate({
                    x: mouseCoordinates[0],
                    y: mouseCoordinates[1],
                });

                const translatedCoordinateAfter = [
                    translatedCoordinateBefore.pos.x + distance[0],
                    translatedCoordinateBefore.pos.y + distance[1],
                ];

                if (translatedCoordinateAfter[0] <= 0) {
                    distance[0] += Math.abs(translatedCoordinateAfter[0]);
                }
                if (translatedCoordinateAfter[1] <= 0) {
                    distance[1] += Math.abs(translatedCoordinateAfter[1]);
                }
                if (translatedCoordinateAfter[0] >= currentScreen.width) {
                    distance[0] -=
                        translatedCoordinateAfter[0] +
                        distance[0] -
                        currentScreen.width;
                }
                if (translatedCoordinateAfter[1] >= currentScreen.height) {
                    distance[1] -=
                        translatedCoordinateAfter[1] +
                        distance[1] -
                        currentScreen.height;
                }

                mouseCoordinates[0] += distance[0];
                mouseCoordinates[1] += distance[1];

                translatedCoordinate = screenMap.translate({
                    x: mouseCoordinates[0],
                    y: mouseCoordinates[1],
                });
            }

            if (translatedCoordinate.id == "master") {
                Mouse.move(mouseCoordinates[0], mouseCoordinates[1]);

                isOutside = false;

                overlayWindow.blur();
                overlayWindow.hide();

                addon.window.activateStoredWindow();
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
                        coords.x -= 1;
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

                if (
                    !_.isUndefined(translatedCoordinate) &&
                    translatedCoordinate.id != "master"
                ) {
                    mouseCoordinates[0] = coords.x;
                    mouseCoordinates[1] = coords.y;

                    this.moveOnId(
                        translatedCoordinate.id,
                        translatedCoordinate.pos
                    );

                    for (let i = 0; i < 3; ++i) addon.mouse.up(i);

                    this.reset();

                    isOutside = true;

                    addon.window.storeCurrentWindow();

                    // addon.mouse.click("right");

                    overlayWindow.show();
                    overlayWindow.focus();

                    addon.mouse.click("left");

                    break;
                }
            }
        }
    }
    static onScreenEdge(
        mousePos: CoordinateObject,
        id = "master"
    ): "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" {
        const screen = screenMap.getById(id);

        if (mousePos.x <= 0 && mousePos.y <= 0) {
            return "nw";
        } else if (mousePos.x >= screen.width - 1 && mousePos.y <= 0) {
            return "ne";
        } else if (
            mousePos.x >= screen.width - 1 &&
            mousePos.y >= screen.height - 1
        ) {
            return "se";
        } else if (mousePos.x <= 0 && mousePos.y >= screen.height - 1) {
            return "sw";
        } else if (mousePos.x <= 0) {
            return "w";
        } else if (mousePos.y <= 0) {
            return "n";
        } else if (mousePos.x >= screen.width - 1) {
            return "e";
        } else if (mousePos.y >= screen.height - 1) {
            return "s";
        }
    }
    static reset(): void {
        this.move(restingPlace[0], restingPlace[1]);
    }
    static move(mouseX: number, mouseY: number): void {
        addon.mouse.move(mouseX, mouseY);
    }
    static start(delay = 2): void {
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
            pos: mousePos,
        });
    }
}

export {
    MainWindowMethodTypes as MethodTypes,
    MainWindowMethodArguments as MethodArguments,
};
