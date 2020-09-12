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
    constructor(serverId, port, callback) {
        if (typeof serverId != "string" || serverId.length == 0) 
            throw new Error("INVALID SERVER ID PARAMETER");
        
        if (typeof options != "object" || typeof callback != "function") 
            throw new Error("INVALID CONSTRUCTOR PARAMETERS");
        
        var isPortAvailable = await portchecker(port);
        if (isPortAvailable) {
            ipc.config.id = serverId;
            ipc.config.networkPort = port;
            ipc.config.stopRetrying = 0;

            this.options = options;
            this.callback = callback;
            this.serverId = serverId;
        } else {
            throw new Error("PORT ALREADY IN USE!");
        }
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

        return "Server has started";
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