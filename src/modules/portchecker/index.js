const http = require('http');
const server = http.createServer();

/**
 * Checks ports in localhost.
 * @param {number} port Port to check.
 * @returns {Promise<boolean>} True if port is already in use. False if port is clear.
 */
module.exports = (port) => {
    return new Promise((resolve, reject) => {
        if (typeof port != "number")
            return reject("Port number not provided / invalid type.");

        server.on("listening", () => {
            resolve(false);
            server.close();
        });
        
        server.on("error", err => {
            if (err.code === "EADDRINUSE") 
                resolve(true);
        });
        
        server.listen(port);
    });
}