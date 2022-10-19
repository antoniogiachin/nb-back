// dotenv
require("dotenv").config();
// express
const express = require("express");
const app = express();
const path = require("path");
// logger
const { logger } = require("./middleware/logger");
// error handler
const errorHandler = require("./middleware/errorHandler");
// cookie parser
const cookierParser = require("cookie-parser");
// cors
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
// conn DB Mongo
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const { logEvents } = require("./middleware/logger");
// PORTA DI ASCOLTO
const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);
connectDB();

app.use(logger);

// diciamo alla app di poter utilizzare i JSON, ossia riceverli e parsarli
app.use(express.json());
// cookie parser
app.use(cookierParser());
// cors
app.use(cors(corsOptions)); // chiunque puo fare richieste va messa in sicurezza!
// cartella config con cors options

// qui diciamo ad express dove trovare i file statici (come css) - dirname dice di vedere nella cartella del progetto
app.use("/", express.static(path.join(__dirname, "public")));

// altro file statico in cartella profilepictures per renderle pubbliche
app.use("/profilePictures", express.static("profilePictures"));

app.use("/", require("./routes/root"));

// auth route
app.use("/auth", require("./routes/authRoutes.js"));
// user route
app.use("/users", require("./routes/userRoutes.js"));
// post route
app.use("/posts", require("./routes/postRoutes.js"));
// tag route
app.use("/tags", require("./routes/tagRoutes.js"));
// review route
app.use("/reviews", require("./routes/reviewRoutes.js"));

// 404 tutto cio' che non viene intercettato prima
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("text").send("404 Not Found!");
  }
});

// error
app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log("SERVER RUNNING ON PORT: ", PORT);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
