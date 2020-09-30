// Server connection test
import * as assert from "assert";

import Test = require("./test");

import Server = require("../src/modules/server");
import Client = require("../src/modules/client");

var server: Server;
var client: Client;

class Connection extends Test {
    run() {
        describe("Connection Test", () => {
            describe("Server Start", () => {
                it("Should start server without any errors", (done) => {
                    server = new Server(({ eventType }) => {
                        if (eventType == "server.start") done();
                    });
                    server.start(4010, "localhost");
                });
                it("Should connect to said server without errors", (done) => {
                    client = new Client(() => {});
                    client
                        .connect(4010, "localhost")
                        .then(() => {
                            done();
                        })
                        .catch(done);
                });
                after(() => {
                    server.stop();
                });
            });
        });
    }
}

export = Connection;
