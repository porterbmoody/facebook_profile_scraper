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
	await page.waitForSelector(jsonData['profile_card_selector'], { timeout: 10000 });
	const profileURLs = await page.evaluate((selector) => {
		return Array.from(document.querySelectorAll(selector))
		.map(element => element.href)
		.filter(href => href);
	}, jsonData['profile_card_selector']);
	return profileURLs;
}

async function scrapeProfiles(page, jsonData) {
	await page.goto(jsonData['group_url'], { waitUntil: 'networkidle2' });
	console.log('Scraping profile URLs...');
	const profileURLs = await scrapeProfileURLs(page, jsonData);
	const profileData = [];
	console.log('number of profile urls...')
	console.log(profileURLs.length);
	for (const profile_url of profileURLs.slice(0, 2)) {
		try {
		console.log(`Visiting: ${profile_url}`);
		await page.goto(profile_url, { waitUntil: 'networkidle2' });
		await page.waitForSelector(jsonData['profile_name'], { timeout: 5000 });
		const profile_name = await page.$eval(jsonData['profile_name'], el => el.textContent.trim());
		console.log(`Name: ${profile_name}`);
		profileData.push({ profile_name: profile_name });
		// await sleep(10000);
		} catch (error) {
		console.error(`Error scraping profile: ${profile_url}`, error);
		}
	}
	console.log('Saving profile data to CSV...');
	await saveToCsv(profileData);
}

async function saveToCsv(profileData) {
	// Convert data to CSV format with headers
	const csvHeader = 'name';
	const csvRows = profileData.map(row => `${row.name}`);
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

		// await browser.close();
	} catch (error) {
		console.error('An error occurred:', error);
	}
})();
