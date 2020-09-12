// IPC Client Module
const ipc = require('node-ipc');

class Client {
    #hasConnectedToServer = false;
    constructor(serverId, clientId, options, callback) {
        if (typeof serverId != "string" || !serverId.length)
            throw new Error("INVALID SERVER ID PARAMETER");
        if (typeof clientId != "string" || !clientId.length) 
            throw new Error("INVALID CLIENT ID PARAMETER");
        if (typeof options != "object")
            options = {};
        if (typeof callback != "function") 
            throw new Error("CALLBACK PARAMETER IS NOT A FUNCTION")
        

        ipc.config.id = clientId;
        for (var option in options) {
            if (option == "id")continue;
            ipc.config[option] = options[option];
        }

        this.options = options;
        this.callback = callback;
        this.serverId = serverId;
        this.clientId = clientId;
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
                })
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