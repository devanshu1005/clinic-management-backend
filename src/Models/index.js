const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const basename = path.basename(__filename);
const db = {};

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
    const model = require(path.join(__dirname, file));
    db[model.modelName] = model;
  });

// Export mongoose instance
db.mongoose = mongoose;

module.exports = db;