const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/run-bot', async (req, res) => {
    const { username, password, group_url } = req.body;
    
    console.log('Received request to run bot with:', { username, password, groupUrl });

    try {
        // Path to your meta_data.json file
        const filePath = path.join(__dirname, 'meta_data.json');

        // Read existing data
        let data = {};
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // If file doesn't exist or is invalid, we'll use an empty object
            console.log('Creating new meta_data.json file');
        }

        // Update the data
        data.username = username;
        data.password = password;
        data.group_url = group_url;

        // Write the updated data back to the file
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

        res.send('Bot execution completed successfully! meta_data.json updated.');
    } catch (error) {
        console.error('Error updating meta_data.json:', error);
        res.status(500).send('Error updating meta_data.json');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});