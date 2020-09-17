// IPC Server Module
const ipc = require('node-ipc');
const portchecker = require('../../portchecker');

/**
 * IPC Server class
 */
class Server {
    #hasStartedServer = false;
    /**
     * Server Constructor
     * @param {string} host Hostname. Usually local IP
     * @param {function} callback Callback function when there's a message
     */
    constructor(host = "localhost", callback) {
        if (typeof callback != "function")
            throw new Error("Callback function provided.");

        ipc.config.logger = log => {
            callback(
                {
                    eventType: "IPCLog",
                    log: log
                }
            );
        };

        this.callback = callback;
        this.host = host;
    }
    /**
     * Start said server
     */
    async start() {
        if (this.#hasStartedServer)
            return "Server already started";

        ipc.config.id = `rinku_ipc_server`;
        ipc.config.stopRetrying = true;
        ipc.serveNet(this.host, 3011, () => {
            ipc.server.on("message", message => {
                this.callback(
                    {
                        eventType: "message",
                        message: message
                    }
                );
            });
            ipc.server.on("socket.disconnected", (socket, clientId) => {
                this.callback(
                    {
                        eventType: "client.disconnect",
                        clientId: clientId
                    }
                );
            });
            ipc.server.on("connect", () => {
                this.callback(
                    {
                        eventType: "client.connect"
                    }
                );
            });
        });

        this.#hasStartedServer = true;
        ipc.server.start();

        return `Server has started on port: 3011!`;
    }
    stop() {
        if (!this.#hasStartedServer)
            return "Server has not started yet.";

        ipc.server.stop();
        return "Server has been stopped";
    }
    /**
     * Send (emit) a message to the server
     * @param {any} message Message to send
     */
    emit(message) {
        if (!this.#hasStartedServer)
            return "Server has not started yet!";
        
        ipc.server.emit({
            address: ipc.config.networkHost,
            port: ipc.config.networkPort
        }, message);

        return `Message sent to address: http://localhost:${ipc.config.networkPort}.`;
    }
}

module.exports = Server;