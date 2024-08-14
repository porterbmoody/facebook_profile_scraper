# Facebook Profile web scraper

## Instructions

Download latest verion: `bot6.3.exe` and just double click to run. It starts a local web server and front end html page you can input some data for the bot to use to run. 

# how it works

When you run the executable, it first starts a local server on your machine, then it opens a chrome browser with `index.html`. 
Then when you input the inputs it opens another chrome browser

Then it opens the facebook group members tab, scrolls down until it finds the input number of profiles, then collects each url from each profile, but only if it has not already been collected.

then it goes through each profile url 1 by 1 and opens the "group profile url" 
then it finds the profile url and opens that and collects the information under relationship status.