const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Server = require('./src/modules/server');
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
let server, keyLogger;

function sendMessageToMainWindow(message) {
	if (!domHasLoaded)return "DOM HASN'T LOADED YET!";

	mainWindow.webContents.send("mainWindowMsg", message);

	return "Sent message!";
}

ipcMain.handle("mainWindow", async (e, ...args) => {
	var method = args[0];

	if (typeof method != "string")return new Error("METHOD PARAMETER MUST BE OF STRING TYPE");
	method = method.toLowerCase();

	switch (method) {
		case "startkeylog":
			keyLogger = new KeyLogger(keyLoggerCallback);
			return keyLogger.start();
		case "stopkeylog":
			return keyLogger.stop();
		case "startserver":
			server = new Server({id: "rinku_ipc_server", networkPort: 3101}, serverCallback);
			return server.start();
		case "stopserver":
			return server.stop();
		case "help":
			return (
				"Main Process Methods: \n\n" +
				"startKeyLog => Start keylogger\n" +
				"stopKeylog => Stop keylogger\n" +
				"startServer => Start IPC server\n" +
				"stopServer => Stop IPC server\n" +
				"help => This help message\n\n" +
				"All methods are case insensitive. Thank You!"
			);
		default:
			return "Unknown Method. For all available methods: send the method \"help\"";
	}
});

function serverCallback(...args) {
	console.log(args);
}
function keyLoggerCallback(...args) {
	sendMessageToMainWindow(args);
}