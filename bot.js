const fs = require('fs');
const puppeteer = require('puppeteer');
const { parse } = require('json2csv');

class Bot {
	constructor() {
		this.browser = null;
		this.page = null;
	}

	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	getRandomDelay(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	async autoScroll() {
		await this.page.evaluate(async () => {
			await new Promise((resolve) => {
				var totalHeight = 0;
				var distance = 100;
				var timer = setInterval(() => {
					var scrollHeight = document.body.scrollHeight;
					window.scrollBy(0, distance);
					totalHeight += distance;

					if (totalHeight >= scrollHeight - window.innerHeight) {
						clearInterval(timer);
						resolve();
					}
				}, 100);
			});
		});
	}

	async readJsonFile() {
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

	async login(jsonData) {
		try {
			await this.page.goto(jsonData['login_url'], { waitUntil: 'networkidle2' });
			await this.page.type(jsonData['username_selector'], jsonData['username'], { delay: 30 });
			await this.page.type(jsonData['password_selector'], jsonData['password'], { delay: 30 });
			await this.page.click(jsonData['login_button']);
			await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
		} catch (error) {
			console.error('Error logging in:', error);
		}
	}

	async scrapeGroupProfileURLs(jsonData) {
		await this.page.goto(jsonData['group_url'], { waitUntil: 'networkidle2' });
		await this.page.waitForSelector(jsonData['profile_card_selector'], { timeout: 10000 });

		await this.autoScroll();
		const groupProfileURLs = await this.page.evaluate((selector) => {
			const elements = document.querySelectorAll(selector);
			const urls = new Set();
			for (let i = 0; i < elements.length; i++) {
				const href = elements[i].href;
				if (href && href.includes('groups')) {
					urls.add(href);
				}
			}
			return Array.from(urls);
		}, jsonData['profile_card_selector']);
		console.log("unique profile urls found: ");
		console.log(groupProfileURLs.length);
		return groupProfileURLs;
	}

	async scrapeProfileData(jsonData, groupProfileURLs) {
		await this.page.waitForSelector(jsonData['profile_card_selector'], { timeout: 10000 });
		const profileData = [];

		for (const groupProfileURL of groupProfileURLs) {
			try {
				const delay = this.getRandomDelay(3000, 5000);
				console.log(`Waiting for ${delay / 1000} seconds before next profile...`);
				await this.sleep(delay);
				await this.page.goto(groupProfileURL, { waitUntil: 'networkidle2' });
				await this.page.waitForSelector(jsonData['view_profile_selector'], { timeout: 10000 });
				const profile_url = await this.page.$eval(jsonData['view_profile_selector'], element => element.href);
				await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
				await this.page.waitForSelector(jsonData['profile_name_selector_group_profiles'], { timeout: 5000 });
				const profile_name = await this.page.$eval(jsonData['profile_name_selector_group_profiles'], element => element.textContent.trim());

				await this.page.waitForSelector(jsonData['other_details'], { timeout: 5000 });

				const marital_status = await this.page.evaluate((selector) => {
					const elements = document.querySelectorAll(selector);
					for (let element of elements) {
						const text = element.textContent.trim().toLowerCase();
						if (text.includes('married')) {
							return text;
						}
					}
					return 'Not specified';
				}, jsonData['other_details']);

				profileData.push({ profile_name: profile_name, profile_url: profile_url, marital_status: marital_status });
			} catch (error) {
				console.error(`Error scraping profile: ${groupProfileURL}`, error);
			}
		}
		await this.saveToCsv(profileData);
	}

	async saveToCsv(data) {
		try {
			const csv = parse(data);
			fs.writeFileSync('profile_data.csv', csv);
			console.log('CSV file saved successfully.');
		} catch (error) {
			console.error('Error saving CSV file:', error);
		}
	}

	async runBot() {
		try {
			await new Promise(resolve => setTimeout(resolve, 2000));
			const jsonData = await this.readJsonFile();

			this.browser = await puppeteer.launch({
				headless: false,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-notifications'
				]
			});
			this.page = await this.browser.newPage();
			await this.login(jsonData);

			const groupProfileURLs = await this.scrapeGroupProfileURLs(jsonData);
			await this.scrapeProfileData(jsonData, groupProfileURLs);

		} catch (error) {
			console.error('An error occurred:', error);
		} finally {
			if (this.browser) {
				await this.browser.close();
			}
		}
	}
}

(async () => {
	const scraper = new Bot();
	await scraper.runBot();
})();
