const defaultConfig = require("@wordpress/scripts/config/webpack.config.js");
// const path = require("path");

// import ESLintPlugin from "eslint-webpack-plugin";
const ESLintPlugin = require("eslint-webpack-plugin");

const plugins = defaultConfig.plugins.filter((p) => {
    if (Object.values(p).length === 2 && Object.values(p)?.[1]["filename"] && Object.values(p)?.[1]["filename"] === "[name]-rtl.css") {
        return false;
    }
    return true;
});


const entry = {
    ...defaultConfig.entry(),
    public: "./src/public/index.tsx",
    frontend: "./src/public/frontend.tsx", // woocommerce
    dashboard: "./src/admin/dashboard/admin.tsx",
    admin: "./src/admin/index.ts",
    "admin-preview": "./src/admin/preview/index.tsx",
};

module.exports = {
    ...defaultConfig,
    entry,
    plugins: [...plugins, new ESLintPlugin()],
    optimization: {},
};

