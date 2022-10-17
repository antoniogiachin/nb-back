const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = rateLimit({
  windowsMs: 60 * 1000, // 1 minute
  max: 5, // Limita ogni IP a 5 tentativi al minuto
  message: {
    message:
      "Too many login attempots from this IP, please try again after 60 seconds pause",
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
  },
  standardHeaders: true, // Return rate limit info in the rateLimit headers
  legacyHeaders: false, // disable the X-Rate_limit headers
});

module.exports = loginLimiter;
