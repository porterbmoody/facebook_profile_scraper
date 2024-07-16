const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const opn = require('opn');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run-bot', async (req, res) => {
    const { username, password, group_url, number_of_hours } = req.body;

    console.log('Received request to run bot with:', { username, password, group_url, number_of_hours });

    try {
        const filePath = path.join(__dirname, 'meta_data.json');

        let data = {};
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log('Creating new meta_data.json file');
        }

        data.username = username;
        data.password = password;
        data.group_url = group_url;
        data.number_of_hours = number_of_hours;

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

        // Use an absolute path to ensure the correct file is being executed
        const botScriptPath = path.join(__dirname, 'bot.js');

        const botProcess = spawn('node', [botScriptPath]);

        botProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            res.write(data);
        });

        botProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            res.write(`stderr: ${data}`);
        });

        botProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            res.end('Bot execution completed successfully!');
        });

    } catch (error) {
        console.error('Error updating meta_data.json:', error);
        res.status(500).send('Error updating meta_data.json');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    opn(`http://localhost:${port}`);
});
