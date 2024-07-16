# Facebook Profile Scraper

This is a bot that automatically scrapes and stores profile data from a specified Facebook group. 

![](facebook%20page.PNG)

## Prerequisites

Make sure you have the following installed:
- Node.js (version 12 or later)
- npm (Node package manager)

## Getting Started

Follow these steps to set up and run the bot:

### 1. Clone the Repository

First, clone the repository to your local machine using Git:

```sh
git clone https://github.com/porterbmoody/facebook_profile_scraper.git
cd facebook_profile_scraper
```
### 2. Initialize the Local Backend Server
Open a terminal and run the following command to start the local backend server:

```sh
node server.js
```
### 3. Input Credentials and Group URL
In the web interface:

Enter your Facebook credentials.
Input the Facebook group URL from which you want to scrape profiles.
Click the *Run Bot* button.
The bot will then start automatically, logging in to Facebook, navigating to the specified group, going to each profile url and scraping the using your local chrome browser.
