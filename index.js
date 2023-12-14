const express = require("express");
const mysql = require("mysql");
const util = require('util');
const crypto = require('crypto');
const generateKeyPairPromise = util.promisify(crypto.generateKeyPair);
const ejs = require("ejs");
const scrypt = util.promisify(crypto.scrypt);
const config = require('config');
const aws = require('aws-sdk');

let publicKey, privateKey;

crypto.generateKeyPair('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, pubKey, privKey) => {
  if (err) throw err;

  publicKey = pubKey;
  privateKey = privKey;
  console.log('RSA key pair generated successfully');
});

// Create express app
const app = express();

// import config variables from heroku
// let s3 = new aws.S3({
//   host: process.env.JAWSDB_HOST,
//   user: process.env.JAWSDB_USER,
//   password: process.env.JAWSDB_PASSWORD,
//   database: process.env.JAWSDB_DB
// });

// get config from config/config.json
const dbConfig = config.get('Database.dbConfig');

// Create a database connection configuration
// const db = mysql.createConnection({
//   host: s3.config.host,
//   user: s3.config.user,
//   password: s3.config.password,
//   database: s3.config.database, // comment out if running example 1
// });
const db = mysql.createConnection(dbConfig);

// Establish connection with the DB
db.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log(`Successfully connected to the DB....`);
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
  const selectMessages = "SELECT * FROM messages";
  const selectUsernames = "SELECT DISTINCT username FROM messages ORDER BY username";

  db.query(selectUsernames, (err, usernames) => {
    if (err) {
      console.error('Error fetching usernames:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    db.query(selectMessages, (err, messages) => {
      if (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      res.send({data: messages, usernames: usernames});
    });
  });
});


app.post("/createaccount", (req, res) => {
  let data = { username: req.body.username.trim(), password: req.body.password.trim() };
  let data1 = req.body.username.trim();
  let data2 = req.body.password.trim();
  let sql = `INSERT INTO users SET ?`;
  let sqllist = 'SELECT DISTINCT username FROM users';
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      res.render("create_account", { error: 1 });
    } else {
      // Fetch all messages from the database
      const selectMessages = "SELECT * FROM messages";
      db.query(selectMessages, (err, messages) => {
        res.render("chat", { user: data1, data: messages });
      });
    }
  });
});

app.post("/loginaccount", (req, res) => {
  let data1 = req.body.username.trim();
  let data2 = req.body.password.trim();
  let sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  let sqllist = 'SELECT DISTINCT username FROM users';
  let query = db.query(sql, [data1, data2], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length == 0) {
      res.render("index", { error: 1 });
    } else {
      // Fetch all messages from the database
      const selectMessages = "SELECT * FROM messages";
      db.query(selectMessages, (err, messages) => {
        res.render("chat", { user: data1, data: messages });
      });
    }
  });
});

app.post("/logout", (req, res) => {
  res.render("index", {error: 0});
});

// New endpoint to handle chat messages
app.post("/sendmessage", (req, res) => {
  const username = req.body.username.trim();
  const message = req.body.message.trim();

  console.log("Message: " + message);
  // Encrypt the message with the public key
  const encryptedMessage = crypto.publicDecrypt(publicKey, Buffer.from(message, 'utf8')).toString('base64');
  console.log(encryptedMessage);

  const insertMessage = "INSERT INTO messages (username, message) VALUES (?, ?)";
  db.query(insertMessage, [username, encryptedMessage], (err, result) => {
    if (err) {
      console.error('Error inserting message:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Fetch all messages from the database
    const selectMessages = "SELECT * FROM messages";
    db.query(selectMessages, (err, messages) => {
      if (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.json(messages); // Send messages as JSON
    });
  });
});

app.get("/publickey", (req, res) => {
  console.log('Server Public Key:', publicKey);
  res.json({ publicKey });
});

// Setup server ports
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Log the public key for reference
  console.log('Server Public Key:', publicKey);
});
