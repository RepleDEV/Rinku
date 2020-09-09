// RPC Server Setup
const express = require("express");
const wildcardMiddleware = require("@wildcard-api/server/express");
const { endpoints } = require("@wildcard-api/server");
const methods = require('./methods');

function checkPort(port, address) {
    return new Promise((resolve, reject) => {
        const net = require('net');

        const server = net.createServer(socket => {
            socket.write("Echo Server\r\n");
            socket.pipe(socket);
        });
    
        server.listen(port, address);
        server.on('error', e => {
            console.log(e);
            resolve(false);
        });
        server.on('listening', e => {
            server.close();
            resolve(true);
        });
    });
};

async function start(port, ip) {
    if (typeof port != "number" || typeof ip != "string")throw new Error("INVALID ARGUMENTS");
    await checkPort(port, ip).then(res => {
        if (!res)throw new Error("PORT ALREADY IN USE");
    });

    for (var method in methods) {
        endpoints[method] = methods[method];
    }

    const app = express();

    app.use(wildcardMiddleware());
    app.listen(port, ip)

    return "App listening on port: " + port;
}

exports.start = start;