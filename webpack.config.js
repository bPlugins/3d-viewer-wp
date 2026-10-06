const defaultConfig = require("@wordpress/scripts/config/webpack.config.js");
const ESLintPlugin = require("eslint-webpack-plugin");

const plugins = defaultConfig.plugins.filter((p) => {
    if (Object.values(p).length === 2 && Object.values(p)?.[1]["filename"] && Object.values(p)?.[1]["filename"] === "[name]-rtl.css") {
        return false;
    }
    return true;
});


const entry = {
    ...defaultConfig.entry(),
    frontend: "./src/public/frontend.tsx", // woocommerce
    dashboard: "./src/admin/dashboard/admin.tsx",
    onboarding: "./src/admin/onboarding/index.tsx",
    admin: "./src/admin/index.ts",
    "admin-preview": "./src/admin/preview/index.tsx",
    "dokan-vendor": "./src/integrations/dokan/index.ts", // Optional Dokan module
};

module.exports = {
    ...defaultConfig,
    entry,
    plugins: [...plugins, new ESLintPlugin()],
    optimization: {},
};

