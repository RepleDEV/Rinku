import bindings = require("bindings");

const winmanager = bindings("rinku_winmanager");

class WinManager {
    constructor() { }
    storeActiveWindow(): String {
        return winmanager.storeActiveWindow();
    }
    activateStoredWindow(): String {
        return winmanager.activateStoredWindow();
    }
    getActiveWindowTitle(): String {
        return winmanager.getCurrentActiveWindowTitle();
    }
    checkStoredWindow(): String {
        return winmanager.checkStoredWindow();
    }
}

export = WinManager;