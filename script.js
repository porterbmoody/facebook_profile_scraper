const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/start-scraping', (req, res) => {
    const { email, password, groupUrl } = req.body;
    console.log('hello');

    // exec(`node bot.js "${email}" "${password}" "${groupUrl}"`, (error, stdout, stderr) => {
        // if (error) {
            // console.error(`exec error: ${error}`);
            // return res.status(500).send(`Error: ${error.message}`);
        // }
        // if (stderr) {
            // console.error(`stderr: ${stderr}`);
            // return res.status(500).send(`Error: ${stderr}`);
        // }
        // res.send(`Scraping completed. Output: ${stdout}`);
    // });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

async function runBot() {

}
