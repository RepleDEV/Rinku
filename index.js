const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const IPCServer = require('./src/modules/IPC/server');
const IPCClient = require('./src/modules/IPC/client');

const RPCServer = require('./src/modules/RPC/server');
const RPCClient = require('./src/modules/RPC/client');

const KeyLogger = require('./src/modules/keylogger');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let domHasLoaded = false;

// Main Window
let mainWindow;

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
	mainWindow.menuBarVisible = false;

	// Maximize window
	mainWindow.maximize();

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
let rpcserver;
let ipcserver;

let rpcclient;
let ipcclient;

let keylogger;

function sendMessageToMainWindow(message) {
	if (!domHasLoaded)return "DOM HASN'T LOADED YET!";

	mainWindow.webContents.send("mainWindowMsg", message);

	return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
	return await ipcMethods.exec(args);
});

const ipcMethods = {
	IPC: {
		server: {
			start: async function() {
				ipcserver = new IPCServer(sendMessageToMainWindow);
				return await ipcserver.start();
			},
			stop: function() {
				return ipcserver.stop();
			},
			sendMessage: function(message) {
				return ipcserver.emit(message);
			}
		},
		client: {
			connect: async function(clientId) {
				ipcclient = new IPCClient(clientId, sendMessageToMainWindow);
				return await ipcclient.connect();
			},
			disconnect: function() {
				return ipcclient.disconnect();
			},
			sendMessage: function(message) {
				return ipcclient.emit(message);
			}
		}
	},
	RPC: {
		server: {
			start: async function(password) {
				rpcserver = new RPCServer();
				return await rpcserver.start(password);
			},
			stop: function() {
				return rpcserver.stop();
			}
		},
		client: {
			connect: async function(password, host) {
				rpcclient = new RPCClient();
				return await rpcclient.connect(password, host);
			}
		}
	},
	keyLogger: {
		start: function() {
			keylogger = new KeyLogger(keyLoggerCallback);
			return keylogger.start();
		},
		stop: function() {
			return keylogger.stop();
		}
	},
	exec: async function(args) {
		const method = args[0];
		const extraArgs = args[1];

		switch (method) {
			case "start servers":
				await this.IPC.server.start();
				await this.RPC.server.start(extraArgs[0]);
				return "Servers have started";
			case "connect to server":
				const client_id = await this.RPC.client.connect(extraArgs[0], extraArgs[1]);
				// if (client_id == "Invalid Password") {
				// 	return "Invalid Password";
				// } else {
				// 	return await this.IPC.client.connect(client_id);
				// }
				return client_id;
			case "send message":
				return this.IPC.client.sendMessage(extraArgs[0]);
			default:
				return "Unknown Method. Better luck next time ¯\\_(ツ)_/¯";
		}
	}
}