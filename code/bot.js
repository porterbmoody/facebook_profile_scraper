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

    async login(username, password) {
        try {
            await this.page.goto("https://www.facebook.com/", { waitUntil: 'networkidle2' });
            await this.page.type("[aria-label='Email or phone number']", username, { delay: 30 });
            await this.page.type("[aria-label='Password']", password, { delay: 30 });
            await this.page.click("[name='login']");
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async scrapeGroupProfileURLs(group_url) {
        await this.page.goto(group_url, { waitUntil: 'networkidle2' });
        await this.page.waitForSelector("[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']", { timeout: 10000 });
        // await this.autoScroll();
        // await this.sleep(2000);
        // await this.autoScroll();
        // await this.sleep(2000);
        // await this.autoScroll();

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
        }, "[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']");
    
        return groupProfileURLs;
    }

    async scrapeProfileData(number_of_hours, group_url) {
        const groupProfileURLs = await this.scrapeGroupProfileURLs(group_url);
        const totalProfiles = groupProfileURLs.length;
        const totalSecondsInDay = number_of_hours * 60 * 60;
        const delayBetweenProfiles = totalSecondsInDay / totalProfiles * 1000;
        console.log("Unique profile URLs to scrape:");
        console.log(groupProfileURLs.length);
        await this.page.waitForSelector("[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']", { timeout: 10000 });
        const profileData = [];
    
        for (const groupProfileURL of groupProfileURLs) {
            try {
                console.log(`Waiting for ${delayBetweenProfiles / 1000} seconds before next profile...`);
                await this.sleep(delayBetweenProfiles);
    
                await this.page.goto(groupProfileURL, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector("[aria-label='View profile']", { timeout: 10000 });
    
                const profile_url = await this.page.$eval("[aria-label='View profile']", element => element.href);
                await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector("[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']", { timeout: 5000 });
    
                const profile_name = await this.page.$eval("[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']", element => element.textContent.trim());

                await this.page.waitForSelector("[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u x1yc453h']", { timeout: 5000 });
    
                const marital_status = await this.page.evaluate((selector) => {
                    const elements = document.querySelectorAll(selector);
                    for (let element of elements) {
                        const text = element.textContent.trim().toLowerCase();
                        if (text.includes('married')) {
                            return text;
                        }
                    }
                    return 'Not specified';
                }, "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u x1yc453h']");
    
                profileData.push({ profile_name: profile_name, profile_url: profile_url, marital_status: marital_status });
            } catch (error) {
                console.error('Error scraping profile: ${groupProfileURL}, error');
            }
        }
    
        await this.saveToCsv(profileData);
    }

    async saveToCsv(data) {
        try {
            const csv = parse(data);
            await fs.writeFile('profile_data.csv', csv);
            console.log('CSV file saved successfully.');
        } catch (error) {
            console.error('Error saving CSV file:', error);
        }
    }

    async runBot(username, password, group_url, number_of_hours) {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-notifications'
                ]
            });
            this.page = await this.browser.newPage();
            await this.login(username, password);

            await this.scrapeProfileData(number_of_hours, group_url);

        } catch (error) {
            console.error('An error occurred:', error);
        }
        this.browser.close(); //finally {
            // if (this.browser) {
                // await 
            // }
        // }
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run-bot', async (req, res) => {
    const { username, password, group_url, number_of_hours } = req.body;

    console.log('Received request to run bot with:', { username, password, group_url, number_of_hours });

    try {
        const bot = new Bot();
        await bot.runBot(username, password, group_url, number_of_hours);
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
