/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

import * as net from "net";

import {
    ScreenArguments,
    Method,
    ServerMethod,
    ServerMethodTypes,
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
    reason?: string;
    error?: any;
    method?: ServerMethodTypes;
    methodParams?: MethodParameters;
}

type ClientMethodTypes = "screenmap.sync" | "auth" | "setscreen";

interface ClientMethod extends Method {
    methodType?: ClientMethodTypes
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

                this.sendMethod("auth", {password: password, screenArgs: screenArgs});

                hasConnected = true;
            });
            
            client.on("data", (data) => {
                const queue: Array<string> = [];
                const decodedMessage = new TextDecoder().decode(new Uint8Array(data)).split("");
                console.log(new TextDecoder().decode(new Uint8Array(data)));
                while (decodedMessage.length > 0) {
                    const length = parseInt(decodedMessage.splice(0, 3).join(""));
                    queue.push(decodedMessage.splice(0, length).join(""));
                }

                console.log(queue);

                for (let i = 0;i < queue.length;++i) {
                    const msg: ServerMethod = JSON.parse(queue[i]);
                    switch (msg.methodType) {
                        case "auth.reject":
                            this.callback({
                                eventType: "auth.reject",
                            });
                            break;
                        case "auth.accept":
                            this.callback({
                                eventType: "auth.accept"
                            });
                            break;
                        default:
                            this.callback({
                                eventType: "method",
                                method: msg.methodType,
                                methodParams: msg.methodParams,
                            });
                            break;
                    }
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
        this.sendMethod("auth", {password: password});
    }
    sendMethod(methodType: ClientMethodTypes, methodParams: MethodParameters) {
        const buf = JSON.stringify({
            methodType: methodType,
            methodParams: methodParams
        });
        let buflen = buf.length.toString();
        while (buflen.length < 3){
            buflen = "0" + buflen;
        }
        client.write(buflen + buf)
    }
}

export { Client, ClientMethod, ClientMethodTypes };
