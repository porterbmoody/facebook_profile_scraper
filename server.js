
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

        data.username = username;
        data.password = password;
        data.group_url = group_url;
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error updating meta_data.json:', error);
        res.status(500).send('Error updating meta_data.json');
    }
    await runBot();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

