/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

import * as net from "net";

import portchecker from "../portchecker";

type PasswordTypes = string | number | undefined;
type EventTypes =
    | "server.start"
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
    pos: {
        x: number;
        y: number;
    };
}

interface ServerCallback {
    eventType: EventTypes;
    port?: number;
    host?: string;
    password?: PasswordTypes;
    screenArgs?: ScreenArguments;
    clientId?: string;
    message?: any;
    data?: any;
}

type MessageTypes = "message" | "auth.reject" | "method";
type MethodTypes = "mouse.move";

interface MethodParameters {
    pos?: {
        x: number;
        y: number;
    };
}

interface Message {
    type: MessageTypes;
    message?: any;
    methodType?: MethodTypes;
    methodParams?: MethodParameters;
}

const server = net.createServer();

let sockets: Sockets = {};

let setPassword: PasswordTypes;

let hasStartedServer = false;

class Server {
    connectedUsersTotal = 0; // Total nums of users that has connected to the server (doesn't decrease)
    callback: (event: ServerCallback) => void;

    constructor(callback: (event: ServerCallback) => void) {
        this.callback = callback;
    }

    async start(
        port: number = 4011,
        host: string = "localhost",
        password?: PasswordTypes
    ): Promise<string> {
        if (hasStartedServer) return "Server already started!";

        const isPortClear = await portchecker(port, host);

        if (!isPortClear) return "Address already in use!";

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
            sockets[`${socket.remoteAddress}:${socket.remotePort}`] = {
                socket: socket,
                id: `rinkuclient_${this.connectedUsersTotal}`,
                authorized: false,
            };

            socket.on("data", (data) => {
                const msg = JSON.parse(
                    new TextDecoder().decode(new Uint8Array(data))
                );

                if (msg.type == "auth") {
                    if (setPassword === undefined) {
                        sockets[
                            `${socket.remoteAddress}:${socket.remotePort}`
                        ].authorized = true;

                        this.callback({
                            eventType: "client.connect",
                            screenArgs: msg.extraData,
                        });

                        this.connectedUsersTotal++;
                    } else {
                        if (msg.password === setPassword) {
                            sockets[
                                `${socket.remoteAddress}:${socket.remotePort}`
                            ].authorized = true;

                            this.callback({
                                eventType: "client.connect",
                                screenArgs: msg.extraData,
                            });

                            this.connectedUsersTotal++;
                        } else {
                            socket.write(
                                JSON.stringify({
                                    type: "auth.reject",
                                    reason: "Invalid Password",
                                })
                            );
                        }
                    }
                } else if (msg.type == "message") {
                    this.callback({
                        eventType: "client.message",
                        clientId:
                            sockets[
                                `${socket.remoteAddress}:${socket.remotePort}`
                            ].id,
                        message: msg,
                    });
                } else {
                    this.callback({
                        eventType: "client.data",
                        clientId:
                            sockets[
                                `${socket.remoteAddress}:${socket.remotePort}`
                            ].id,
                        data: msg,
                    });
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

        hasStartedServer = true;

        return "Initiated server start function";
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
    sendMessageToAll(message: Message): string {
        if (!hasStartedServer) return "Server hasn't started yet!";

        for (const addr in sockets) {
            const { socket } = sockets[addr];

            socket.write(
                JSON.stringify({
                    type: "message",
                    message: message,
                })
            );
        }

        return "Sent message!";
    }
    sendMessageToClient(clientId: string, message: Message): string {
        if (!hasStartedServer) return "Server hasn't started yet!";

        for (const addr in sockets) {
            const { socket, id } = sockets[addr];

            if (id == clientId) {
                socket.write(
                    JSON.stringify({
                        type: "message",
                        message: message,
                    })
                );
            }
        }
        return "No clients found attached with the ID provided.";
    }
    sendMethodToClient(
        clientId: string,
        methodType: MethodTypes,
        methodParams: MethodParameters
    ): string {
        if (!hasStartedServer) return "Server hasn't started yet!";

        for (const addr in sockets) {
            const { socket, id } = sockets[addr];

            if (id == clientId) {
                socket.write(
                    JSON.stringify({
                        type: "method",
                        methodType: methodType,
                        methodParams: methodParams,
                    })
                );
            }
        }
    }
}

export { Server, ScreenArguments, Message, MethodTypes, MethodParameters, PasswordTypes };
