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
        self.response_data = { 
            'username': response.get('username'), 
            'password': response.get('password'), 
            'group_url': response.get('group_url'), 
            'profiles_to_scrape': response.get('profiles_to_scrape', 0), 
            'hours_to_scrape': response.get('hours_to_scrape', 0),
        }
        print(self.response_data)
        self.scraped_data = []

        with open('data.json', 'r') as file:
            self.data = json.load(file)

    def sleep(self, ms):
        time.sleep(ms / 1000.0)

    def get_random_delay(self, min, max):
        return random.randint(min, max)

    def auto_scroll(self):
        last_height = self.page.execute_script("return document.body.scrollHeight")
        while True:
            self.page.execute_script("window.scrollBy(0, 100);")
            
            time.sleep(1)
            
            new_height = self.page.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height


    def login(self):
        self.page.get("https://www.facebook.com/")
        self.page.find_element(By.CSS_SELECTOR, self.data['username_selector']).send_keys(self.response_data['username'])
        self.page.find_element(By.CSS_SELECTOR, self.data['password_selector']).send_keys(self.response_data['password'])
        self.page.find_element(By.CSS_SELECTOR, self.data['login_selector']).click()
        time.sleep(5)

    def scrape_group_profile_urls(self):
        print(f"Opening group URL {self.response_data['group_url']}")
        self.page.get(self.response_data['group_url'])
        time.sleep(10)
        self.auto_scroll()
        self.sleep(2000)
        self.auto_scroll()
        self.sleep(2000)

        self.group_profile_urls = set()
        elements = self.page.find_elements(By.CSS_SELECTOR, self.data[0]['group_members_selector'])
        for element in elements:
            href = element.get_attribute('href')
            if href and 'groups' in href:
                self.group_profile_urls.add(href)

    def scrape_profile_data(self):
        try:
            print("Unique profile URLs to scrape:", len(self.group_profile_urls))

            total_run_time_in_milliseconds = self.response_data['hours_to_scrape'] * 60 * 60 * 1000
            time_between_scrapes_in_milliseconds = total_run_time_in_milliseconds / self.response_data['profiles_to_scrape']

            print(f"Scraping {self.response_data['profiles_to_scrape']} pages over {self.response_data['hours_to_scrape']} hours")
            print(f"Time between scrapes is set to {time_between_scrapes_in_milliseconds / 1000} seconds")

            pages_scraped = 0
            start_time = time.time()

            for group_profile_url in self.group_profile_urls:
                elapsed_time = time.time() - start_time
                if elapsed_time > total_run_time_in_milliseconds / 1000:
                    print('Total bot runtime exceeded. Ending process.')
                    break

                try:
                    print(f"Waiting for {time_between_scrapes_in_milliseconds / 1000} seconds before next profile...")
                    self.sleep(time_between_scrapes_in_milliseconds)

                    self.page.get(group_profile_url)
                    time.sleep(10)

                    profile_url = self.page.find_element(By.CSS_SELECTOR, self.data[0]['profile_url_selector']).get_attribute('href')
                    self.page.get(profile_url)
                    time.sleep(5)

                    profile_name = self.page.find_element(By.CSS_SELECTOR, self.data[0]['profile_name_selector']).text.strip()
                    print(f"Scraping...{profile_name}")

                    marital_status = 'Not specified'
                    elements = self.page.find_elements(By.CSS_SELECTOR, self.data[0]['marital_status_selector'])
                    for element in elements:
                        text = element.text.strip().lower()
                        if 'married' in text:
                            marital_status = 'Married'
                        elif 'single' in text:
                            marital_status = 'Single'

                    new_row = { 'profile_name': profile_name, 'marital_status': marital_status, 'profile_url': profile_url }
                    self.scraped_data.append(new_row)
                    self.update_csv()

                    pages_scraped += 1
                except Exception as error:
                    print(f"Error scraping profile: {group_profile_url}", error)

            if pages_scraped < self.response_data['profiles_to_scrape']:
                print('Unable to scrape the specified number of pages within the given URLs.')
        except Exception as error:
            print("Error scraping group profile URLs:", error)

    def update_csv(self):
        df = pd.DataFrame(self.scraped_data)
        df.to_csv('profile_data.csv', index=False)
        print('CSV file saved successfully.')

    def open_browser(self):
        print("Starting Selenium...")
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-setuid-sandbox')
        options.add_argument('--disable-notifications')
        self.browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        print("Opening browser...")
        self.page = self.browser
        print("Logging in...")

    def run_bot(self):
        self.open_browser()
        self.login()
        self.scrape_group_profile_urls()
        self.scrape_profile_data()

@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/run-bot', methods=['POST'])
def run_bot():
    try:
        bot = Bot(request.json)
        bot.run_bot()
        return 'Bot execution completed successfully!'
    except Exception as error:
        print('Error running bot:', error)
        return 'Error running bot', 500
    finally:
        close_server()

def close_server():
    print('Closing server...')
    os._exit(0)

# if __name__ == '__main__':

# webbrowser.open(url)
# Timer(1, open_browser).start()
url = f'http://localhost:{port}'
webbrowser.open(url)
app.run(port=port)



# %%
