// IPC Server Module
const ipc = require('node-ipc');

/**
 * IPC Server class
 */
class Server {
    #hasStartedServer = false;
    /**
     * Server Constructor
     * @param {object} options IPC Server Configuration
     * @param {function} callback Callback function when there's a message
     */
    constructor(options, callback) {
        if (typeof options != "object" || typeof callback != "function") {
            throw new Error("INVALID CONSTRUCTOR PARAMETER");
        }
        
        for (var option in options) {
            ipc.config[option] = options[option];
        }

        this.options = options;
        this.callback = callback;
    }
    /**
     * Start said server
     */
    start() {
        ipc.serve(() => {
            ipc.server.on("message", this.callback);
        });
        this.#hasStartedServer = true;
        ipc.server.start();
        return "Server has started";
    }
    stop() {
        if (!this.#hasStartedServer) {
            return "Server has not started yet.";
        }

        ipc.server.stop();

        return "Server has been stopped";
    }
    /**
     * Send (emit) a message to the server
     * @param {any} message Message to send
     */
    emit(message) {
        if (!this.#hasStartedServer) {
            return "Server has not started yet."
        }
        
        ipc.server.emit({
            address: ipc.config.networkHost,
            port: ipc.config.networkPort
        }, message);

        return `Message sent to address: http://${ipc.config.networkHost}:${ipc.config.networkPort}.`;
    }
}

module.exports = Server;