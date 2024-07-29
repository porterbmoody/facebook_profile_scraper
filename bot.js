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

class Bot {
    constructor(response) {
        this.browser = null;
        this.page = null;
        this.response = response;
        this.profileDataPath = path.join(__dirname, 'profile_data.csv');
        this.profileDataPath = 'profile_data.csv';
        this.rawData = fsSync.readFileSync('meta_data.json', 'utf8');
        this.meta_data = JSON.parse(this.rawData);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    async login() {
        try {
            await this.page.goto(this.meta_data['login_url'], { waitUntil: 'networkidle2' });
            await this.page.type(this.meta_data.username, this.response['username'], { delay: 30 });
            await this.page.type(this.meta_data.password, this.response['password'], { delay: 30 });
            await this.page.click(this.meta_data.login_button);
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
        const headers = ['profile_name', 'relationship_status', 'group_profile_url', 'profile_url'];
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
                const elements = await this.page.$$(this.meta_data['group_members']);
                const isAtBottom = await this.page.evaluate(() => {
                    const scrollHeight = document.documentElement.scrollHeight;
                    const scrollTop = window.scrollY;
                    const clientHeight = window.innerHeight;
                    return scrollHeight - scrollTop <= clientHeight + 100;
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
        const elements = await this.page.$$(this.meta_data['group_members']);
        const urls = new Set();
        for (let element of elements) {
            const href = await this.page.evaluate(el => el.href, element);
            if (href && href.includes('groups') && !this.existing_profile_data['group_profile_url'].includes(href)) {
                urls.add(href);
            }
        }
        this.group_profile_urls = Array.from(urls);
    }

    async save_source_code(){
        const html = await this.page.content();

        // const filePath = path.join(__dirname, 'page.html');
    
        fs.writeFile('page.html', html, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log(`HTML content saved to ${filePath}`);
            }
        });
    }

    // async scrape_profile() {
        // https://www.facebook.com/madison.esch.5/
        // await this.page.goto(this.profile_url, { waitUntil: 'networkidle2' });

        // await this.page.waitForSelector(this.meta_data['tabs']);
        // console.log(tab_elements);
        // const tab_urls = [];
        // const about_tab = tab_elements[1];
        // await about_tab.click();
        // await this.sleep(3000);
        // const details = await about_tab.evaluate(el => {
            // return {
                // tagName: el.tagName,
                // innerHTML: el.innerHTML,
                // outerHTML: el.outerHTML,
                // href: el.href,
                // id: el.id,
                // className: el.className,
                // textContent: el.textContent,
                // attributes: Array.from(el.attributes).map(attr => ({
                    // name: attr.name,
                    // value: attr.value
                // }))
            // };
        // });
        // await this.save_source_code();
        // console.log('Element Details:', details);
        // console.log('click');
        // about_tab.click();
        // console.log(about_tab);
        // const about_tab_url = await about_tab.evaluate(el => el.href);
        // const element_property = await about_tab.getProperty('innerHTML');
        // console.log('about_tab_url');
        // console.log(about_tab_url);
        // await this.sleep(150000);
        // this.page.click()
        // const scriptContent = await page.evaluate(() => {
            // const script = document.querySelector('script[type="application/json"][data-sjs]');
            // return script ? script.textContent : null;
        // });
        // this.page.$eval(this.meta_data['tabs'], (element) => {
            // return element.innerHTML
        //   })
        // for (const element of tab_elements) {
            // const href = await element.evaluate(el => el.href);
            // tab_urls.push(href);
        // }

        // const about_tab = tab_elements[1].evaluate(element => element.href);
        // console.log(tab_urls);
        // const tab_urls = await this.page.evaluate(elements => elements.map(el => el.href), tab_elements);
        // const tab_urls = await this.page.$$(this.meta_data['tabs'], element => element.href);
        // console.log(tab_urls);
        // console.log('clicking on about tab');
        // const about_tab_url = tab_urls[1];
        // await this.page.goto(about_tab_url, { waitUntil: 'networkidle2' });
        // for (let tab_url of tab_urls) {
            // if (tab_url.includes('about')) {
                // const about_profile_url = tab_url;
            // }
        // }
        // await this.sleep(15000);
        // console.log(about_tab_url);
        // const aboutTabClicked = await this.page.evaluate((tabSelector) => {
        // await this.sleep(1000);
        // await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        // console.log('Successfully navigated to About page');

        // console.log('navigating to family and relationships tab...');
        // const detail_tabs = this.page.querySelectorAll(this.meta_data['detail_tabs']);
        // for (let detail_tab of detail_tabs) {
            // if (detail_tab.textContent.includes('About')) {
                // detail_tab.click();
            // }
        // }
        // await this.sleep(3000);
        // let currentUrl = this.page.url();
        // const profile_url_relationship_tab = `${currentUrl}_family_and_relationships`;
        // await this.page.goto(profile_url_relationship_tab, { waitUntil: 'networkidle2' });
        // const profile_name = await this.page.$eval(this.meta_data['profile_name'], element => element.textContent.trim());
        // const relationship_status = await this.page.$eval(this.meta_data['relationship_title_status'])
        
    // }

    async scrape_profiles() {
        try {
            console.log("possible profiles to scrape:", this.group_profile_urls.length);
            console.log("input number to scrape:", this.response['profiles_to_scrape']);
            console.log(`over ${this.response['hours_to_scrape']} hours`);
            const totalRunTimeInMilliseconds = this.response['hours_to_scrape'] * 60 * 60 * 1000;
            const timeBetweenScrapesInMilliseconds = totalRunTimeInMilliseconds / this.response['profiles_to_scrape'];
            console.log(`Time between scrapes is set to ${timeBetweenScrapesInMilliseconds / 1000} seconds`);
            let pagesScraped = 0;
            for (const group_profile_url of this.group_profile_urls) {
                try {
                    console.log(`Waiting for ${timeBetweenScrapesInMilliseconds / 1000} seconds before next profile...`);
                    await this.page.goto(group_profile_url, { waitUntil: 'networkidle2' });
                    await this.sleep(timeBetweenScrapesInMilliseconds);
                    await this.page.waitForSelector(this.meta_data['profile_url'], { timeout: 10000 });
                    const profile_url = await this.page.$eval(this.meta_data['profile_url'], element => element.href);
                    await this.page.goto(profile_url, { waitUntil: 'networkidle2' });
                    // await this.scrape_profile();
                    await this.sleep(6000);
                    const currentUrl = await this.page.url();
                    console.log(currentUrl);
                    let about_url = currentUrl;
                    if (currentUrl.endsWith('/')) {
                        about_url = `${currentUrl}about_family_and_relationships`;
                    } else {
                        about_url = `${currentUrl}&sk=about_family_and_relationships`;
                    }
                    console.log('about_url');
                    console.log(about_url);
                    await this.page.goto(about_url, { waitUntil: 'networkidle2' });
                    await this.sleep(3000);
                    await this.page.waitForSelector(this.meta_data['profile_name'], { timeout: 5000 });
                    const profile_name = await this.page.$eval(this.meta_data['profile_name'], element => element.textContent.trim());
                    console.log(`Scraping...${profile_name}`);
                    const relationship_fields = await this.page.$$(this.meta_data['relationship_title_status']);
                    const relationship_field = await relationship_fields[0].evaluate(el => el.textContent.trim());
                    // console.log('relationship_field:', relationship_field);
        
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
                    // console.log(relationship_details);
                    const relationship_status = relationship_details[relationship_details.length - 1].replace(/,/g, '');
                    console.log(relationship_status);
                    // console.log('Additional relationship information:');
                    // relationship_status.forEach((info, index) => {
                        // console.log(`${index + 1}. ${info}`);
                    // });
                        // return {
                            // status: relationship_status,
                            // additionalInfo: additional_info
                        // };
                    // console.log(relationship_fields);
                    // const relationship_status = await relationship_fields[0].evaluate(el => el.textContent.trim());
                    // console.log('relationship_status');
                    // console.log(relationship_status);
                    // let relationshipStatus = 'Not specified';
                    // if (relationship_fields.length > 0) {
                        // Get text from the first element
                    // }
                    // if (currentUrl.endsWith('/')) {
                        // currentUrl = currentUrl.slice(0, -1);
                    // }

                    // await this.page.waitForSelector(this.meta_data['relationship_status'], { timeout: 5000 });
                    // console.log(relationship_status);
                    // const relationship_status = await this.page.evaluate(() => {
                    // await this.scrape_relationship_status()
                    // new Promise(resolve => setTimeout(resolve, 5000));
                    // const detail_elements = document.querySelectorAll(this.meta_data['detail_element']);
                    // const detail_elements = await this.page.$$(this.meta_data['detail_element']);
                    // console.log('detail_elements');
                    // console.log(detail_elements);
                    // console.log(detail_elements.length);
                    // for (let detail_element of detail_elements) {
                        // const heartIcon = detail_element.querySelector(this.meta_data['heart_icon']);
                        // const heart_icon = await detail_element.$eval(this.meta_data['heart_icon'], element => element.textContent.trim());
                        // console.log(heart_icon);
                        // if (heart_icon) {
                            // const statusElement = detail_element.querySelector(this.meta_data['relationship_status_selector']);
                            // const status_element = await this.page.$eval(this.meta_data['relationship_status_selector'], element => element.textContent.trim());
                            // console.log(status_element);
                            // if (status_element) {
                                // relationship_status = status_element.textContent.trim();
                            // }
                        // }
                    // }
                    // relationship_status = 'not specified';
                    // });
                    this.new_row = { profile_name, relationship_status, group_profile_url, profile_url, about_url };
                    await this.updateCSV();
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
            console.log('CSV file updated successfully.');
        } catch (error) {
            console.error('Error updating CSV file:', error);
        }
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

    async filter_and_save() {
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
            await this.scrape_profiles();
            await this.filter_and_save();
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
    // username: 'porterbmoody@gmail.com',
    // password: 'Yoho1mes',
    // group_url: 'https://www.facebook.com/groups/358727535636578/members',
    // profiles_to_scrape: '10',
    // hours_to_scrape: '.01'
//   });
// bot.runBot();
