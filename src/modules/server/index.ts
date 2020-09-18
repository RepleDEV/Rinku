import * as net from "net";

interface Sockets {
    [key: string]: Socket
}
interface Socket {
    socket: net.Socket,
    id: string,
    authorized: boolean,
    extraData: any
}

class Server {
    #server: net.Server = net.createServer();
    #sockets: Sockets = {};

    #setPassword: string | number;

    #hasStartedServer: boolean = false;

    connectedUsers: number = 0;
    callback: Function;
    constructor(callback: Function) {
        this.callback = callback;
    }
    start(port: number, host: string = "localhost", password?: string | number) {
        if (this.#hasStartedServer)
            return "Server already started!";

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
                    if (msg.password === this.#setPassword) {
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].authorized = true;
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].extraData  = msg.extraData
                    } else {
                        socket.write("Invalid Password");
                        socket.end();
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