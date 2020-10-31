import { ipcRenderer } from "electron";
import { MethodTypes, MethodArguments } from "../../electron";

const localIp = Object.values(require("os").networkInterfaces())[1][1].address;

async function sendMethod(
    method: MethodTypes,
    methodArgs?: MethodArguments
): Promise<string | void> {
    return await ipcRenderer.invoke("mainWindow", method, methodArgs);
}

async function startServer(
    host?: string,
    password?: string | number
): Promise<string | void> {
    return await sendMethod("start server", {
        host: host || localIp,
        password: password,
    });
}

ipcRenderer.on("message", (e, data) => {
    console.log(data);
});

export { sendMethod, localIp, startServer };
