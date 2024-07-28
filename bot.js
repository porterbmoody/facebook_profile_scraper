const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const opn = require('opn');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const selectors = {
    username: "[aria-label='Email or phone number']",
    password: "[aria-label='Password']",
    login_button: "[name='login']",
    group_members: "[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']",
    profile_url: "[aria-label='View profile']",
    profile_name: "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']",
    marital_status: "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u x1yc453h']"
};

class Bot {
    constructor(response) {
        this.browser = null;
        this.page = null;
        this.response = response;
        this.profileDataPath = path.join(__dirname, 'profile_data.csv');
        this.profileDataPath = 'profile_data.csv';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // async autoScroll(selector, targetCount) {
        // const distance = 100;
        // const delay = 100;
    
        // async function scrollStep() {
            // const elements = document.querySelectorAll(selector);
    
            // if (elements.length >= targetCount) {
                // console.log(`Found ${elements.length} elements. Stopping scroll.`);
                // return;
            // }
    
            // const totalHeight = window.scrollY + window.innerHeight;
            // const scrollHeight = document.body.scrollHeight;
    
            // if (totalHeight < scrollHeight) {
                // window.scrollBy(0, distance);
                // setTimeout(scrollStep, delay);
            // } else {
                // console.log('Reached the bottom of the page.');
            // }
        // }
    
        // await scrollStep();
    // }


    async login() {
        try {
            await this.page.goto("https://www.facebook.com/", { waitUntil: 'networkidle2' });
            await this.page.type(selectors.username, this.response['username'], { delay: 30 });
            await this.page.type(selectors.password, this.response['password'], { delay: 30 });
            await this.page.click(selectors.login_button);
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async csvJSON(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        const result = lines.slice(1).map(line => {
            const currentline = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = currentline[index];
                return obj;
            }, {});
        });
        return result;
    }

    async read_existing_data() {
        console.log(`reading in existing data from path ${this.profileDataPath}`);
        const headers = ['profile_name', 'marital_status', 'group_profile_url', 'profile_url'];
        try {
            if (!fsSync.existsSync(this.profileDataPath)) {
                console.log(`File ${this.profileDataPath} does not exist. Creating it with headers row.`);
                await fs.writeFile(this.profileDataPath, headers.join(',') + '\n');
                this.existing_profile_data = headers.reduce((acc, header) => {
                    acc[header] = [];
                    return acc;
                }, {});
                return;
            }
    
            const csv = await fs.readFile(this.profileDataPath, 'utf8');
            const lines = csv.split('\n');
            const fileHeaders = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
            const result = fileHeaders.reduce((acc, header) => {
                acc[header] = [];
                return acc;
            }, {});
    
            lines.slice(1).forEach(line => {
                const currentline = line.split(',').map(cell => cell.replace(/"/g, '').trim());
                fileHeaders.forEach((header, index) => {
                    if (currentline[index] !== undefined) {
                        result[header].push(currentline[index]);
                    }
                });
            });
    
            this.existing_profile_data = result;
            console.log(this.existing_profile_data);
        } catch (error) {
            console.error('Error reading CSV:', error);
            throw error;
        }
    }

    async view_all_members() {
        try {
            await this.page.goto(this.response['group_url'], { waitUntil: 'networkidle2' });
            console.log('scrolling');
            let continue_scrolling = true;
            while (continue_scrolling) {
                const elements = await this.page.$$(selectors['group_members']);
                const isAtBottom = await this.page.evaluate(() => {
                    const scrollHeight = document.documentElement.scrollHeight;
                    const scrollTop = window.scrollY;
                    const clientHeight = window.innerHeight;
                    return scrollHeight - scrollTop <= clientHeight + 100; // 100px threshold
                });
                if (isAtBottom) {
                    console.log('Reached the bottom of the page. Stopping scroll.');
                    continue_scrolling = false;
                } else {
                    await this.page.evaluate(() => window.scrollBy(0, 1000));
                    console.log(`total members found: ${elements.length}`);
                    await this.sleep(1000);
                }
                if (elements.length >= this.response['profiles_to_scrape']) {
                    console.log(`Found ${elements.length} elements. Stopping scroll.`);
                    continue_scrolling = false;
                }
            }
            console.log('done scrolling');
        } catch (error) {
            console.error('Error during scrolling:', error);
        }
    }
    
    async scrape_group_profile_urls() {
        console.log('Finding URLs to scrape...');

        await this.sleep(3000);
        const elements = await this.page.$$(selectors.group_members);
        const urls = new Set();
        for (let element of elements) {
            const href = await this.page.evaluate(el => el.href, element);
            if (href && href.includes('groups') && !this.existing_profile_data['group_profile_url'].includes(href)) {
                urls.add(href);
            }
        }
        this.group_profile_urls = Array.from(urls);
    }

    async scrapeProfileData() {
        try {
            console.log("possible profiles to scrape:", this.group_profile_urls.length);
            console.log("input number to scrape:", this.response['profiles_to_scrape']);
            console.log(`over ${this.response['hours_to_scrape']} hours`);
            
            const totalRunTimeInMilliseconds = this.response['hours_to_scrape'] * 60 * 60 * 1000;
            const timeBetweenScrapesInMilliseconds = totalRunTimeInMilliseconds / this.response['profiles_to_scrape'];

            console.log(`Time between scrapes is set to ${timeBetweenScrapesInMilliseconds / 1000} seconds`);
    
            let pagesScraped = 0;
            const startTime = Date.now();
    
            for (const group_profile_url of this.group_profile_urls) {
                const elapsedTime = Date.now() - startTime;
                // if (elapsedTime > totalRunTimeInMilliseconds) {
                    // console.log('Total bot runtime exceeded. Ending process.');
                    // break;
                // }
    
                try {
                    console.log(`Waiting for ${timeBetweenScrapesInMilliseconds / 1000} seconds before next profile...`);
                    await this.sleep(timeBetweenScrapesInMilliseconds);
    
                    await this.page.goto(group_profile_url, { waitUntil: 'networkidle2' });
                    await this.page.waitForSelector(selectors.profile_url, { timeout: 10000 });
    
                    const profile_url = await this.page.$eval(selectors.profile_url, element => element.href);
                    await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
                    await this.page.waitForSelector(selectors.profile_name, { timeout: 5000 });
                    const profile_name = await this.page.$eval(selectors.profile_name, element => element.textContent.trim());
                    console.log(`Scraping...${profile_name}`);
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
                            return 'not specified';
                        } catch (error) {
                            console.error('Error evaluating marital status:', error);
                            return 'Error retrieving status';
                        }
                    }, selectors.marital_status);
    
                    const new_row = { profile_name, marital_status, group_profile_url, profile_url };
    
                    // Append new row to existing profile data and save as CSV
                    await this.updateCSV(new_row);
    
                    pagesScraped++;
                    if (pagesScraped == this.response['profiles_to_scrape']) {
                        console.log('Unable to scrape the specified number of pages within the given URLs.');
                        break;
                    }
                } catch (error) {
                    console.error(`Error scraping profile: ${group_profile_url}`, error);
                }
            }
    
        } catch (error) {
            console.error("Error scraping group profile URLs:", error);
        }
    }
    

