const wildcard = require("@wildcard-api/client");
const { endpoints } = wildcard;

const portchecker = require('../../portchecker');

class Client {
    constructor() {
        //
    }
    connect(password, host = "localhost") {
        return new Promise(async (resolve, reject) => {
            const isportclean = await portchecker(3012);
            
            if (!isportclean)
                return reject("No Connection Found");

            wildcard.serverUrl = `http://${host}:3012`;

            var connect = await endpoints.connect(password);
            return resolve(connect);
        });
    }
}

module.exports = Client;