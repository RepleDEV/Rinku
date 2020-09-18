import * as net from "net";

interface Sockets {
    [key: string]:any
}

class Server {
    #server = net.createServer();
    #sockets: Sockets = {};

    #setPassword: string | number;

    #hasStartedServer: boolean = false;

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
                eventType: "server.start"
            });
        });

        this.#server.on("connection", socket => {
            this.callback({
                eventType: "client.connect"
            });

            this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`] = {
                socket: socket,
                id: undefined,
                authorized: false,
                extraData: {}
            };

            socket.on("data", data => {
                const msg = JSON.parse(new TextDecoder().decode(new Uint8Array(data)));

                if (msg.method == "auth") {
                    if (msg.password === this.#setPassword) {
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].authorized = true;
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].id = msg.id;
                        this.#sockets[`${socket.remoteAddress}:${socket.remotePort}`].extraData  = msg.extraData
                    } else {
                        socket.write("Invalid Password");
                        socket.end();
                    }
                }

                this.callback({
                    eventType: "message",
                    message: new TextDecoder().decode(new Uint8Array(data))
                });
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
    sendMessageToAll(message: string) {
        if (!this.#hasStartedServer)
            return "Server hasn't started yet!";
        
        this.#sockets.forEach(socket => {
            socket.write(message);
        });
    }
}

export = Server;