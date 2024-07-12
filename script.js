document.getElementById('scraper-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('hello');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const groupUrl = document.getElementById('group_url').value;

    document.getElementById('result').innerText = 'Running the bot...';

    const response = await fetch('/start-scraping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, groupUrl })
    });

    const result = await response.json();
    document.getElementById('result').innerText = result.message;
});


