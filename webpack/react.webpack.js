/* eslint-disable no-undef */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const rootPath = path.resolve(__dirname, "..");

module.exports = {
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        mainFields: ["main", "module", "browser"],
    },
    entry: path.resolve(rootPath, "src", "App.tsx"),
    target: "electron-renderer",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.js$/,
                include: [path.resolve("../src/JS")],
                use: [
                    {
                        loader: "raw-loader",
                        options: {
                            esModule: false,
                        },
                    },
                ],
            },
        ],
    },
    devServer: {
        contentBase: path.join(rootPath, "dist/renderer"),
        historyApiFallback: true,
        compress: true,
        hot: true,
        port: 4000,
        publicPath: "/",
    },
    output: {
        path: path.resolve(rootPath, "dist/renderer"),
        filename: "js/[name].js",
        publicPath: "./",
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "src/index.html",
            inject: true,
            cache: true,
        }),
    ],
};
