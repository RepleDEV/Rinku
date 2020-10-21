import React from "react";

import { sendMethod, startServer } from "../TS/ipc";

type MenuTypes = "main";

class Menu extends React.Component<{menu: MenuTypes}> {
    render() {
        switch (this.props.menu) {
            case "main":
                return (
                    <div className="menu">
                        <h1>Rinku</h1>
                        <button onClick={() => {
                            console.log(startServer());
                        }}>Server</button>
                        <br />
                        <input id="host_client"/>
                        <button onClick={() => {
                            sendMethod("connect to server")
                        }}>Client</button>
                    </div>
                )
            default:
                return <div className="menu"></div>
        }
    }
}


export { Menu };