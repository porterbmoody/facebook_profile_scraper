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
### 3. Open the HTML Interface
Open the `public/index.html` file in your web browser. You can do this by simply double-clicking the file or opening it through your browser's menu.

### 4. Input Credentials and Group URL
In the web interface:

Enter your Facebook credentials.
Input the Facebook group URL from which you want to scrape profiles.
Click the *Submit* button.
The bot should start running automatically, logging in to Facebook, navigating to the specified group, and scraping profile URLs.

Troubleshooting
If you encounter any issues, make sure to:

Verify that your credentials and group URL are correct.
Ensure that the backend server is running.
Check the browser console and terminal for error messages and logs.