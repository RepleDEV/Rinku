const express = require('express');

let wildcard, endpoints;

const portchecker = require('../../portchecker');

const { methods, auth } = require('./methods');

const app = express();

class Server {
    #hasStartedServer = false;
    #server;
    constructor() {
        wildcard = require('@wildcard-api/server/express');
        endpoints = require('@wildcard-api/server').endpoints;

        for (var method in methods) {
            endpoints[method] = methods[method];
        }
    }
    async start(password) {
        if (this.#hasStartedServer)
            return "Server already started!"
        
        var port = await findPort(3012);

        auth.setPassword(password);
        
        app.use(wildcard());
        this.#server = app.listen(port);
        this.#hasStartedServer = true;

        return `Started RPC Server on port: ${port}!`;
    }
    stop() {
        if (!this.#hasStartedServer)
            return "Server has not started yet!"
        
        this.#server.stop();
        
        return "Server has stopped!";
    }
}

/**
 * Port Searching.
 * @param {number} port Starting port to search
 * @param {number} increment Port increment
 * @param {number} maxRetries Max port retries
 * 
 * @returns {Promise<number | string>}
 */
function findPort(port = 3000, increment = 10, maxRetries = 10) {
    return new Promise(async (resolve, reject) => {
        var isPortClear = await portchecker(port);
        var cycles = 0;
        while (isPortClear) {
            port += increment;
            cycles++;

            isPortClear = await portchecker(port);

            if (cycles == maxRetries) {
                reject(`No Free Ports Found. Range searched: ${port}-${port + increment * maxRetries}`);
                break;
            }
        }
        return resolve(port);
    });
}

module.exports = Server;