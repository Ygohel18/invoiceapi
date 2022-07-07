const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const cryptoJs = require("crypto-js")
const { v4: uuidv4 } = require('uuid')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function log(str) {
    console.log(str);
}

function checkPassword(plain, encrypt) {

    const hashedPassword = cryptoJs.AES.decrypt(
        encrypt,
        process.env.SALT
    );

    const originalPassword = hashedPassword.toString(cryptoJs.enc.Utf8);

    if (plain == originalPassword) {
        return true;
    } else {
        return false;
    }
}

function doEncrypt(s) {
    return cryptoJs.AES.encrypt(
        s,
        process.env.SALT
    ).toString();
}

function unixTimestamp() {
    return Math.floor(
        Date.now() / 1000
    )
}

// MySQL

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

app.post('/api/v1/register', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { email, password } = req.body;

        const username = email.split('@')[0];
        const uid = uuidv4();

        connection.query("INSERT INTO `in_user`(`uid`,`email`,`password`,`username`) VALUES (?, ?, ?, ?);", [uid, email, doEncrypt(password), username], (err) => {
            connection.release;
            if (!err) {
                res.send({
                    "code": 200,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "User registered",
                    "result": {
                        "uid": uid,
                        "email": email
                    }
                })
            } else {
                if (err.code == "ER_DUP_ENTRY") {

                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "User already exists",
                        "result": null
                    })
                } else {
                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Registration failed",
                        "result": null
                    })
                }
            }
        })
    })
})

app.post('/api/v1/login', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { email, password } = req.body;

        connection.query("SELECT password,uid from `in_user` WHERE `email` = ?", [email], (err, rows) => {
            connection.release;
            if (!err) {
                if (rows[0] != null) {
                    if (rows[0] != null && checkPassword(password, rows[0].password)) {
                        res.send({
                            "code": 200,
                            "requestId": uuidv4(),
                            "time": unixTimestamp(),
                            "message": "Login successfully",
                            "result": {
                                "uid": rows[0].uid,
                                "email": email,
                            }
                        });
                    } else {
                        res.send({
                            "code": 400,
                            "requestId": uuidv4(),
                            "time": unixTimestamp(),
                            "message": "Invalid password",
                            "result": null
                        });
                    }
                } else {
                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Email not registered",
                        "result": null
                    });
                }
            } else {
                res.send({
                    "code": 400,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Failed to login",
                    "result": null
                });
            }
        })
    })
})

app.listen(port, () => { })