const fs = require("fs");

module.exports = (filename, error, request, response) => {
  try {
    let msg = `${new Date()}\n${request.method.padEnd(6, " ")} => ${
      request.url
    } - ${
      new Date().getTime() - request.date.getTime()
    } ms\nuser: ${JSON.stringify(
      request.user || {},
    )}\nbody: ${JSON.stringify(request.body)}\nquery: ${JSON.stringify(
      request.query,
    )}\nfiles: ${JSON.stringify(request.files)}\nparams: ${JSON.stringify(request.params)}\n`;
    if (error) msg += `error: ${error.stack}\n\n\n`;
    else msg += `response: ${JSON.stringify(response)}\n\n\n`;
    const folder = `logs/${new Date().getDate().toString().padStart(2, "0")}-${(
      new Date().getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${new Date().getFullYear()}`;
    if (!fs.existsSync("logs")) fs.mkdirSync("logs");
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    fs.appendFileSync(`${folder}/${filename}`, msg);
  } catch (e) {
    console.log(e.message);
  }
};