let wildcard, endpoints;


const portchecker = require('../../portchecker');

class Client {
    constructor() {
        wildcard = require('@wildcard-api/client');
        endpoints = wildcard.endpoints;
    }
    connect(password, host = "localhost") {
        return new Promise(async (resolve, reject) => {
            wildcard.serverUrl = `http://${host}:3012`;

            const msg = await endpoints.connect(password).catch(reject);
            return resolve(msg)
        });
    }
}

module.exports = Client;