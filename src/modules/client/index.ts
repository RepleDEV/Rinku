import * as net from "net";

interface ClientCallback {
    eventType: string,
    [key: string]: any
}

class Client {
    #client = new net.Socket();

    #hasConnected: boolean = false;

    callback: Function;
    constructor(callback: (event: ClientCallback) => void) {
        this.callback = callback;
    }
    connect(port: number, host: string = "localhost", password?: string | undefined, extraData?: any): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                this.#client.connect(port, host, () => {
                    this.callback({
                        eventType: "client.connect"
                    });
                    resolve("Connected!");
    
                    this.#client.write(JSON.stringify({
                        method: "auth",
                        password: password,
                        extraData: extraData
                    }));
                });
    
                this.#client.on("data", data => {
                    console.log(new TextDecoder().decode(new Uint8Array(data)));
                });
            } catch (error) {
                reject(error);
            }
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