import React from "react";
import { render } from "react-dom";
import { Menu } from "./components/Menus";
import "../res/styles/styles.css";

const mainElement = document.createElement("div");
mainElement.setAttribute("id", "root");
document.body.appendChild(mainElement);

render(<Menu menu="main" />, mainElement);
