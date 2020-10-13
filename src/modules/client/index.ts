/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

import * as net from "net";

type EventTypes =
    | "client.connect"
    | "client.disconnect"
    | "client.error"
    | "auth.reject"
    | "auth.accept"
    | "message"
    | "method";

type MethodTypes = "mouse.move";

interface ClientCallback {
    eventType: EventTypes;
    message?: any;
    reason?: string;
    error?: any;
    method?: MethodTypes;
    methodParams?: { [key: string]: any };
}

class Client {
    #client = new net.Socket();

    #hasConnected = false;

    callback: (event: ClientCallback) => void;

    constructor(callback: (event: ClientCallback) => void) {
        this.callback = callback;
    }
    connect(
        port: number,
        host: string = "localhost",
        password?: string | undefined,
        extraData?: any
    ): Promise<string> {
        return new Promise((resolve) => {
            this.#client.connect(port, host, () => {
                this.callback({
                    eventType: "client.connect",
                });

                resolve("Connected!");

                this.#client.write(
                    JSON.stringify({
                        type: "auth",
                        password: password,
                        extraData: extraData,
                    })
                );
            });

            this.#client.on("data", (data) => {
                const msg = JSON.parse(
                    new TextDecoder().decode(new Uint8Array(data))
                );

                switch (msg.type) {
                    case "auth.reject":
                        this.callback(msg);
                        break;
                    case "method":
                        this.callback({
                            eventType: "method",
                            method: msg.methodType,
                            methodParams: msg.params,
                        });
                        break;
                    default:
                        break;
                }
            });

            this.#client.on("error", (err) => {
                if (err.message.includes("ECONNRESET"))
                    this.callback({
                        eventType: "client.disconnect",
                        reason: "Lost connection / Forcefully Disconnected",
                    });
                else if (err.message.includes("ECONNREFUSED"))
                    this.callback({
                        eventType: "client.error",
                        error: "ECONNREFUSED: No connection found",
                    });
            });

            this.#client.on("end", () => {
                this.callback({
                    eventType: "client.disconnect",
                    reason: "Ended connection by server / client",
                });
            });
        });
    }
    disconnect(): string {
        if (this.#hasConnected) return "Haven't connected to server yet!";

        this.#client.end();

        return "Disconnected";
    }
    retryAuth(password: string): void {
        this.#client.write(
            JSON.stringify({
                type: "auth",
                password: password,
            })
        );
    }
    sendMessage(message: any): string {
        if (this.#hasConnected) return "Haven't connected to server yet!";

        this.#client.write(
            JSON.stringify({
                method: "message",
                message: message,
            })
        );

        return "Sent message!";
    }
}

export = Client;
