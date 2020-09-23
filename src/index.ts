import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as robotjs from "robotjs";
import * as _ from "lodash";

import Server = require('./modules/server');
import Client = require('./modules/client');

import KeyLogger = require('./modules/keylogger');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let domHasLoaded: boolean = false;

// Main Window
let mainWindow: BrowserWindow;

const createWindow = () => {
  	// Create the browser window.
	mainWindow = new BrowserWindow({
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: true
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
	mainWindow.loadFile(path.join(__dirname, '../res/index.html'));

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// Once dom is ready
	mainWindow.webContents.on("dom-ready", () => {
		// Set domHasLoaded to true
		domHasLoaded = true;
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

/* 
	
	1 ==> Main IPC server / client functions

*/

const server = new Server(sendMessageToMainWindow);
const client = new Client(sendMessageToMainWindow);

const keylogger = new KeyLogger(sendMessageToMainWindow);

type CurrentInstances = "Standby" | "Server" | "Client";

let currentInstance: CurrentInstances = "Standby";

function sendMessageToMainWindow(message: any) {
	if (!domHasLoaded)
		return "DOM HASN'T LOADED YET!";

	mainWindow.webContents.send("mainWindowMsg", message);

	return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
	return await ipcMethods.exec(args);
});

const ipcMethods = {
	server: {
		start: async function(port?: number, host?: string, password?: string) {
			return await server.start(port, host, password);
		},
		stop: function() {
			return server.stop();
		},
		sendMessage(message: any) {
			return server.sendMessageToAll(message);
		}
	},
	client: {
		connect: async function(port: number, host?: string, password?: string | undefined, extraData?: any) {
			return await client.connect(port, host, password, extraData);
		},
		disconnect: function() {
			return client.disconnect();
		},
		sendMessage(message: any) {
			return client.sendMessage(message);
		},
		retryAuth(password: string) {
			return client.retryAuth(password);
		}
	},
	keyLogger: {
		start: function() {
			return keylogger.start();
		},
		stop: function() {
			return keylogger.stop();
		}
	},
	exec: async function(args: any[]) {
		const method: string = args[0];
		const extraArgs: any[] = args[1];

		if (typeof method != "string") 
			return "Method parameter not of string type!";

		switch (method.toLowerCase()) {
			case "start server":
				if (currentInstance == "Client")
					return "You can't be a server when you're a client!";

				currentInstance = "Server";
				return ipcMethods.server.start(extraArgs[0], extraArgs[1], extraArgs[2]);
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
				else 
					return ipcMethods.client.sendMessage(extraArgs[0]);
			case "connect to server":
				if (currentInstance == "Server")
					return "You can't be a client if you're a server!";
				else if (currentInstance == "Client")
					return "Already connnected to server!";

				currentInstance = "Client";

				return await ipcMethods.client.connect(extraArgs[0], extraArgs[1], extraArgs[2], {
					screen: robotjs.getScreenSize()
				});
			case "disconnect from server":
				if (currentInstance != "Client")
					return "You aren't connected to a server!";

				return ipcMethods.client.disconnect();
			case "retry auth":
				if (currentInstance == "Server")
					return "You can't be a client if you're a server!";
				
				return ipcMethods.client.retryAuth(extraArgs[0]);
			case "start keylogger":
				return ipcMethods.keyLogger.start();
			case "update cursor":
				Cursor.update(extraArgs[0], extraArgs[1]);
				return "Updated";
			default:
				return "Unknown Method. Better luck next time ¯\\_(ツ)_/¯";
		}
	}
};

/* 

	2 ==> Main ROBOTJS functions

*/
interface ScreenMapObject {
	width: number,
	height: number
}

type ScreenMap = [
	[ScreenMapObject | null, ScreenMapObject | null, ScreenMapObject | null],
	[ScreenMapObject | null, ScreenMapObject | null, ScreenMapObject | null]
]

const screenSize = robotjs.getScreenSize();

let cursorCoord: [number, number] = [0,0];

let screenMap: ScreenMap = [
	[null, null, null],
	[null, screenSize, null]
];

let onScreenEdge: boolean = false;

const restingPlace = [Math.round(screenSize.width / 2), Math.round(screenSize.height * 0.05)];

const Cursor = {
	update: function(mouseX: number, mouseY: number): void {
		if (onScreenEdge) {
			// Distance from restingPlace
			var distance = [mouseX - restingPlace[0], mouseY - restingPlace[1]];

			cursorCoord[0] += distance[0];
			cursorCoord[1] += distance[1];

			cursorCoord[1] = cursorCoord[1] <= 0 ? 0 : cursorCoord[1];
			cursorCoord[1] = cursorCoord[1] >= screenSize.width ? screenSize.width : cursorCoord[1];

			if (cursorCoord[0] >= 0) {
				if (screenMap[1][0] !== null) {
					Cursor.move(cursorCoord[0], cursorCoord[1]);

					onScreenEdge = false;
					
					return;
				}
			} else {
				Cursor.reset();
			}
		} else {
			cursorCoord = [mouseX, mouseY];
		}

		// If there's a screen on the left
		if (screenMap[1][0] !== null) {
			// Check if it's on edge
			if (Cursor.onScreenEdge("w", mouseX, mouseY) && !onScreenEdge) {
				Cursor.reset();
				
				onScreenEdge = true;
			}
		}
	},
	reset: function():void {
		robotjs.moveMouse(restingPlace[0], restingPlace[1]);
	},
	onScreenEdge: function(edge: "n" | "e" | "w" | "s", mouseX: number, mouseY: number) {
		switch (edge) {
			case "n": return mouseY <= 0;
			case "e": return mouseX >= screenSize.width;
			case "w": return mouseX <= 0;
			case "s": return mouseY >= screenSize.height;
		}
	},
	move: function(mouseX: number, mouseY: number) {
		robotjs.moveMouse(mouseX, mouseY);
	}
}
