#%%

from flask import Flask, request, send_from_directory
import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
from threading import Timer
import pandas as pd
import webbrowser

app = Flask(__name__)
port = 3000

class Bot:
    def __init__(self, response):
        self.browser = None
        self.page = None
        self.response = response
        self.profile_data_path = 'profile_data.csv'
        if os.path.exists(self.profile_data_path):
            self.profile_data = pd.read_csv(self.profile_data_path)
        else:
            self.profile_data = pd.DataFrame()
        with open('data.json', 'r') as file:
            self.data = json.load(file)

    def get_random_delay(self, min, max):
        return random.randint(min, max)

    def auto_scroll(self):
        print('scrolling...')
        last_height = self.page.execute_script("return document.body.scrollHeight")
        while True:
            self.page.execute_script("window.scrollBy(0, 100);")
            time.sleep(1)
            
            new_height = self.page.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        print('done scrolling')

    def login(self):
        self.page.get("https://www.facebook.com/")
        self.page.find_element(By.CSS_SELECTOR, self.data['username_selector']).send_keys(self.response.get('username'))
        self.page.find_element(By.CSS_SELECTOR, self.data['password_selector']).send_keys(self.response.get('password'))
        self.page.find_element(By.CSS_SELECTOR, self.data['login_selector']).click()
        time.sleep(5)

    def scrape_group_profile_urls(self):
        print(f"Opening group URL {self.response.get('group_url')}")
        self.page.get(self.response.get('group_url'))
        time.sleep(10)
        # self.auto_scroll()
        # self.auto_scroll()

        elements = self.page.find_elements(By.CSS_SELECTOR, self.data['group_members_selector'])
        self.group_profile_urls = set()
        for element in elements:
            href = element.get_attribute('href')
            if href and 'groups' in href:# and href not in self.profile_data['group_profile_urls']
                # if len(self.profile_data) > 0:
                    # if not href in self.profile_data['group_profile_urls']:
                self.group_profile_urls.add(href)
        self.group_profile_urls = list(self.group_profile_urls)

    def scrape_profile_data(self):
        print("Unique profile URLs to scrape:", len(self.group_profile_urls))

        total_run_time_in_seconds = float(self.response.get('hours_to_scrape')) * 60 * 60
        time_between_scrapes_in_seconds = total_run_time_in_seconds / float(self.response.get('profiles_to_scrape'))
        print(f'time_between_scrapes_in_seconds: {time_between_scrapes_in_seconds}')

        print(f"Scraping {str(self.response.get('profiles_to_scrape'))} pages over {str(self.response.get('hours_to_scrape'))} hours")

        pages_scraped = 0
        start_time = time.time()

        for group_profile_url in self.group_profile_urls[:int(self.response.get('profiles_to_scrape'))]:
            print(f'getting...{group_profile_url}')
            elapsed_time = time.time() - start_time
            print(f'elapsed_time: {elapsed_time}')
            if elapsed_time > total_run_time_in_seconds:
                print('Total bot runtime exceeded. Ending process.')
                break

            print(f"Waiting for {time_between_scrapes_in_seconds} seconds before next profile...")
            time.sleep(time_between_scrapes_in_seconds)

            self.page.get(group_profile_url)
            time.sleep(10)

            profile_url = self.page.find_element(By.CSS_SELECTOR, self.data['profile_url_selector']).get_attribute('href')
            self.page.get(profile_url)
            time.sleep(5)

            profile_name = self.page.find_element(By.CSS_SELECTOR, self.data['profile_name_selector']).text.strip()
            print(f"Scraping...{profile_name}")

            marital_status = 'not specified'
            elements = self.page.find_elements(By.CSS_SELECTOR, self.data['marital_status_selector'])
            for element in elements:
                text = element.text.strip().lower()
            if 'married' in text:
                marital_status = 'married'
            elif 'single' in text:
                marital_status = 'single'

            # new_row = { 'profile_name': profile_name, 'marital_status': marital_status, 'group_profile_url': group_profile_url, 'profile_url': profile_url }
            # self.profile_data.append(new_row)

            # if marital_status != 'not specified':
            print('marital_status: ', marital_status)
            self.profile_data.loc[len(self.profile_data.index)] = [profile_name, marital_status, group_profile_url, profile_url] 
            self.profile_data.to_csv(self.profile_data_path, index=False)
            print(self.scraped_data)

        pages_scraped += 1

    def open_browser(self):
        print("Starting Selenium...")
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-setuid-sandbox')
        options.add_argument('--disable-notifications')
        # self.browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        self.browser = webdriver.Chrome(options=options)
        print("Opening browser...")
        self.page = self.browser
        print("Logging in...")

    def run_bot(self):
        self.open_browser()
        self.login()
        self.scrape_group_profile_urls()
        self.scrape_profile_data()

# @app.route('/')
# def index():
#     return send_from_directory(os.getcwd(), 'index.html')

# @app.route('/run-bot', methods=['POST'])
# def run_bot():
# 	try:
# 		print('running bot...')
# 		bot = Bot(request.json)
# 		bot.run_bot()
# 		return 'Bot execution completed successfully!', 200
# 	except Exception as error:
# 		print('Error running bot:', error)
# 		return 'Error running bot', 500
# 	finally:
# 		close_server()

# def close_server():
#     print('Closing server...')
#     os._exit(0)

# if __name__ == '__main__':
#     # webbrowser.open(url)
#     # Timer(1, open_browser).start()
#     url = f'http://localhost:{port}'
#     webbrowser.open(url)
#     app.run(port=port)

bot = Bot({'username': 'porterbmoody@gmail.com', "password":'Yoho1mes', "group_url":'https://www.facebook.com/groups/344194813025772/members/',
           'profiles_to_scrape':'5', 'hours_to_scrape':'.005'})
bot.run_bot()


#%%
