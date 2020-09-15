const wildcard = require("@wildcard-api/client");
const { endpoints } = wildcard;

class Client {
    constructor() {
        //
    }
    connect(password, host = "localhost") {
        return new Promise(async (resolve, reject) => {
            await Client.findServer("ping", 3012).then(async port => {
                wildcard.serverUrl = `http://${host}:${port}`;

                var connect = await endpoints.connect(password);
                return resolve(connect);
            }).catch(reject); 
        });
    }
    /**
     * Scans for wildcard-api servers on ports.
     * @param {string} method Method to execute on the end point
     * @param {number} port Port to search
     * @param {number} portIncrement Number to increase (or decrease) to the port number after an unsuccsessful connection attempt.
     * @param {number} retries Number of connection retries
     * 
     * @returns {Promise<number>} Port number. Rejects promise if no connection was ever made.
     */
    static findServer(method, port = 3100, portIncrement = 10, retries = 10) {
        var cycle = 0;

        return new Promise(async (resolve, reject) => {
            if (typeof method != "string" || !method.length)
                return reject("MUST PROVIDE ENDPOINT METHOD");

            wildcard.serverUrl = `http://localhost:${port}`;

            await endpoints[method]().then(() => {
                resolve(port);
            }).catch(async err => {
                if (cycle == retries)
                    return reject("No connection found.");
                if (err.message == "No Server Connection") 
                    resolve(await this.findServer(method, port + portIncrement));
            });
        });
    }
}

module.exports = Client;