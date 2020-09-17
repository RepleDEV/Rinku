// IPC Client Module
const ipc = require('node-ipc');

class Client {
    serverId = "rinku_ipc_server";

    #hasConnectedToServer = false;
    /**
     * Node-ipc Client Class Constructor
     * @param {String} clientId Client Name
     * @param {String | Function} host Hostname
     * @param {Function} callback Callback when there's an event
     */
    constructor(clientId, host, callback) {
        if (typeof clientId != "string" || !clientId.length) 
            throw new Error("INVALID CLIENT ID PARAMETER");
        if (typeof host == "function")
            callback = host;
        if (typeof host != "function" && typeof callback != "function") 
            throw new Error("CALLBACK FUNCTION NOT PROVIDED");

        ipc.config.id = clientId;
        // If host is a string and also has length, return host, otherwise return localhost
        ipc.config.networkHost = typeof host == "string" && host.length > 0 ? host : "localhost";
        ipc.config.networkPort = 3011;
        ipc.config.stopRetrying = true;

        console.log(ipc.config.networkHost);

        this.clientId = clientId;
        this.host = host;
        this.callback = callback;
    }
    connect() {
        return new Promise((resolve, reject) => {
            ipc.connectTo(this.serverId, () => {
                ipc.of[this.serverId].on("connect", () => {
                    this.#hasConnectedToServer = true;
                    resolve("Connected to server");
                });
                ipc.of[this.serverId].on("message", message => {
                    this.callback(
                        {
                            eventType: "message",
                            message: message
                        }
                    )
                });
                ipc.of[this.serverId].on("disconnect", () => {
                    this.callback(
                        {
                            eventType: "disconnect",
                            message: `Disconnected from: ${this.serverId}`
                        }
                    );
                });
                ipc.of[this.serverId].on("error", err => {
                    this.callback(
                        {
                            eventType: "error",
                            err: err
                        }
                    );
                });
            });
        });
    }
    disconnect() {
        if (!this.#hasConnectedToServer)
            return "Not connected to server!";
        ipc.disconnect(this.serverId);
        return "Disconnected from server";
    }
    emit(message) {
        if (!this.#hasConnectedToServer)
            return "Not connected to server!";
        
        ipc.of[this.serverId].emit("message", message);
        return "Sent message!";
    }
}

module.exports = Client;