const puppeteer = require('puppeteer');
const fs = require('fs');

async function readJsonFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('meta_data.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

async function login(page, jsonData) {
	try {
		await page.goto(jsonData['login_url'], { waitUntil: 'networkidle2' });
		
		// Input the username
		await page.type(jsonData['username_selector'], username, { delay: 30 });
		
		// Input the password
		await page.type(jsonData['password_selector'], password, { delay: 30 });
		
		// Click the login button
		await page.click(jsonData['login_button']);
		
		// Wait for navigation to complete
		await page.waitForNavigation({ waitUntil: 'networkidle2' });
		
		console.log('Logged in successfully');
	} catch (error) {
		console.error('Error logging in:', error);
	}
}

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const jsonData = await readJsonFile();
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        // `--user-data-dir=C:\\Users\\Owner\\AppData\\Local\\Google\\Chrome\\User Data`,
        // `--profile-directory=Default`,
      ]
    });

    const page = await browser.newPage();
    const url = jsonData['login_url']
    await page.goto(url);

    await browser.close();
    fs.writeFile('linkedin_profiles.json', JSON.stringify(profileData, null, 2), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Data successfully saved to linkedin_profiles.json');
      }
    });

  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
