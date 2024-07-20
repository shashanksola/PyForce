require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const { lstatSync, readdirSync, createReadStream } = require('fs');

const PACKAGES = process.env.PACKAGES;
const BUCKET_NAME = process.env.BUCKET_NAME;
const PROJECT_ID = process.env.PROJECT_ID;

function publishLog(log) {
    console.log(log);
}

async function init() {
    console.log('Copying files from S3 Bucket')

    const outDirPath = path.join(__dirname, 'output');
    const fileDirPath = path.join(__dirname);

    const packageInstaller = exec(`pip install ${PACKAGES}`);

    packageInstaller.on('data', (data) => {
        console.log(data);
    })

    packageInstaller.on('error', (error) => {
        console.log(error);
    })

    packageInstaller.on('close', async () => {
        console('All Pacckages installed Successfully');
    })

    const executePythonFile = exec(`python main.py`);

    executePythonFile.on('data', (data) => {
        console.log(data);
    })

    executePythonFile.on('error', (error) => {
        console.log(error);
    })

    executePythonFile.on('close', async () => {
        console('Excecution Completed');

        let distFolderPath;
        let distFolderContents;

        try {
            distFolderPath = path.join(__dirname);
            distFolderContents = readdirSync(distFolderPath, { recursive: true });
        } catch (e) {
            console.error(`Cannot Find Current Working Directory Terminating..`);
            process.exit(1);
        }

        publishLog('Starting to Upload Output Files...');
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);
            if (lstatSync(filePath).isDirectory()) continue;
            if (filePath.endsWith('main.sh') | filePath.endsWith('main.py') | filePath.endsWith('.env') | filePath.endsWith('package.json') | filePath.endsWith('package-lock.json')) continue;
            console.log('Uploading ', filePath);
            publishLog(`Uploading ${file}`);

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            });

            await s3Client.send(command);
        }

        publishLog(`S3 Upload Successfull`);
        process.exit(0);
    })
}

init();