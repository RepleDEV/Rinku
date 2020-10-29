import React, { useState } from "react";
import $ from "jquery";
import { Transition } from "react-transition-group";

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
                        <button className="hostButton">Host</button>
                        <br />
                        <button className="clientButton">Client</button>
                    </div>
                </div>
            )}
        </Transition>
    );
};

export { MainMenu };
