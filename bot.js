const puppeteer = require('puppeteer');
const fs = require('fs');
const { json } = require('stream/consumers');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }

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
		console.log('Logging in');
		await page.goto(jsonData['login_url'], { waitUntil: 'networkidle2' });
		await page.type(jsonData['username_selector'], jsonData['username'], { delay: 30 });
		await page.type(jsonData['password_selector'], jsonData['password'], { delay: 30 });
		await page.click(jsonData['login_button']);
		await page.waitForNavigation({ waitUntil: 'networkidle2' });
		console.log('Logged in successfully');
	} catch (error) {
		console.error('Error logging in:', error);
	}
}

async function scrapeProfileURLs(page, jsonData) {
	await page.waitForSelector(jsonData['profile_selector'], { timeout: 10000 });  // Wait up to 10 seconds for the selector to be available
	const profileURLs = await page.evaluate((selector) => {
	  return Array.from(document.querySelectorAll(selector))
		.map(element => element.href)
		.filter(href => href);
	}, jsonData['profile_selector']);
	return profileURLs;
  }

  async function scrapeProfiles(page, jsonData) {
	await page.goto(jsonData['profiles_search_url'], { waitUntil: 'networkidle2' });
  
	const profileData = [];
	console.log('Scraping profile URLs...');
	const profileURLs = await scrapeProfileURLs(page, jsonData);
  
	for (const url of profileURLs) {
	  try {
		console.log(url);
		await page.goto(url, { waitUntil: 'networkidle2' });
		console.log(`Visiting: ${url}`);
		await page.waitForSelector('h1', { timeout: 5000 });  // Ensure 'h1' is present
		const name = await page.$eval('h1', el => el.textContent.trim());  // Extract text from 'h1'
		console.log(`Name: ${name}`);
		profileData.push({ name, profile_url: url });  // Save name and URL
		await sleep(3000);  // Sleep for 3 seconds between requests
	  } catch (error) {
		console.error(`Error scraping profile: ${url}`, error);  // Log any errors
	  }
	}
  
	// console.log(profileData);  // Log the collected profile data
	await saveToCsv(profileData);  // Save the collected profile data to CSV
  }
  
  async function saveToCsv(profileData) {
	// Convert data to CSV format with headers
	const csvHeader = 'name,profile_url';
	const csvRows = profileData.map(row => `${row.name},${row.profile_url}`);
	const csvContent = [csvHeader, ...csvRows].join('\n');
  
	// Write the CSV content to a file
	fs.writeFileSync('profile_data.csv', csvContent);
	console.log('Profile data saved to profile_data.csv');
  }

(async () => {
	try {
		await new Promise(resolve => setTimeout(resolve, 2000));
		const jsonData = await readJsonFile();
		const browser = await puppeteer.launch({
			headless: false,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-notifications'
				// `--user-data-dir=C:\\Users\\Owner\\AppData\\Local\\Google\\Chrome\\User Data`,
				// `--profile-directory=Default`,
			]
		});
		const page = await browser.newPage();
		await login(page, jsonData);
		// const profileURLs = scrapeProfileURLs(page, jsonData);
		// const profileURLs = scrapeProfileURLs(page, jsonData);
		await scrapeProfiles(page, jsonData);

		await browser.close();
	} catch (error) {
		console.error('An error occurred:', error);
	}
})();
