const gulp = require("gulp");
// const zip = require("gulp-zip");

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
    .src(["**/*", "!node_modules/**", "!pricing-page/**", "!src/**", "!zip/**", "!composer-lock.json", "!composer.json", "!todo.txt", "!fs-config.json", "!bundled/**", "!gulpfile.js", "!package.json", "!readme.md", "!package-lock.json", "!webpack.config.js", "!.gitignore"])
    .pipe(gulp.dest("bundled/3d-viewer"));
}

exports.bundle = bundle;

// exports.zip = () => {
//   return (
//     gulp
//       .src(["bundled/**"])
//       // .pipe(zip("3d-viewer-v1.3.20.zip"))
//       .pipe(zip("3d-viewer.zip"))
//       .pipe(gulp.dest("zip"))
//   );
// };
