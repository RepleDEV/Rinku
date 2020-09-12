const express = require('express');
const wildcard = require('@wildcard-api/server/express');
const { endpoints } = require('@wildcard-api/server');

const portChecker = require('../../portchecker');

const methods = require('./methods');

const app = express();

class Server {
    #hasStartedServer = false;
    #server;
    constructor(port, callback) {
        if (typeof port != "number")
            throw new Error("MUST PROVIDE PORT");
        if (typeof callback != "function")
            throw new Error("CALLBACK FUNCTION NOT PROVIDED / ILLEGAL TYPE");

        for (var method in methods) {
            endpoints[method] = methods[method];
        }

        app.use(wildcard());

        this.callback = callback;
        this.port = port;
    }
    start() {
        if (this.#hasStartedServer)
            return "Server already started!"
        
        var portIsAvailable = await portChecker(this.port);
        
        if (portIsAvailable) {
            this.#server = app.listen(this.port);
            this.#hasStartedServer = true;

            return `Started RPC Server on port: ${this.port}!`;
        } else {
            return "PORT ALREADY IN USE!";
        }
    }
    stop() {
        if (!this.#hasStartedServer)
            return "Server is not started!"
        
        this.#server.stop();
        
        return "Server has stopped!";
    }
}

module.exports = Server;