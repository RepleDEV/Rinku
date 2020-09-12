const wildcard = require("@wildcard-api/client");
const { endpoints } = wildcard;

class Client {
    constructor(port, callback) {
        if (typeof port != "number" || typeof callback != "function")
            throw new Error("ILLEGAL CONSTRUCTOR");

        this.port = port;
        this.callback = callback;
    }
    connect(password) {
        wildcard.serverUrl = `http:/localhost:${this.port}`;
        try {
            const clientId = await endpoints.connect(password);
            return clientId;
        } catch (err) {
            switch (err) {
                case "No Server Connection":
                    return "Can't connect to server."
                
                default:
                    return "An unknown error has occured.\nError message: " + err.message;
            }
        }
    }
}