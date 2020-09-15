const wildcard = require("@wildcard-api/client");
const { endpoints } = wildcard;

const portchecker = require('../../portchecker');

class Client {
    constructor() {
        //
    }
    connect(password, host = "localhost") {
        return new Promise(async (resolve, reject) => {
            await Client.findServer("ping", host, 3012, 3112).then(async port => {
                wildcard.serverUrl = `http://${host}:${port[0]}`;

                var connect = await endpoints.connect(password);
                return resolve(connect);
            }).catch(reject); 
        });
    }
    static findServer(method, host = "localhost", startingPort = 3100, endPort = 3200) {
        return new Promise(async (resolve, reject) => {
            if (typeof method != "string" || !method.length)
                return reject("ILLEGAL METHOD PARAMETER");
            
            var foundPorts = [];
            for(var i = 0;i < endPort - startingPort;i++) {
                const portUsed = await portchecker(startingPort + i);
                if (portUsed)
                    foundPorts.push(startingPort + i);
            }

            if (!foundPorts.length)
                return reject("No open ports found.")

            foundPorts.forEach(async (port, i) => {
                wildcard.serverUrl = `http://${host}:${port}`;

                try {
                    await endpoints[method]();
                } catch (err) {
                    foundPorts.splice(i, 1);
                }
            });

            return resolve(foundPorts);
        });
    }
}

module.exports = Client;