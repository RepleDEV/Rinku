import * as net from "net";

class Client {
    #client = new net.Socket();

    #hasConnected: boolean = false;

    callback: Function;
    constructor(callback: Function) {
        this.callback = callback;
    }
    connect(clientId: string, port: number, host: string = "localhost", password?: string) {
        return new Promise((resolve, reject) => {
            this.#client.connect(port, host, () => {
                this.callback({
                    eventType: "client.connect"
                });
                resolve("Connected!");

                this.#client.write(JSON.stringify({
                    method: "auth",
                    password: password,
                    id: clientId
                }));
            });
            this.#client.on("data", data => {
                console.log(data);
            });
        });
    }
    disconnect() {
        if (this.#hasConnected)
            return "Haven't connected to server yet!";

        this.#client.end();

        return "Disconnected";
    }
    sendMessage(message: string) {
        if (this.#hasConnected)
            return "Haven't connected to server yet!";

        this.#client.write(JSON.stringify({
            method: "message",
            message: message
        }));

        return "Sent message!";
    }
}

export = Client;