const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv');

const databasePath = path.join(__dirname, 'compiler.db');
console.log(databasePath);

let database = null;
const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
    try {
        database = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });

        app.listen(2873, () =>
            console.log("Server Running at http://localhost:2873/")
        );
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    }
};

app.post('/login/', async (req, res) => {
    const { username, password } = req.body;

    const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`
    const databaseUser = database.get(getUserQuery);

    if (databaseUser === undefined) {
        res.status(400);
        res.send("User Does Not Exist");
    } else {
        console.log(databaseUser);
        const isPasswordMathced = await bcrypt.compare(password, databaseUser.password);


        if (isPasswordMathced) {
            const payload = {
                username: username
            }

            const jwtToken = jwt.sign(payload, process.env.SECRET)
            res.send({ jwtToken });
        } else {
            res.status(400);
            res.send("Invalid Password");
        }
    }
});

app.post("/register/", async (request, response) => {
    const { username, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await database.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
        INSERT INTO 
          user (username, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
        const dbResponse = await database.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send(`Created new user with ${newUserId}`);
    } else {
        response.status = 400;
        response.send("User already exists");
    }
});

initializeDbAndServer();