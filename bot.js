const puppeteer = require('puppeteer');
const fs = require('fs');
const { json } = require('stream/consumers');
const { parse } = require('json2csv');

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
		console.log('loggin in...');
		await page.goto(jsonData['login_url'], { waitUntil: 'networkidle2' });
		await page.type(jsonData['username_selector'], jsonData['username'], { delay: 30 });
		await page.type(jsonData['password_selector'], jsonData['password'], { delay: 30 });
		await page.click(jsonData['login_button']);
		await page.waitForNavigation({ waitUntil: 'networkidle2' });
		console.log('login successful');
	} catch (error) {
		console.error('Error logging in:', error);
	}
}

async function scrapeGroupProfileURLs(page, jsonData) {
	await page.goto(jsonData['group_url'], { waitUntil: 'networkidle2' });
	await page.waitForSelector(jsonData['profile_card_selector'], { timeout: 10000 });

	const groupProfileURLs = await page.evaluate((selector) => {
		const elements = document.querySelectorAll(selector);
		const urls = [];

		for (let i = 0; i < elements.length; i++) {
			const href = elements[i].href;
			if (href && href.includes('groups')) {
				urls.push(href);
			}
		}

		return urls;
	}, jsonData['profile_card_selector']);

	return groupProfileURLs.slice(0, 3);
}

async function scrapeProfileData(page, jsonData, groupProfileURLs) {
	await page.waitForSelector(jsonData['profile_card_selector'], { timeout: 10000 });
	const profileData = [];
	for (const groupProfileURL of groupProfileURLs) {
		try {
			// console.log(`Visiting: ${groupProfileURL}`);
			await page.goto(groupProfileURL, { waitUntil: 'networkidle2' });
			await page.waitForSelector(jsonData['view_profile_selector'], { timeout: 10000 });
			const profile_url = await page.$eval(jsonData['view_profile_selector'], element => element.href);
			// await sleep(4000);
			await page.goto(profile_url, { waitUntil: 'networkidle2' });
			await page.waitForSelector(jsonData['profile_name_selector'], { timeout: 5000 });
			const profile_name = await page.$eval(jsonData['profile_name_selector'], element => element.textContent.trim());

			await page.waitForSelector(jsonData['other_detials'], { timeout: 5000 });

			const marital_status = await page.evaluate((selector) => {
				const elements = document.querySelectorAll(selector);
				for (let element of elements) {
					const text = element.textContent.trim().toLowerCase();
					if (text.includes('married')) {
						return text;
					}
				}
				return 'Not specified';
			}, jsonData['other_detials']);
			console.log(marital_status);
			// console.log(`profile_name: ${profile_name}`);
			// console.log(`profile_url: ${profile_url}`);
			profileData.push({ profile_name: profile_name, profile_url: profile_url, marital_status: marital_status }); 
		} catch (error) {
			console.error(`Error scraping profile: ${groupProfileURL}`, error);
		}
	}
	// console.log(profileData);
	await saveToCsv(profileData);
}

async function saveToCsv(data) {
	try {
		const csv = parse(data);
		fs.writeFileSync('profile_data.csv', csv);
		console.log('CSV file saved successfully.');
	} catch (error) {
		console.error('Error saving CSV file:', error);
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
				'--disable-setuid-sandbox',
				'--disable-notifications'
			]
		});
		const page = await browser.newPage();
		await login(page, jsonData);
		const groupProfileURLs = await scrapeGroupProfileURLs(page, jsonData);
		// console.log(groupProfileURLs);
		await scrapeProfileData(page, jsonData, groupProfileURLs);

		// await browser.close();
	} catch (error) {
		console.error('An error occurred:', error);
	}
})();
