import * as net from "net";

interface ClientCallback {
    eventType: string,
    message?: any
    reason?: string,
    error?: any
}

class Client {
    #client = new net.Socket();

    #hasConnected: boolean = false;

    callback: (event: ClientCallback) => void;
    constructor(callback: (event: ClientCallback) => void) {
        this.callback = callback;
    }
    connect(port: number, host: string = "localhost", password?: string | undefined, extraData?: any): Promise<string> {
        return new Promise((resolve, reject) => {
            this.#client.connect(port, host, () => {
                this.callback({
                    eventType: "client.connect"
                });
                
                resolve("Connected!");

                this.#client.write(JSON.stringify({
                    type: "auth",
                    password: password,
                    extraData: extraData
                }));
            });

            this.#client.on("data", data => {
                const msg = JSON.parse(new TextDecoder().decode(new Uint8Array(data)));

                if (msg.type == "auth.reject") {
                    if (msg.reason == "Invalid Password") {
                        this.callback({
                            eventType: "auth.reject",
                            reason: "Invalid Password"
                        });
                    }
                } else {
                    this.callback({
                        eventType: "message",
                        message: msg.message
                    });
                }
            });

            this.#client.on("error", err => {
                if (err.message.includes("ECONNRESET"))
                    this.callback({
                        eventType: "client.disconnect",
                        reason: "Lost connection / Forcefully Disconnected"
                    });
                else if (err.message.includes("ECONNREFUSED")) 
                    this.callback({
                        eventType: "client.error",
                        error: "ECONNREFUSED: No connection found"
                    });
            });

            this.#client.on("end", () => {
                this.callback({
                    eventType: "client.disconnect",
                    reason: "Ended connection by server / client"
                });
            });
        });
    }
    disconnect() {
        if (this.#hasConnected)
            return "Haven't connected to server yet!";

        this.#client.end();

        return "Disconnected";
    }
    retryAuth(password: string) {
        this.#client.write(JSON.stringify({
            type: "auth",
            password: password
        }));
    }
    sendMessage(message: any) {
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