const fs = require("fs");
const path = require("path");

const basename = path.basename(__filename);
const middlewares = {};

// Read all files in current directory
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const middleware = require(path.join(__dirname, file));

    // Merge all exported properties
    Object.assign(middlewares, middleware);
  });

module.exports = middlewares;