const gulp = require("gulp");

const fs_config = require("./fs-config.json");

require("gulp-freemius-deploy")(gulp, {
  developer_id: fs_config.developer_id,
  plugin_id: fs_config.plugin_id,
  public_key: fs_config.public_key,
  secret_key: fs_config.secret_key,
  zip_name: "3d-viewer.zip",
  zip_path: "zip/",
  add_contributor: false,
});

function bundle() {
  return gulp
    .src(["**/*", "!node_modules/**", "!pricing-page/**", "!src/**", "!zip/**", "!composer-lock.json", "!composer.json", "!todo.txt", "!fs-config.json", "!bundled/**", "!gulpfile.js", "!package.json", "!readme.md", "!package-lock.json", "!webpack.config.js", "!.gitignore", "!lib/bfields/README.md"])
    .pipe(gulp.dest("bundled/3d-viewer"));
}

exports.bundle = bundle;
