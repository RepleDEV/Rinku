/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
/* eslint no-async-promise-executor: 0 */

import * as net from "net";

import portchecker from "../portchecker";
import { ScreenMapArray } from "../screenmap/";
import { ClientMethod, ClientMethodTypes } from "../client";

type PasswordTypes = string | number | undefined;
type EventTypes =
    | "server.start"
    | "server.stop"
    | "client.connect"
    | "client.message"
    | "client.data"
    | "client.disconnect"
    | "client.disconnect.force"
    | "method";

interface Sockets {
    [key: string]: Socket;
}
interface Socket {
    socket: net.Socket;
    id: string;
    authorized: boolean;
}

interface ScreenArguments {
    screen: {
        width: number;
        height: number;
    };
}

interface ServerCallback {
    eventType: EventTypes;
    port?: number;
    host?: string;
    password?: PasswordTypes;
    screenArgs?: ScreenArguments;
    clientId?: string;
    methodType?: ClientMethodTypes;
    methodParams?: MethodParameters;
    data?: any;
}

type ServerMethodTypes =
    | "mouse.move"
    | "screenmap.sync"
    | "auth.reject"
    | "auth.accept"
    | "message.reject";

interface MethodParameters {
    screenMap?: ScreenMapArray;
    pos?: {
        x: number;
        y: number;
    };
    password?: PasswordTypes;
    screenArgs?: ScreenArguments;
}

interface Method {
    methodParams?: MethodParameters;
}

interface ServerMethod extends Method {
    methodType?: ServerMethodTypes;
}

const server = net.createServer();

const sockets: Sockets = {};

let setPassword: PasswordTypes;

let hasStartedServer = false;

class Server {
    connectedUsersTotal = 0; // Total nums of users that has connected to the server (doesn't decrease)
    callback: (event: ServerCallback) => void;

    constructor(callback: (event: ServerCallback) => void) {
        this.callback = callback;
    }

    start(
        port: number = 4011,
        host: string = "localhost",
        password?: PasswordTypes
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (hasStartedServer) return reject("Server already started!");

            const isPortClear = await portchecker(port, host);

            if (!isPortClear) return reject("Address already in use!");

            setPassword = password;

            server.listen(port, host, () => {
                this.callback({
                    eventType: "server.start",
                    port: port,
                    host: host,
                    password: password,
                });
            });

            server.on("connection", (socket) => {
                hasStartedServer = true;

                resolve(
                    `Started server. Password: ${password}, host: ${host}, port: ${port}.`
                );

                sockets[`${socket.remoteAddress}:${socket.remotePort}`] = {
                    socket: socket,
                    id: `rinkuclient_${this.connectedUsersTotal}`,
                    authorized: false,
                };

                socket.on("data", (data) => {
                    const client =
                        sockets[`${socket.remoteAddress}:${socket.remotePort}`];

                    if (!client.authorized) {
                        this.sendMethodToClient(client.id, "message.reject");
                        return;
                    }

                    const queue: Array<string> = [];
                    let decodedMessage = new TextDecoder().decode(
                        new Uint8Array(data)
                    );
                    while (decodedMessage.length > 0) {
                        const length = parseInt(decodedMessage.substring(0, 3));
                        decodedMessage = decodedMessage.substring(3);
                        if (decodedMessage.length > length) {
                            queue.push(decodedMessage.substring(0, length));
                        } else {
                            queue.push(decodedMessage);
                        }
                        decodedMessage = decodedMessage.substring(length);
                        console.log(decodedMessage);
                    }

                    for (let i = 0; i < queue.length; ++i) {
                        const msg: ClientMethod = JSON.parse(queue[i]);
                        if (msg.methodType == "auth") {
                            if (setPassword === undefined) {
                                sockets[
                                    `${socket.remoteAddress}:${socket.remotePort}`
                                ].authorized = true;

                                this.callback({
                                    eventType: "client.connect",
                                    screenArgs: msg.methodParams.screenArgs,
                                    clientId: client.id,
                                });

                                this.sendMethodToClient(
                                    client.id,
                                    "auth.accept"
                                );

                                this.connectedUsersTotal++;
                            } else {
                                if (msg.methodParams.password === setPassword) {
                                    sockets[
                                        `${socket.remoteAddress}:${socket.remotePort}`
                                    ].authorized = true;

                                    this.callback({
                                        eventType: "client.connect",
                                        screenArgs: msg.methodParams.screenArgs,
                                        clientId: client.id,
                                    });

                                    this.sendMethodToClient(
                                        client.id,
                                        "auth.accept"
                                    );

                                    this.connectedUsersTotal++;
                                } else {
                                    this.sendMethodToClient(
                                        client.id,
                                        "auth.reject"
                                    );
                                }
                            }
                        } else {
                            this.callback({
                                eventType: "method",
                                methodType: msg.methodType,
                                methodParams: msg.methodParams,
                                clientId: client.id,
                            });
                        }
                    }
                });

                socket.on("close", () => {
                    this.disconnectClient(socket);
                });

                socket.on("end", () => {
                    this.disconnectClient(socket);
                });

                socket.on("error", (err) => {
                    if (err.message.includes("ECONNRESET")) {
                        for (const addr in sockets) {
                            const { socket: sock } = sockets[addr];

                            if (
                                sock.remoteAddress === socket.remoteAddress &&
                                sock.remotePort === socket.remotePort
                            ) {
                                this.callback({
                                    eventType: "client.disconnect.force",
                                    clientId: sockets[addr].id,
                                });

                                delete sockets[addr];
                            }
                        }
                    }
                });
            });

            server.on("close", () => {
                this.callback({
                    eventType: "server.stop",
                });
            });
        });
    }
    stop(): string {
        if (!hasStartedServer) return "Server hasn't started yet!";

        server.close();

        return "Stopped server!";
    }
    disconnectClient(socket: net.Socket) {
        for (const addr in sockets) {
            const { socket: sock } = sockets[addr];

            if (
                sock.remoteAddress === socket.remoteAddress &&
                sock.remotePort === socket.remotePort
            ) {
                this.callback({
                    eventType: "client.disconnect",
                    clientId: sockets[addr].id,
                });

                delete sockets[addr];
            }
        }
    }
    sendMethodToClient(
        clientId: string,
        methodType: ServerMethodTypes,
        methodParams?: MethodParameters
    ): string {
        if (!hasStartedServer) return "Server hasn't started yet!";

        for (const addr in sockets) {
            const { socket, id } = sockets[addr];

            if (id == clientId) {
                const buf = JSON.stringify({
                    methodType: methodType,
                    methodParams: methodParams,
                });
                let buflen = buf.length.toString();
                while (buflen.length < 3) {
                    buflen = "0" + buflen;
                }
                socket.write(buflen + buf);
            }
        }
    }
}

export {
    Server,
    Method,
    ServerMethod,
    ScreenArguments,
    ServerMethodTypes,
    MethodParameters,
    PasswordTypes,
};
