const express = require('express');
const wildcard = require('@wildcard-api/server/express');
const { endpoints } = require('@wildcard-api/server');

const portChecker = require('../../portchecker');

const methods = require('./methods');

const app = express();

class Server {
    #hasStartedServer = false;
    #server;
    constructor(callback) {
        if (typeof callback != "function")
            throw new Error("Callback function not provided.");
        
        for (var method in methods) {
            endpoints[method] = methods[method];
        }

        app.use(wildcard());

        var port = 3012;

        var isPortAvailable = await portchecker(port);
        while (!isPortAvailable) {
            port += 10;
            isPortAvailable = await portchecker(port);
        }

        this.callback = callback;
        this.port = port;
    }
    start(password) {
        if (this.#hasStartedServer)
            return "Server already started!"
        
        this.#server = app.listen(this.port);
        this.#hasStartedServer = true;

        return `Started RPC Server on port: ${this.port}!`;
    }
    stop() {
        if (!this.#hasStartedServer)
            return "Server has not started yet!"
        
        this.#server.stop();
        
        return "Server has stopped!";
    }
}

module.exports = Server;