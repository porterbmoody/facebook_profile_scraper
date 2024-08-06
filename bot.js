const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const opn = require('opn');
const puppeteer = require('puppeteer');
const { promisify } = require('util');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

class Bot {
    constructor(response) {
        this.browser = null;
        this.page = null;
        this.response = response;
        this.profileDataPath = path.join(__dirname, 'profile_data.csv');
        this.profileDataPath = 'profile_data.csv';
        this.log_file = 'logs/log_file.txt';
        if (!fsSync.existsSync(this.log_file)) {
            fsSync.mkdirSync('logs');
            console.log('Folder created successfully!');
          } else {
            console.log('Folder already exists.');
          }
        fs.writeFile(this.log_file, '');
        this.log(`username: ${this.response['username']}`);
        this.meta_data = {
            "login_url": "https://www.facebook.com/",
            "username": "[aria-label='Email or phone number']",
            "password": "[aria-label='Password']",
            "login_button": "[name='login']",
            "group_members": "[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']",
            "profile_url": "[aria-label='View profile']",
            "profile_name": "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']",
            "detail_element": "[class='x9f619 x1n2onr6 x1ja2u2z x78zum5 x2lah0s x1nhvcw1 x1qjc9v5 xozqiw3 x1q0g3np xyamay9 xykv574 xbmpl8g x4cne27 xifccgj']",
            "heart_icon": "[src='https://static.xx.fbcdn.net/rsrc.php/v3/yq/r/S0aTxIHuoYO.png']",
            "relationship_title_status": "[class='xieb3on x1gslohp']",
            "relationship_status": "[class=['x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u']",
            "tabs": "[class='x1i10hfl xe8uvvx xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz xjyslct xjbqb8w x18o3ruo x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1heor9g x1ypdohk xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x1n2onr6 x16tdsg8 x1hl2dhg x1vjfegm x3nfvp2 xrbpyxo x1itg65n x16dsc37']",
            // "detail_tab": "[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen x1s688f xi81zsa']",
            "details_tab": "[class='x1i10hfl xe8uvvx xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz xjyslct xjbqb8w x18o3ruo x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1heor9g x1ypdohk xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x1n2onr6 x16tdsg8 x1hl2dhg x1vjfegm x3nfvp2 xrbpyxo x1itg65n x16dsc37']",
            "relationships_tab": "[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xe8uvvx xdj266r x11i5rnm x1mh8g0r x16tdsg8 x1hl2dhg xggy1nq x87ps6o x1lku1pv x1a2a7pz xhk9q7s x1otrzb0 x1i1ezom x1o6z2jb x1lliihq x12nagc xz9dl7a x1iji9kk xsag5q8 x1sln4lm x1n2onr6']"
        }
    }

    // async __init_log_file__() {
        // try {
        // } catch (error) {
            // console.error('Error initializing log file:', error);
        // }
    // }

