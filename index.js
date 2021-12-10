const express = require("express");
const ejs = require("ejs");
const { Client } = require('pg');

// Create express app
const app = express();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});
  
client.connect();
  
client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
});

// Initialize Body Parser Middleware to parse data sent by users in the request object
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to parse HTML form data

// Initialize ejs Middleware
app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/public"));

// routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/create_account", (req, res) => {
    res.render("create_account");
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

app.post("/insertstudents", (req, res) => {
  let data = { name: req.body.studentName, email: req.body.studentEmail };
  let sql = `INSERT INTO students SET ?`;
  let client = pg.query(sql, data, (err, result) => {
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
