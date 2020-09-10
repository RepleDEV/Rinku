const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const iohook = require('iohook');
const Server = require('./src/modules/server');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let domIsLoaded = false;

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
		domIsLoaded = true;
	});
};

const startBackgroundWorker = () => {
	// Create the window
	backgroundWorker = new BrowserWindow({
		alwaysOnTop: true,
		movable: false,
		skipTaskbar: false,
		webPreferences: {
			nodeIntegration: true,
			backgroundThrottling: true
		}
	});

	// Fixes Node fs issues as seen here https://github.com/electron/electron/issues/22119
	app.allowRendererProcessReuse = false;

	backgroundWorker.focus();

	backgroundWorker.setAlwaysOnTop(true, "floating");

	backgroundWorker.isAlwaysOnTop(true);

	backgroundWorker.loadFile(path.join(__dirname, "src/worker.html"));
}

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
let server;

ipcMain.handle("mainWindow", async (e, ...args) => {
	const method = args[0];

	var returnMessage = "";

	switch (method) {
		case "startKeylog":
			keyLogger.start();
			break;
		case "startServer":
			server = new Server({id: "rinku_ipc_server", networkPort: 3101}, serverCallback);
			returnMessage = server.start();
			break;
		case "stopServer":
			returnMessage = server.stop();
		default:
			returnMessage = "Unknown Method"
			break;
	}
	return returnMessage;
});

function serverCallback(...args) {
	console.log(args);
}

function sendMessageToMainWindow(message) {
	if (!domIsLoaded)return "DOM HASN'T LOADED YET!";

	mainWindow.webContents.send("mainWindowMsg", message);

	return 1;
}

const keyLogger = {
	initialized: false,
	initialize: function() {
		iohook.on("keydown", e => {
			sendMessageToMainWindow({
				type: "keyEvent",
				keyEvent: e.type,
				keycode: e.rawcode,
				altKey: e.altKey,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
			});
		});
		iohook.on("keyup", e => {
			sendMessageToMainWindow({
				type: "keyEvent",
				keyEvent: e.type,
				keycode: e.rawcode,
				altKey: e.altKey,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
			});
		});
		this.initialize = true;
		return;
	},
	start: function() {
		if (this.initialized)iohook.start();
		else {
			this.initialize();
			iohook.start();
		}
		return;
	},
	stop: function() {
		if (this.initialized)iohook.stop();
		this.initialized = false;
		return;
	}
}