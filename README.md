# Facebook Profile web scraper

Run the Bot:

Download the latest version of `bot6.4.exe`.
Double-click the executable to launch the bot. This action will start a local web server on your machine.

## Dependencies

- puppeteer
- util
- express
- fs
- path
- opn

## How it works

When you run the executable, it first starts a local server on your machine, then it opens a chrome browser with `index.html`. 
Then when you input the inputs it opens another chrome browser

Then it opens the facebook group members tab, scrolls down until it finds the input number of profiles, then collects each url from each profile, but only if it has not already been collected.

then it goes through each profile url 1 by 1 and opens the "group profile url" 
then it finds the profile url and opens that and collects the information under relationship status.

the `scrape_new_urls` function opens the facebook group url on the members tab. Then is begins to scroll down. It uses a while loop which keeps scrolling until either the bottom of the page has been reached or the number of profiles loaded onto the facebook group profiles page is greater than or equal to the input number the user has specified the bot will scrape. 