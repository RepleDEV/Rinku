"use strict";
const bindings = require("bindings");
const winmanager = bindings("rinku_winmanager");
class WinManager {
    constructor() { }
    storeActiveWindow() {
        return winmanager.storeActiveWindow();
    }
    activateStoredWindow() {
        return winmanager.activateStoredWindow();
    }
    getActiveWindowTitle() {
        return winmanager.getCurrentActiveWindowTitle();
    }
    checkStoredWindow() {
        return winmanager.checkStoredWindow();
    }
}
module.exports = winmanager;
