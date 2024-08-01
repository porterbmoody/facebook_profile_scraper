#%%

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import csv
import os
from flask import Flask, request, jsonify, send_from_directory
import pandas as pd

app = Flask(__name__)

class Bot:
    def __init__(self, response):
        self.driver = None
        self.response = response
        self.profile_data_path = os.path.join(os.getcwd(), 'profile_data.csv')
        self.meta_data = {
            "login_url": "https://www.facebook.com/",
            "username": "input[name='email']",
            "password": "input[name='pass']",
            "login_button": "button[name='login']",
            "group_members": "a[class='x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1s688f']",
            "profile_url": "a[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x14qwyeo xw06pyt x579bpy xjkpybl x1xlr1w8 xzsf02u x2b8uid']",
            "profile_name": "h1[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u']",
            "detail_element": "div[class='x9f619 x1n2onr6 x1ja2u2z x78zum5 x2lah0s x1nhvcw1 x1qjc9v5 xozqiw3 x1q0g3np xyamay9 xykv574 xbmpl8g x4cne27 xifccgj']",
            "heart_icon": "img[src='https://static.xx.fbcdn.net/rsrc.php/v3/yq/r/S0aTxIHuoYO.png']",
            "relationship_title_status": "div[class='xieb3on x1gslohp']",
            "relationship_status": "div[class*='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen xo1l8bm xzsf02u']",
            "tabs": "div[class='x1i10hfl xe8uvvx xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz xjyslct xjbqb8w x18o3ruo x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1heor9g x1ypdohk xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x1n2onr6 x16tdsg8 x1hl2dhg x1vjfegm x3nfvp2 xrbpyxo x1itg65n x16dsc37']",
            "detail_tabs": "div[class='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x1f6kntn xvq8zen x1s688f xi81zsa']"
        }

    def sleep(self, seconds):
        time.sleep(seconds)

    def get_random_delay(self, min_time, max_time):
        return random.randint(min_time, max_time)

    def login(self):
        try:
            self.driver.get(self.meta_data['login_url'])
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.meta_data['username']))
            )
            self.driver.find_element(By.CSS_SELECTOR, self.meta_data['username']).send_keys(self.response['username'])
            self.driver.find_element(By.CSS_SELECTOR, self.meta_data['password']).send_keys(self.response['password'])
            self.driver.find_element(By.CSS_SELECTOR, self.meta_data['login_button']).click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a[aria-label='Profile']"))
            )
        except Exception as e:
            print('Error logging in:', e)

    def read_existing_data(self):
        # if not os.path.exists(self.profile_data_path):
            # df = pd.DataFrame(columns=headers)
            # df.to_csv(self.profile_data_path, index=False)
            # self.existing_profile_data = {header: [] for header in headers}
        print(f'Reading existing data from {self.profile_data_path}')
        headers = ['profile_name', 'relationship_status', 'group_profile_url', 'profile_url']
        if not os.path.exists(self.profile_data_path):
            print(f'File {self.profile_data_path} does not exist. Creating it with headers row.')
            with open(self.profile_data_path, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(headers)
            self.existing_profile_data = {header: [] for header in headers}
            return
        with open(self.profile_data_path, 'r') as file:
            reader = csv.DictReader(file)
            self.existing_profile_data = {header: [] for header in reader.fieldnames}
            for row in reader:
                for header in reader.fieldnames:
                    self.existing_profile_data[header].append(row[header])

    def view_all_members(self):
        try:
            self.driver.get(self.response['group_url'])
            print('Scrolling through members...')
            continue_scrolling = True
            while continue_scrolling:
                elements = self.driver.find_elements(By.CSS_SELECTOR, self.meta_data['group_members'])
                is_at_bottom = self.driver.execute_script(
                    "return document.documentElement.scrollHeight - window.scrollY <= window.innerHeight + 100"
                )
                if is_at_bottom:
                    print('Reached the bottom of the page. Stopping scroll.')
                    continue_scrolling = False
                else:
                    self.driver.execute_script("window.scrollBy(0, 1000);")
                    print(f'Total members found: {len(elements)}')
                    self.sleep(1)
                if len(elements) >= self.response['profiles_to_scrape']:
                    print(f'Found {len(elements)} elements. Stopping scroll.')
                    continue_scrolling = False
        except Exception as e:
            print('Error during scrolling:', e)

    def scrape_group_profile_urls(self):
        print('Finding URLs to scrape...')
        self.sleep(3)
        elements = self.driver.find_elements(By.CSS_SELECTOR, self.meta_data['group_members'])
        urls = set()
        for element in elements:
            href = element.get_attribute('href')
            if href and 'groups' in href and href not in self.existing_profile_data['group_profile_url']:
                urls.add(href)
        self.group_profile_urls = list(urls)

    def save_source_code(self):
        html = self.driver.page_source
        with open('page.html', 'w', encoding='utf-8') as file:
            file.write(html)
            print(f'HTML content saved to page.html')

    def scrape_profiles(self):
        try:
            print(f"Possible profiles to scrape: {len(self.group_profile_urls)}")
            print(f"Profiles to scrape: {self.response['profiles_to_scrape']} over {self.response['hours_to_scrape']} hours")
            total_run_time = self.response['hours_to_scrape'] * 60 * 60
            time_between_scrapes = total_run_time / self.response['profiles_to_scrape']
            print(f"Time between scrapes: {time_between_scrapes} seconds")

            for url in self.group_profile_urls[:self.response['profiles_to_scrape']]:
                try:
                    self.driver.get(url)
                    self.sleep(3)
                    profile_name = self.driver.find_element(By.CSS_SELECTOR, self.meta_data['profile_name']).text
                    relationship_status = self.driver.find_element(By.CSS_SELECTOR, self.meta_data['relationship_status']).text
                    profile_url = url
                    self.save_data(profile_name, relationship_status, url)
                    print(f'Scraped {profile_name} from {profile_url}')
                    self.sleep(time_between_scrapes)
                except Exception as e:
                    print(f'Error scraping {url}:', e)
        except Exception as e:
            print('Error in scraping profiles:', e)

    def save_data(self, profile_name, relationship_status, url):
        with open(self.profile_data_path, 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([profile_name, relationship_status, url, self.response['group_url']])
            print(f'Saved data for {profile_name}')

    def run(self):
        self.driver = webdriver.Chrome()
        self.login()
        self.read_existing_data()
        self.view_all_members()
        self.scrape_group_profile_urls()
        self.scrape_profiles()
        self.driver.quit()

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    response = data
    bot = Bot(response)
    bot.run()
    return jsonify({"message": "Scraping complete!"})

if __name__ == '__main__':
    app.run(debug=True)

# %%