    async log(message) {
        const timestamp = new Date().toISOString();
        const log_message = `${timestamp}: ${message}\n`;
        console.log(message);
        await fs.appendFile(this.log_file, log_message);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // async logToFile(message) {
        // this.log(message);
        // try {
            // const timestamp = new Date().toISOString();
            // const logMessage = `[${timestamp}] ${message}\n`;
            // await appendFileAsync(this.log_file, logMessage, { flag: 'a' }); // 'a' flag appends to the file
        // } catch (error) {
            // console.error('Error writing to log file:', error);
        // }
    // }

    async login() {
        try {
            this.log(`logging in`);
            await this.page.goto(this.meta_data['login_url'], { waitUntil: 'networkidle2' });
            await this.page.type(this.meta_data['username'], this.response['username'], { delay: 30 });
            await this.page.type(this.meta_data['password'], this.response['password'], { delay: 30 });
            await this.page.click(this.meta_data['login_button']);
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async read_existing_data() {
        const headers = ['profile_name', 'relationship_status', 'group_profile_url', 'profile_url', 'relationship_url'];
        try {
            if (!fsSync.existsSync(this.profileDataPath)) {
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
            this.log(`number of existing profiles: ${this.existing_profile_data['profile_name'].length}`);
        } catch (error) {
            console.error('Error reading CSV:', error);
            throw error;
        }
    }

    async scrape_new_urls() {
        await this.page.goto(this.response['group_url'], { waitUntil: 'networkidle2' });
        let continue_scrolling = true;
        let newUrls = new Set();
        while (continue_scrolling) {
            const elements = await this.page.$$(this.meta_data['group_members']);
            for (let element of elements) {
                const href = await this.page.evaluate(el => el.href, element);
                if (href && href.includes('groups') && !this.existing_profile_data['group_profile_url'].includes(href)) {
                    newUrls.add(href);
                }
            }
            if (newUrls.size >= this.response['profiles_to_scrape']) {
                this.log(`number of new urls found is greater than input number of profiles to scrape`);
                continue_scrolling = false;
                break;
            }
            const isAtBottom = await this.page.evaluate(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY;
                const clientHeight = window.innerHeight;
                return scrollHeight - scrollTop <= clientHeight + 100;
            });
            if (isAtBottom) {
                this.log(`scrolled to bottom of page, stopping scroll`);
                continue_scrolling = false;
            } else {
                await this.page.evaluate(() => window.scrollBy(0, 1000));
                await this.sleep(1000);
            }
        }
        this.group_profile_urls = Array.from(newUrls);
    }

    async scrape_profiles() {
        try {
            const totalRunTimeInMilliseconds = this.response['hours_to_scrape'] * 60 * 60 * 1000;
            const timeBetweenScrapesInMilliseconds = totalRunTimeInMilliseconds / this.response['profiles_to_scrape'];
            let pagesScraped = 0;
            const totalProfiles = this.group_profile_urls.length;
            this.log(`profiles to scrape: ${this.group_profile_urls.length}`);
            this.log(`in hours: ${this.response['hours_to_scrape']}`);
            this.log('opening group profile urls');
            for (const [index, group_profile_url] of this.group_profile_urls.entries()) {
                // try {
                await this.log(group_profile_url);
                await this.page.goto(group_profile_url, { waitUntil: 'networkidle2' });
                await this.sleep(timeBetweenScrapesInMilliseconds);
                await this.page.waitForSelector(this.meta_data['profile_url'], { timeout: 10000 });
                const profile_url = await this.page.$eval(this.meta_data['profile_url'], element => element.href);
                await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector(this.meta_data['profile_name'], { timeout: 5000 });
                const profile_name = await this.page.$eval(this.meta_data['profile_name'], element => element.textContent.trim());
                // const currentUrl = await this.page.url();
                // const currentUrl = 'https://www.facebook.com/ContessaCleaningCompany';
                // let about_url = currentUrl;
                // if (currentUrl.endsWith('/')) {
                    // about_url = `${currentUrl}about_family_and_relationships`;
                // } else {
                    // about_url = `${currentUrl}&sk=about_family_and_relationships`;
                // }
                // await this.page.goto(about_url, { waitUntil: 'networkidle2' });
                // await this.save_source_code();
                // const tabs = await this.page.$$(this.meta_data['details_tab']);
                // const about_tab = tabs[1];
                // await this.log(about_tab);
                // await this.sleep(3000);
                // for (const tab of tabs) {}
                // await this.sleep(20000);
                // const about_url = await this.page.evaluate(el => el.href, about_tab);
                // await this.log(about_url);
                // await this.sleep(20000);
                // await this.page.goto(about_url, { waitUntil: 'networkidle2' });
                // await this.sleep(5000);
                // const relationship_url = `${about_url}_family_and_relationships`;
                // await this.log(relationship_url);
                // await this.sleep(3000);
                // await this.page.goto(relationship_url, { waitUntil: 'networkidle2' });
                // const sub_tabs = await this.page.$$(this.meta_data['relationships_tab']);
                // for (const sub_tab of sub_tabs) {
                    // const href = await this.page.evaluate(el => el.href, sub_tab);
                    // this.log(href);
                    // if (href && href.includes('family_and_relationships')) {
                        // family_relationships_url = href;
                        // break;
                    // }
                // }
                // await this.sleep(20000);
                // for (const tab of tabs) {
                    // if (tab.textContent.includes('About'))
                    // const tab = await this.page.$eval(this.meta_data['profile_name'], element => element.textContent.trim());
                // }
                // if (currentUrl.endsWith('/')) {
                    // about_url = `${currentUrl}about_family_and_relationships`;
                // } else {
                    // about_url = `${currentUrl}&sk=about_family_and_relationships`;
                // }
                let relationship_status = "none";
                const relationship_details = await this.page.evaluate((selector) => {
                    const statusElement = document.querySelector(selector);
                    if (!statusElement) return [];
                    let container = statusElement.parentElement;
                    while (container && !container.querySelector('div')) {
                        container = container.parentElement;
                    }

                    if (!container) return [];
        
                    const divs = Array.from(container.querySelectorAll('div'))
                        .filter(div => div !== statusElement && div.textContent.trim() !== '');
                    return divs.map(div => div.textContent.trim());
                }, this.meta_data['relationship_title_status']);
                if (relationship_details && relationship_details.length > 0) {
                    relationship_status = relationship_details[relationship_details.length - 1].replace(/,/g, '');
                } else {
                    relationship_status = "none";
                }

                this.new_row = { profile_name, relationship_status, group_profile_url, profile_url, relationship_url };
                await this.updateCSV();

                pagesScraped++;

                const progress = (pagesScraped / totalProfiles) * 100;
                const progressBar = '='.repeat(Math.floor(progress / 2)) + '-'.repeat(50 - Math.floor(progress / 2));
                await this.log(`[${progressBar}] ${progress.toFixed(2)}% | ${pagesScraped}/${totalProfiles}`);

                // if (pagesScraped == this.response['profiles_to_scrape']) {
                    // break;
                // }
                // } catch (error) {
                    // console.error(`Error scraping profile: ${group_profile_url}`, error);
                // }
            }

            this.log(`Scraping completed. Total profiles scraped: ${pagesScraped}`);
        } catch (error) {
            console.log(error);
            this.log("Error scraping group profile URLs:", error);
            this.log(error);
        }
    }
    
    async save_source_code(){
        const html = await this.page.content();
        fs.writeFile('page.html', html, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            }
        });
    }

    async updateCSV() {
        try {
            for (const key in this.new_row) {
                if (this.new_row.hasOwnProperty(key) && this.existing_profile_data.hasOwnProperty(key)) {
                    this.existing_profile_data[key].push(this.new_row[key]);
                }
            }
            const headers = Object.keys(this.existing_profile_data);
            const csv = headers.join(',') + '\n' + this.existing_profile_data[headers[0]].map((_, i) =>
                headers.map(header => this.existing_profile_data[header][i]).join(',')
            ).join('\n');
            await fs.writeFile(this.profileDataPath, csv);
        } catch (error) {
            console.error('Error updating CSV file:', error);
        }
    }

    async open_browser() {
        this.log('launching browser');
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-notifications'
            ]
        });
        this.page = await this.browser.newPage();
    }

    async save() {
        try {
            const filteredData = {};
            const numRows = this.existing_profile_data['relationship_status'].length;
            Object.keys(this.existing_profile_data).forEach(header => {
                filteredData[header] = [];
            });
            for (let i = 0; i < numRows; i++) {
                if (this.existing_profile_data['relationship_status'][i] !== 'not specified') {
                    Object.keys(this.existing_profile_data).forEach(header => {
                        filteredData[header].push(this.existing_profile_data[header][i]);
                    });
                }
            }
            const headers = Object.keys(filteredData);
            const csv = headers.join(',') + '\n' + filteredData[headers[0]].map((_, i) =>
                headers.map(header => filteredData[header][i]).join(',')
            ).join('\n');
            await fs.writeFile('filtered_profile_data.csv', csv);
        } catch (error) {
            console.error('Error saving filtered CSV file:', error);
        }
    }

    async runBot() {
        try {
            await this.open_browser();
            await this.login();
            await this.read_existing_data();
            await this.scrape_new_urls();
            await this.scrape_profiles();
            await this.save();
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
    server.close(() => {
        process.exit(0);
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run-bot', async (req, res) => {
    try {
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
    const server_url = `http://localhost:${port}`;
    console.log(`starting ${server_url}`);
    opn(server_url);
});

// const bot = new Bot({
    // username: 'porterbmoody@gmail.com',
    // password: 'Yoho1mes',
    // group_url: 'https://www.facebook.com/groups/358727535636578/members',
    // profiles_to_scrape: '10',
    // hours_to_scrape: '.01'
//   });
// bot.runBot();
