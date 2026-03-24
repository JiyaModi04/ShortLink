const express = require('express');
const pool = require('./utils/databaseutil');
const cookieParser = require("cookie-parser");
const path = require('path');

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cookieParser());

const userRoutes = require('./routes/userRouter');
const adminRoutes = require('./routes/adminRouter');

pool.connect().then(() => console.log("connected"));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use('/', userRoutes);
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use('/qr-scanner', express.static('node_modules/qr-scanner'));

app.use("/uploads", express.static("uploads"));


app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//Authentication using Session

// const session = require('express-session');
// const pgsession = require('connect-pg-simple')(session);

// app.use(session({
//     store : new pgsession({
//     pool : pool,
//     tableName : 'session',
//     createTableIfMissing: true 
//     }),
//     secret: 'supersecretkey',
//     resave: false,
//     saveUninitialized : false,
//     cookie: { maxAge: 1000 * 60 * 60 }
// }));
