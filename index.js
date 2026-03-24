const express = require('express');
const pool = require('./utils/databaseutil');
const cookieParser = require("cookie-parser");
const path = require('path');
const fs = require("fs");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cookieParser());

const userRoutes = require('./routes/userRouter');
const adminRoutes = require('./routes/adminRouter');

(async () => {
  try {
    await pool.connect();
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use('/', userRoutes);
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use('/qr-scanner', express.static('node_modules/qr-scanner'));

if (fs.existsSync("public")) {
  app.use(express.static("public"));
}

if (fs.existsSync("uploads")) {
  app.use("/uploads", express.static("uploads"));
}

app.get("/", (req, res) => {
  res.send("ShortLink running 🚀");
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

module.exports = app;
