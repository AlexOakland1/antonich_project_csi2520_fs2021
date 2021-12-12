const express = require("express");
const mysql = require("mysql");
const ejs = require("ejs");

// Create express app
const app = express();

// Create a database connection configuration
const db = mysql.createConnection({
  host: "uzb4o9e2oe257glt.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "q4qg6aqmwxpj0ori",
  password: "z7lco4t7rf5ipqy7",
  database: "hpdnoqjem0sogc6k", // comment out if running example 1
});

// Establish connection with the DB
db.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log(`Successful connected to the DB....`);
  }
});

// Initialize Body Parser Middleware to parse data sent by users in the request object
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to parse HTML form data

// Initialize ejs Middleware
app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/public"));

// routes
app.get("/", (req, res) => {
  res.render("index", {error: 0});
});

app.get("/create_account", (req, res) => {
  res.render("create_account", {error: 0});
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

app.post("/createaccount", (req, res) => {
  let data = { username: req.body.username.trim(), password: req.body.password.trim() };
  let data1 = req.body.username.trim();
  let data2 = req.body.password.trim();
  let sql = `INSERT INTO users SET ?`;
  let sqllist =  'SELECT username FROM users';
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      //throw err;
      res.render("create_account", {error: 1});
    } else {
      db.query(sqllist, (err, result2) => {
        res.render("chat", {user: data1, data: result2});
      });
    }
  });
});

app.post("/loginaccount", (req, res) => {
  let data1 = req.body.username.trim();
  let data2 = req.body.password.trim();
  let sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  let sqllist =  'SELECT username FROM users';
  let query = db.query(sql, [data1, data2], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length == 0) {
      res.render("index", {error: 1});
    } else {
      db.query(sqllist, (err, result2) => {
        res.render("chat", {user: data1, data: result2});
      });
    }
    console.log(result);
    console.log(result.length);
  });
});

app.post("/logout", (req, res) => {
  res.render("index", {error: 0});
});

app.post("/insertstudents", (req, res) => {
  let data = { name: req.body.studentName, email: req.body.studentEmail };
  let sql = `INSERT INTO students SET ?`;
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      throw err;
    }
    res.send(`student entry was inserted to the db...`);
  });
});

app.post("/updatestudents", (req, res) => {
  let sql = `UPDATE students SET email = '${req.body.studentNewEmailUpdate}'  WHERE id = ${req.body.studentID}`;
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.send(`student entry was updated in the db...`);
  });
});

app.post("/deletestudents", (req, res) => {
  let sql = `DELETE FROM students WHERE email = '${req.body.studentEmail}'`;
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.send(`student entry was deleted in the db...`);
  });
});

app.get("/readstudents", (req, res) => {
  let sql = `SELECT * FROM students`;
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.render("readData", { data: result });
  });
});

// Setup server ports
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
