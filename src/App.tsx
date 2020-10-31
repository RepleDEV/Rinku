import React from "react";
import { render } from "react-dom";
import { MainMenu } from "./components/Menus";
import { Sidebar } from "./components/Sidebar";
import $ from "jquery";

import "../res/styles/styles.css";

// Load the sidebar
render(<Sidebar />, $("#navbar")[0]);

// Load main element
render(<MainMenu />, $("#root")[0]);
