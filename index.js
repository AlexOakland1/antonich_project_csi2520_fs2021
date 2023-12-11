const express = require("express");
const mysql = require("mysql");
const util = require('util');
const crypto = require('crypto');
const generateKeyPairPromise = util.promisify(crypto.generateKeyPair);
const ejs = require("ejs");
const scrypt = util.promisify(crypto.scrypt);
const config = require('config');
const aws = require('aws-sdk');

// Create express app
const app = express();

// import config variables from heroku
let s3 = new aws.S3({
  "host": process.env.JAWSDB_HOST,
  "user": process.env.JAWSDB_USER,
  "password": process.env.JAWSDB_PASSWORD,
  "database": process.env.JAWSDB_DB
});

console.log(s3);

// get config from config/config.json
//const dbConfig = config.get('Database.dbConfig');

// Create a database connection configuration
const db = mysql.createConnection(s3);
//const db = mysql.createConnection(dbConfig);

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
    res.render("chat");
});

app.post("/createaccount", async (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  // Generate RSA key pair for the new user
  const { publicKey, privateKey } = await generateKeyPairPromise('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  // Derive an encryption key from the user's password using a modern key derivation function
  const key = crypto.scryptSync(password, 'salt', 32);

  // Encrypt the private key with the derived key for added security
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encryptedPrivateKey = cipher.update(privateKey, 'utf-8', 'base64');
  encryptedPrivateKey += cipher.final('base64');

  // Store the user details, including the encrypted private key, in the database
  const insertUserQuery = "INSERT INTO users (username, password, public_key, private_key) VALUES (?, ?, ?, ?)";
  await queryDB(insertUserQuery, [username, password, publicKey, encryptedPrivateKey]);

  // Fetch the list of users for chat display
  const sqllist = 'SELECT username FROM users';
  const userList = await queryDB(sqllist);

  res.render("chat", { user: username, data: userList, publickey: publicKey });
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
        console.log(result[0].public_key)
        res.render("chat", {user: data1, publickey: result, data: result2});
      });
    }
    //console.log(result);
  });
});

app.post("/logout", (req, res) => {
  res.render("index", {error: 0});
});

app.post("/publicKey", async (req, res) => {
  const { user } = req.body;

  try {
    // Fetch the public key from the database based on the currently logged-in user
    const publicKeyQuery = "SELECT public_key FROM users WHERE username = ?";
    const publicKeyResult = await queryDB(publicKeyQuery, [user]);

    if (publicKeyResult.length === 0) {
      return res.status(404).json({ error: "Public key not found for the user" });
    }

    const publicKey = publicKeyResult[0].public_key;

    // Convert the base64-encoded public key to an ArrayBuffer
    const publicKeyArrayBuffer = base64ToBuffer(publicKey);

    // Send the public key in the response
    res.json({ publicKey: publicKeyArrayBuffer });
  } catch (error) {
    console.error("Error fetching public key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function base64ToBuffer(base64String) {
  console.log("base64String:", base64String);

  // Extract the base64-encoded part between the markers
  const base64Data = base64String.match(/-----BEGIN PUBLIC KEY-----([\s\S]+)-----END PUBLIC KEY-----/)[1].replace(/\s/g, '');

  console.log("base64Data:", base64Data);

  // Use btoa to encode binary data to base64
  const binaryString = atob(base64Data);
  console.log("binaryString:", binaryString);

  // Convert the binary string to a Uint8Array
  const uint8Array = Uint8Array.from(binaryString, char => char.charCodeAt(0));

  // Convert the Uint8Array to a buffer
  const buffer = uint8Array.buffer;

  console.log("buffer:", buffer);

  return buffer;
}

app.post("/sendmessage", async (req, res) => {
  const user = req.body.user;
  const message = req.body.message;

  // Fetch the user's private key from the database (make sure to store it securely)
  const privateKeyQuery = "SELECT private_key FROM users WHERE username = ?";
  const privateKeyResult = await queryDB(privateKeyQuery, [user]);

  if (privateKeyResult.length === 0) {
    return res.status(400).json({ error: "User not found or private key not available" });
  }

  const privateKey = privateKeyResult[0].private_key;

  // Decrypt the user's private key
  const decryptedPrivateKey = crypto.privateDecrypt(
    {
      key: Buffer.from(privateKey, 'base64'),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(privateKey, 'base64')
  );

  // Encrypt the message using the decrypted private key
  const encryptedMessageBuffer = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    await crypto.subtle.importKey(
      'spki',
      Buffer.from(decryptedPrivateKey).toString('base64'),
      { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
      true,
      ['encrypt']
    ),
    new TextEncoder().encode(message)
  );

  const encryptedMessageBase64 = Buffer.from(encryptedMessageBuffer).toString('base64');

  // Store the encrypted message in the database
  const storeMessageQuery = "INSERT INTO messages (username, encrypted_message) VALUES (?, ?)";
  await queryDB(storeMessageQuery, [user, encryptedMessageBase64]);

  res.status(200).json({ success: true });
});

// Function to execute a database query
function queryDB(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Setup server ports
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
