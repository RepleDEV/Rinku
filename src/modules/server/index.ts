import * as net from "net";

import portchecker from "../portchecker";

type PasswordTypes = string | number | undefined;
type EventTypes =
    | "server.start"
    | "client.connect"
    | "client.message"
    | "client.data"
    | "client.disconnect"
    | "client.disconnect.force";

interface Sockets {
    [key: string]: Socket;
}
interface Socket {
    socket: net.Socket;
    id: string;
    authorized: boolean;
}

interface ServerCallback {
    eventType: EventTypes;
    port?: number;
    host?: string;
    password?: PasswordTypes;
    extraData?: any;
    clientId?: string;
    message?: any;
    data?: any;
}

class Server {
    #server: net.Server = net.createServer();
    #sockets: Sockets = {};

    #setPassword: PasswordTypes;

    #hasStartedServer = false;

    connectedUsersTotal = 0; // Total nums of users that has connected to the server (doesn't decrease)
    callback: (event: ServerCallback) => void;

    constructor(callback: (event: ServerCallback) => void) {
        this.callback = callback;
    }

    async start(
        port: number = 3011,
        host: string = "localhost",
        password?: PasswordTypes
    ): Promise<string> {
        if (this.#hasStartedServer) return "Server already started!";

        const isPortClear = await portchecker(port, host);

        if (!isPortClear) return "Address already in use!";

        this.#setPassword = password;

        this.#server.listen(port, host, () => {
            this.callback({
                eventType: "server.start",
                port: port,
                host: host,
                password: password,
            });
        });

        this.#server.on("connection", (socket) => {
            this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`] = {
                socket: socket,
                id: `rinkuclient_${this.connectedUsersTotal}`,
                authorized: false,
            };

            socket.on("data", (data) => {
                const msg = JSON.parse(
                    new TextDecoder().decode(new Uint8Array(data))
                );

                if (msg.type == "auth") {
                    if (this.#setPassword === undefined) {
                        this.#sockets[
                            `${socket.remoteAddress}:${socket.remotePort}`
                        ].authorized = true;

                        this.callback({
                            eventType: "client.connect",
                            extraData: msg.extraData,
                        });

                        this.connectedUsersTotal++;
                    } else {
                        if (msg.password === undefined) {
                            socket.write("Password unprovided");
                        } else if (msg.password === this.#setPassword) {
                            this.#sockets[
                                `${socket.remoteAddress}:${socket.remotePort}`
                            ].authorized = true;

                            this.callback({
                                eventType: "client.connect",
                                extraData: msg.extraData,
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
                        clientId: this.#sockets[
                            `${socket.remoteAddress}:${socket.remotePort}`
                        ].id,
                        message: msg,
                    });
                } else {
                    this.callback({
                        eventType: "client.data",
                        clientId: this.#sockets[
                            `${socket.remoteAddress}:${socket.remotePort}`
                        ].id,
                        data: msg,
                    });
                }
            });

            socket.on("close", () => {
                for (const addr in this.#sockets) {
                    const { socket: sock } = this.#sockets[addr];

                    if (
                        sock.remoteAddress === socket.remoteAddress &&
                        sock.remotePort === socket.remotePort
                    ) {
                        this.callback({
                            eventType: "client.disconnect",
                            clientId: this.#sockets[addr].id,
                        });

                        delete this.#sockets[addr];
                    }
                }
            });

            socket.on("error", (err) => {
                if (err.message.includes("ECONNRESET")) {
                    for (const addr in this.#sockets) {
                        const { socket: sock } = this.#sockets[addr];

                        if (
                            sock.remoteAddress === socket.remoteAddress &&
                            sock.remotePort === socket.remotePort
                        ) {
                            this.callback({
                                eventType: "client.disconnect.force",
                                clientId: this.#sockets[addr].id,
                            });

                            delete this.#sockets[addr];
                        }
                    }
                }
            });
        });

        this.#hasStartedServer = true;

        return "Initiated server start function";
    }
    stop(): string {
        if (!this.#hasStartedServer) return "Server hasn't started yet!";

        this.#server.close();

        return "Stopped server!";
    }
    sendMessageToAll(message: any): string {
        if (!this.#hasStartedServer) return "Server hasn't started yet!";

        for (const addr in this.#sockets) {
            const { socket } = this.#sockets[addr];

            socket.write(
                JSON.stringify({
                    type: "message",
                    message: message,
                })
            );
        }

        return "Sent message!";
    }
    sendMessageToClient(clientId: string, message: any): string {
        if (!this.#hasStartedServer) return "Server hasn't started yet!";

        for (const addr in this.#sockets) {
            const { socket, id } = this.#sockets[addr];

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
}

export = Server;
