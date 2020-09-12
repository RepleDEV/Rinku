const net = require('net');
const server = net.createServer();

/**
 * Checks if a port is already listened to.
 * @param {number} port Port to check
 * @param {string} host Host name. (If not provided, defaults to localhost)
 */
module.exports = (port, host) => {
    return new Promise((resolve, reject) => {
        if (typeof port != "number")return reject("PORT ARGUMENT IS NOT A NUMBER");

        host = host || "localhost";

        server.once('error', err => {
            if (err.code === 'EADDRINUSE')
                return resolve(true);
        });
         
        server.once('listening', () => {
            resolve(false);
            server.close();
        });

        server.listen(port, host);
    });
}