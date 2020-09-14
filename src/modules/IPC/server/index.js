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
     * @param {string} serverId Name of server to start
     * @param {object} options IPC Server Configuration
     * @param {function} callback Callback function when there's a message
     */
    constructor(callback) {
        if (typeof callback != "function")
            throw new Error("Callback function provided.");
        
        var port = 3011;

        var isPortAvailable = await portchecker(port);
        while (!isPortAvailable) {
            port += 10;
            isPortAvailable = await portchecker(port);
        }

        ipc.config.id = `rinku_ipc_server:${port}`;
        ipc.config.stopRetrying = 1;
        ipc.config.networkPort = port;

        this.callback = callback;
    }
    /**
     * Start said server
     */
    start() {
        if (this.#hasStartedServer)return "Server already started";
        ipc.serve(() => {
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
        });

        this.#hasStartedServer = true;
        ipc.server.start();

        return `Server has started on port: ${this.port}!`;
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
        
        ipc.server.emit(
            {
                address: ipc.config.networkHost,
                port: ipc.config.networkPort
            }, message);

        return `Message sent to address: http://${ipc.config.networkHost}:${ipc.config.networkPort}.`;
    }
}

module.exports = Server;