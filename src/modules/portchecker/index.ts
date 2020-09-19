import * as http from "http";

const server = http.createServer();

/**
 * Port checker.
 * @param port Port number to check
 * @param host Host name. Defaults to localhost if not provided
 * 
 * @returns True if clear, false if already listened to
 */
function portchecker(port: number, host: string = "localhost"): Promise<boolean> {
    return new Promise(resolve => {
        server.on("listening", () => {
            resolve(true);
            server.close();
        });

        server.on("error", err => {
            if (err.message.includes("EADDRINUSE"))
                resolve(false);
        });

        server.listen(port, host);
    });
}

export = portchecker;