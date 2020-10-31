import React, { useState } from "react";
import $ from "jquery";
import { Transition } from "react-transition-group";
import { sendMethod } from "../TS/ipc";

const MainMenu = (): JSX.Element => {
    const [inProp, setInProp] = useState(true);

    const duration = 225;

    const defaultStyle = {
        transition: `opacity ${duration}ms ease-in-out`,
        opacity: 1,
    };

    const transitionStyles = {
        exiting: { opacity: 0 },
        exited: { opacity: 0 },
    };

    return (
        <Transition in={inProp} timeout={duration}>
            {(state) => (
                <div
                    style={{
                        ...defaultStyle,
                        ...transitionStyles[state],
                    }}
                    className="menu main"
                >
                    <div className="selectorContainer">
                        <input type="text" id="host_input" placeholder="Host" />
                        <input
                            type="text"
                            id="client_input"
                            placeholder="Client"
                        />
                        <button
                            className="hostButton"
                            onClick={() => {
                                const hostInput = $("#host_input");
                                const [
                                    host,
                                    port,
                                ] = hostInput.val().toString().split(":");

                                if (host && port) {
                                    sendMethod("start server", {
                                        host: host,
                                        port: parseInt(port),
                                    }).then(console.log);
                                } else {
                                    console.log("Please enter value");
                                }

                                hostInput.val("");
                            }}
                        >
                            Host
                        </button>
                        <br />
                        <button
                            className="clientButton"
                            onClick={() => {
                                const clientInput = $("#client_input");
                                const [
                                    host,
                                    port,
                                ] = clientInput.val().toString().split(":");

                                if (host && port) {
                                    sendMethod("connect to server", {
                                        host: host,
                                        port: parseInt(port),
                                    }).then(console.log);
                                } else {
                                    console.log("Please enter value");
                                }

                                clientInput.val("");
                            }}
                        >
                            Client
                        </button>
                    </div>
                </div>
            )}
        </Transition>
    );
};

export { MainMenu };
