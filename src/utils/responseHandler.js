const logger = require("./logger");
const mongoose = require("mongoose");

module.exports = (controllerFunction) => async (req, res, next) => {
  try {
    //const sessionStart = await  mongoose.startSession();
const { statusCode = 200, ...resObj } = await controllerFunction({
  user: req.user,
  body: req.body || {},
  params: req.params || {},
  query: req.query || {}
});

    // Capitalize message if present
    if (resObj?.message) {
      resObj.message =
        resObj.message.charAt(0).toUpperCase() +
        resObj.message.slice(1).toLowerCase();
    }

    res.status(+statusCode).json(resObj);
    logger("success.log", null, req, resObj);
  } catch (error) {
    console.error("Error caught in response handler:", error);

   

    // Generic server error fallback
    res.status(500).json({
      status: false,
      message: "Something went wrong!",
      data: [],
    });

    logger("error.log", error, req, null);
  }
};
