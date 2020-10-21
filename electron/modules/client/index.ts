/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

import * as net from "net";

import {
    ScreenArguments,
    Message,
    MethodTypes,
    MethodParameters,
    PasswordTypes,
} from "../server";

type EventTypes =
    | "client.connect"
    | "client.disconnect"
    | "client.error"
    | "auth.reject"
    | "auth.accept"
    | "message"
    | "method";

interface ClientCallback {
    eventType: EventTypes;
    message?: any;
    reason?: string;
    error?: any;
    method?: MethodTypes;
    methodParams?: MethodParameters;
}

const client = new net.Socket();

let hasConnected = false;

class Client {
    callback: (event: ClientCallback) => void;

    constructor(callback: (event: ClientCallback) => void) {
        this.callback = callback;
    }
    connect(
        port: number,
        host: string = "localhost",
        password: PasswordTypes,
        screenArgs: ScreenArguments
    ): Promise<string> {
        return new Promise((resolve) => {
            client.connect(port, host, () => {
                this.callback({
                    eventType: "client.connect",
                });

                resolve("Connected!");

                client.write(
                    JSON.stringify({
                        type: "auth",
                        password: password,
                        screenArgs: screenArgs,
                    })
                );

                hasConnected = true;
            });

            client.on("data", (data) => {
                const msg: Message = JSON.parse(
                    new TextDecoder().decode(new Uint8Array(data))
                );

                switch (msg.type) {
                    case "auth.reject":
                        this.callback({
                            eventType: "auth.reject",
                        });
                        break;
                    case "method":
                        this.callback({
                            eventType: "method",
                            method: msg.methodType,
                            methodParams: msg.methodParams,
                        });
                        break;
                    default:
                        break;
                }
            });

            client.on("error", (err) => {
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

            client.on("end", () => {
                this.callback({
                    eventType: "client.disconnect",
                    reason: "Ended connection by server / client",
                });

                hasConnected = false;
            });

            client.on("close", () => {
                this.callback({
                    eventType: "client.disconnect",
                    reason: "Closed connection by server / client",
                });

                hasConnected = false;
            });
        });
    }
    disconnect(): string {
        if (hasConnected) return "Haven't connected to server yet!";

        client.end();

        return "Disconnected";
    }
    retryAuth(password: PasswordTypes): void {
        client.write(
            JSON.stringify({
                type: "auth",
                password: password,
            })
        );
    }
    sendMessage(message: any): string {
        if (hasConnected) return "Haven't connected to server yet!";

        client.write(
            JSON.stringify({
                method: "message",
                message: message,
            })
        );

        return "Sent message!";
    }
}

export { Client };
