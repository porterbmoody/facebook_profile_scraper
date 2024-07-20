const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const opn = require('opn');
const puppeteer = require('puppeteer');
const { parse } = require('json2csv');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const SELECTORS = {
    EMAIL_INPUT: "[aria-label='Email or phone number']",
    PASSWORD_INPUT: "[aria-label='Password']",
    LOGIN_BUTTON: "[name='login']",
    GROUP_MEMBERS: "[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']",
    PROFILE_URL: "[aria-label='View profile']",
    PROFILE_NAME: "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']",
    MARITAL_STATUS: "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u x1yc453h']"
};

class Bot {
    constructor(response) {
        this.browser = null;
        this.page = null;
        this.response_data = { 
            username: response.username, 
            password: response.password, 
            group_url: response.group_url, 
            time_between: response.time_between 
        };
        console.log(this.response_data);
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

    async login() {
        try {
            await this.page.goto("https://www.facebook.com/", { waitUntil: 'networkidle2' });
            await this.page.type(SELECTORS.EMAIL_INPUT, this.response_data['username'], { delay: 30 });
            await this.page.type(SELECTORS.PASSWORD_INPUT, this.response_data['password'], { delay: 30 });
            await this.page.click(SELECTORS.LOGIN_BUTTON);
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async scrapeGroupProfileURLs() {
        console.log(`Opening group URL ${this.response_data['group_url']}`);
        await this.page.goto(this.response_data['group_url'], { waitUntil: 'networkidle2' });
        await this.page.waitForSelector(SELECTORS.GROUP_MEMBERS, { timeout: 10000 });
        // await this.autoScroll();
        // await this.sleep(2000);

        const groupProfileURLs = await this.page.evaluate((selector) => {
            const elements = document.querySelectorAll(selector);
            const urls = new Set();
            elements.forEach(element => {
                const href = element.href;
                if (href && href.includes('groups')) {
                    urls.add(href);
                }
            });
            return Array.from(urls);
        }, SELECTORS.GROUP_MEMBERS);
    
        return groupProfileURLs;
    }

    async scrapeProfileData() {
        const groupProfileURLs = await this.scrapeGroupProfileURLs();
        console.log("Unique profile URLs to scrape:", groupProfileURLs.length);
        this.scrapedData = [];
    
        for (const groupProfileURL of groupProfileURLs) {
            try {
                console.log(`Waiting for ${this.response_data['time_between']} seconds before next profile...`);
                await this.sleep(this.response_data['time_between'] * 1000);
    
                await this.page.goto(groupProfileURL, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector(SELECTORS.PROFILE_URL, { timeout: 10000 });
    
                const profile_url = await this.page.$eval(SELECTORS.PROFILE_URL, element => element.href);
                await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector(SELECTORS.PROFILE_NAME, { timeout: 5000 });

                const profile_name = await this.page.$eval(SELECTORS.PROFILE_NAME, element => element.textContent.trim());
                console.log(`Scraping...${profile_name}`);
                await this.page.waitForSelector(SELECTORS.MARITAL_STATUS, { timeout: 5000 });
    
                const marital_status = await this.page.evaluate((selector) => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (let element of elements) {
                            const text = element.textContent.trim().toLowerCase();
                            if (text.includes('married')) {
                                return 'Married';
                            } else if (text.includes('single')) {
                                return 'Single';
                            }
                        }
                        return 'Not specified';
                    } catch (error) {
                        console.error('Error evaluating marital status:', error);
                        return 'Error retrieving status';
                    }
                }, SELECTORS.MARITAL_STATUS);

                const new_row = { profile_name, marital_status, profile_url };
                this.scrapedData.push(new_row);
                await this.updateCSV();
            } catch (error) {
                console.error(`Error scraping profile: ${groupProfileURL}`, error);
            }
        }
    }

    async openBrowser() {
        console.log(`Starting Puppeteer...`);
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-notifications'
            ]
        });
        console.log(`Opening browser...`);
        this.page = await this.browser.newPage();
        console.log(`Logging in...`);
    }

    async updateCSV() {
        try {
            const csv = parse(this.scrapedData);
            await fs.writeFile('profile_data.csv', csv);
            console.log('CSV file saved successfully.');
        } catch (error) {
            console.error('Error saving CSV file:', error);
        }
    }

    async runBot() {
        try {
            await this.openBrowser();
            await this.login();
            await this.scrapeProfileData();
        } catch (error) {
            console.error('An error occurred:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run-bot', async (req, res) => {
    try {
        const bot = new Bot(req.body);
        await bot.runBot();
        res.send('Bot execution completed successfully!');
    } catch (error) {
        console.error('Error running bot:', error);
        res.status(500).send('Error running bot');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    opn(`http://localhost:${port}`);
});
