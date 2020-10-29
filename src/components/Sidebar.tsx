import React from "react";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library as fa_lib } from "@fortawesome/fontawesome-svg-core";
import { faAngleDoubleRight, faCog } from "@fortawesome/free-solid-svg-icons";
import { navToggle } from "../TS/UI";

fa_lib.add(faAngleDoubleRight, faCog);

const Sidebar = (): JSX.Element => {
    return (
        <ul
            className="navbar-nav"
            onMouseEnter={navToggle}
            onMouseLeave={navToggle}
        >
            <li className="profile-logo">
                <a href="#" className="nav-link">
                    <span className="link-text logo-text">Rinku</span>
                    <FontAwesomeIcon
                        icon={["fas", "angle-double-right"]}
                        size="3x"
                    />
                </a>
            </li>
            <li className="nav-item" id="navbar_settings_button">
                <a href="#" className="nav-link">
                    <FontAwesomeIcon icon={["fas", "cog"]} size="5x" />
                    <span className="link-text">Settings</span>
                </a>
            </li>
        </ul>
    );
};

export { Sidebar };
