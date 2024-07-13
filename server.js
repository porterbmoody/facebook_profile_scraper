const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/run-bot', async (req, res) => {
    const { username, password, group_url } = req.body;
    
    console.log('Received request to run bot with:', { username, password, group_url });

    try {
        const filePath = path.join(__dirname, 'meta_data.json');

        let data = {};
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log('Creating new meta_data.json file');
        }

        // Update the data
        data.username = username;
        data.password = password;
        data.group_url = group_url;

        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

        console.log('meta_data.json updated. Now running the bot.');

        // Execute the bot script
        exec('node bot.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                res.status(500).send('Error running the bot.');
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.send('Bot execution completed successfully!');
        });

    } catch (error) {
        console.error('Error updating meta_data.json:', error);
        res.status(500).send('Error updating meta_data.json');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
