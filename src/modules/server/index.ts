import * as net from "net";

import portchecker = require('../portchecker');

interface Sockets {
    [key: string]: Socket
}
interface Socket {
    socket: net.Socket,
    id: string,
    authorized: boolean,
    extraData: any
}

interface ServerCallback {
    eventType: string,
    [key: string]: any
}

class Server {
    #server: net.Server = net.createServer();
    #sockets: Sockets = {};

    #setPassword: string | number | undefined;

    #hasStartedServer: boolean = false;

    connectedUsers: number = 0;
    callback: Function;
    constructor(callback: (event: ServerCallback) => void) {
        this.callback = callback;
    }
    async start(port: number = 3011, host: string = "localhost", password?: string | number | undefined) {
        if (this.#hasStartedServer)
            return "Server already started!";

        const isPortClear = await portchecker(port, host);

        if (!isPortClear)
            return "Address already in use!";

        this.#setPassword = password;

        this.#server.listen(port, host, () => {
            this.callback({
                eventType: "server.start",
                port: port,
                host: host,
                password: password
            });
        });

        this.#server.on("connection", socket => {
            this.callback({
                eventType: "client.connect"
            });

            this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`] = {
                socket: socket,
                id: `rinkuclient_${this.connectedUsers}`,
                authorized: false,
                extraData: {}
            };

            socket.on("data", data => {
                const msg = JSON.parse(new TextDecoder().decode(new Uint8Array(data)));

                if (msg.method == "auth") {
                    if (this.#setPassword === undefined) {
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].authorized = true;
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].extraData  = msg.extraData
                    } else {
                        if (msg.password === undefined) {
                            socket.write("Password unprovided");
                        } else if (msg.password === this.#setPassword) {
                            this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].authorized = true;
                            this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].extraData  = msg.extraData
                        } else {
                            socket.write("Invalid Password");
                        }
                    }
                }

                this.callback({
                    eventType: "message",
                    message: msg
                });
            });

            socket.on("close", () => {
                for (var addr in this.#sockets) {
                    const { socket: sock } = this.#sockets[addr];

                    if (sock.remoteAddress === socket.remoteAddress && sock.remotePort === socket.remotePort) 
                        delete this.#sockets[addr];
                }
            });
        });

        this.#hasStartedServer = true;

        return "Started server!";
    }
    stop() {
        if (!this.#hasStartedServer)
            return "Server hasn't started yet!";
        
        this.#server.close();

        return "Stopped server!";
    }
    sendMessageToAll(message: any) {
        if (!this.#hasStartedServer)
            return "Server hasn't started yet!";
        
        for (var addr in this.#sockets) {
            const { socket } = this.#sockets[addr];
            socket.write(JSON.stringify({
                method: "message",
                message: message
            }));
        }
        
        return "Sent message!";
    }
}

export = Server;