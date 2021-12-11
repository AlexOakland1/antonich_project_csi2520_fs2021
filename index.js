const express = require("express");
const ejs = require("ejs");
const { Pool } = require('pg');

// Create express app
const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});
  
pool.connect();
  
pool.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    pool.end();
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

app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

app.get("/loginaccount"), (req, res) => {
    const text = 'select (username, password) from users where username = $1 and password = $2';
    const values = [req.body.username, req.body.password];
    client.query(text, values, (err, res) => {
        if (err) {
          console.log(err.stack)
          res.render("index");
        } else {
          console.log(res.rows[0])
          // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
        }
      })
}

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