    async updateCSV(newRow) {
        try {
            // Append new row to existing profile data
            for (const key in newRow) {
                if (newRow.hasOwnProperty(key) && this.existing_profile_data.hasOwnProperty(key)) {
                    this.existing_profile_data[key].push(newRow[key]);
                }
            }
    
            // Convert existing profile data to CSV format
            const headers = Object.keys(this.existing_profile_data);
            const csv = headers.join(',') + '\n' + this.existing_profile_data[headers[0]].map((_, i) =>
                headers.map(header => this.existing_profile_data[header][i]).join(',')
            ).join('\n');
    
            // Save the updated CSV file
            await fs.writeFile(this.profileDataPath, csv);
            console.log('CSV file updated successfully.');
        } catch (error) {
            console.error('Error updating CSV file:', error);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async openBrowser() {
        console.log(`Starting Puppeteer...`);
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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

    async filterAndSaveCSV() {
        try {
            // Filter out rows where marital_status is 'not specified'
            const filteredData = {};
            const numRows = this.existing_profile_data['marital_status'].length;

            // Initialize the filteredData object with empty arrays for each header
            Object.keys(this.existing_profile_data).forEach(header => {
                filteredData[header] = [];
            });

            for (let i = 0; i < numRows; i++) {
                if (this.existing_profile_data['marital_status'][i] !== 'not specified') {
                    Object.keys(this.existing_profile_data).forEach(header => {
                        filteredData[header].push(this.existing_profile_data[header][i]);
                    });
                }
            }

            // Convert filtered data to CSV format
            const headers = Object.keys(filteredData);
            const csv = headers.join(',') + '\n' + filteredData[headers[0]].map((_, i) =>
                headers.map(header => filteredData[header][i]).join(',')
            ).join('\n');

            // Save the filtered data to a new CSV file
            await fs.writeFile('filtered_profile_data.csv', csv);
            console.log('Filtered CSV file saved successfully.');
        } catch (error) {
            console.error('Error saving filtered CSV file:', error);
        }
    }

    async runBot() {
        try {
            await this.openBrowser();
            await this.login();
            await this.read_existing_data();
            await this.view_all_members();
            await this.scrape_group_profile_urls()
            await this.scrapeProfileData();
            await this.filterAndSaveCSV();   
        } catch (error) {
            console.error('An error occurred:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

function closeServer() {
    console.log('Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run-bot', async (req, res) => {
    try {
        console.log(req.body);
        const bot = new Bot(req.body);
        await bot.runBot();
        res.send('Bot execution completed successfully!');
        closeServer();
    } catch (error) {
        console.error('Error running bot:', error);
        res.status(500).send('Error running bot');
        closeServer();
    }
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    opn(`http://localhost:${port}`);
});


// const bot = new Bot({
//     username: 'porterbmoody@gmail.com',
//     password: 'Yoho1mes',
//     group_url: 'https://www.facebook.com/groups/344194813025772/members/',
//     profiles_to_scrape: '5',
//     hours_to_scrape: '.01'
//   });
// bot.runBot();

