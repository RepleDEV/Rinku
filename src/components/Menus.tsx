import React from "react";
import $ from "jquery";

import { sendMethod, startServer } from "../TS/ipc";

type MenuTypes = "main";

class Menu extends React.Component<{ menu: MenuTypes }> {
    render() {
        switch (this.props.menu) {
            case "main":
                return (
                    <div className="menu">
                        <h1>Rinku</h1>
                        <input id="host_server" />
                        <button
                            onClick={() => {
                                const host = $("#host_server").val().toString();
                                if (!host.length) {
                                    return console.log("pls enter value lolol");
                                }
                                console.log(startServer(host));
                            }}
                        >
                            Server
                        </button>
                        <br />
                        <input id="host_client" />
                        <button
                            onClick={() => {
                                const host = $("#host_client").val().toString();

                                if (!host.length) {
                                    return console.log("pls enter value lolol");
                                }

                                sendMethod("connect to server", {
                                    host: host,
                                    port: 4011,
                                });
                            }}
                        >
                            Client
                        </button>
                    </div>
                );
            default:
                return <div className="menu"></div>;
        }
    }
}

export { Menu };
