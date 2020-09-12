const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Server = require('./src/modules/IPC/server');
const Client = require('./src/modules/IPC/client');
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
		// Set domIsLoaded to true
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
let server = {};
let client = {};
let keylogger;

function sendMessageToMainWindow(message) {
	if (!domHasLoaded)return "DOM HASN'T LOADED YET!";

	mainWindow.webContents.send("mainWindowMsg", message);

	return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
	var method = args[0];
	var extraArgs = args[1];

	if (typeof method != "string")
		return new Error("METHOD PARAMETER MUST BE OF STRING TYPE");

	return await ipcMethods.exec(method);
});

const ipcMethods = {
	IPC: {
		server: {
			start: function(serverId, options, callback) {
				server.ipc = new Server(serverId, options, callback);
				return server.ipc.start();
			},
			stop: function() {
				return server.ipc.stop();
			},
			sendMessage: function(message) {
				return server.ipc.emit(message);
			}
		},
		client: {
			start: function() {
				client.ipc = new Client(serverId, clientId, options, callback);
				return await client.ipc.connect();
			},
			disconnect: function() {
				return client.ipc.disconnect();
			},
			sendMessage: function(message) {
				return client.ipc.emit(message);
			}
		}
	},
	RPC: {
		server: {

		},
		client: {

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
	/**
	 * Execute method. STRING SENSITIVE!!!
	 * @param {string} methodstr Method to execute
	 */
	exec: async function(methodstr) {
		const methods = methodstr.split(":");

		var currentMethod = ipcMethods;
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			if (currentMethod[method] === undefined)return "Unknown Method";
			else if (typeof currentMethod[method] == "function")return await currentMethod[method];
			currentMethod = currentMethod[method];
		}
	}
}

/**
 * Start IPC server.
 * @param {string} serverId ID of server.
 * @param {number} port Port number. Defaults to 3100.
 * @param {string} host Host name. Defaults to localhost.
 * @param {object} extraOptions Extra options for ipc configuration.
 * @param {function} callback Callback function.
 */
async function startServer(serverId, port, host, extraOptions, callback) {
	if (!serverId.length || typeof serverId != "string")return new Error("INVALID SERVER ID PARAMETER");

	port = port || 3100;
	host = host || "localhost";
	extraOptions = extraOptions || {};

	// Check port availability
	const portchecker = require('./src/modules/portchecker');
	await portchecker(port, host);


	server = new Server(serverId, {networkPort: port, ...extraOptions}, callback);
	return server.start();
}

function serverCallback(...args) {
	sendMessageToMainWindow(args);
}
function keyLoggerCallback(...args) {
	sendMessageToMainWindow(args);
}
function clientCallback(...args) {
	sendMessageToMainWindow(args);
}