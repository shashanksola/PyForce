require('dotenv').config();
const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { z } = require('zod');

const databasePath = path.join(__dirname, 'compiler.db');

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
    const schema = z.object({
        username: z.string().max(32).min(8),
        password: z.string()
    })

    const isSafe = schema.safeParse(req.body);

    if (isSafe.error) {
        res.status(400);
        res.send(isSafe.error);
        return;
    }

    const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`
    const databaseUser = await database.get(getUserQuery);

    if (databaseUser === undefined) {
        res.status(400);
        res.send("User Does Not Exist");
    } else {
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
    const schema = z.object({
        username: z.string().max(32).min(8),
        password: z.string(),
        gender: z.string().isOptional(),
        location: z.string().isOptional()
    })

    const isSafe = schema.safeParse(req.body);

    if (isSafe.error) {
        res.status(400);
        res.send(isSafe.error);
        return;
    }

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

app.post('/new-project/', async (req, res) => {
    const { projectName, username } = req.body;

    createS3Folder(projectName, username);
})

app.post('/compile/', checkJWT, async (req, res) => {
    const { s3Link, packages, id } = req.body;

    uploadToS3();
})

initializeDbAndServer();