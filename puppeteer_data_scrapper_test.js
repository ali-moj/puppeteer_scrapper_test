const puppeteer = require('puppeteer');
const fs = require('fs');

function cleanText(text) {
    return text.replace(/[^\w\s@#.,!?]/g, '');
}

function getFormattedDate() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.3');

    const profiles = [
// ... Start profiles and tweets URLs here
        'https://twitter.com/officialmcafee/'
        // ... Add other URLs here
    ];


    let allTweets = [];
    for (const url of profiles) {
        const response = await page.goto(url);
        const statusCode = response.status();
        console.log(`HTTP Status Code for ${url}: ${statusCode}`);

        if (statusCode !== 200) {
            console.error(`Failed to access ${url}. Skipping...`);
            await new Promise(resolve => setTimeout(resolve, 25000)); // Wait for 25 seconds before the next profile
            continue;
        }

        // Wait for the element with role="link"
        await page.waitForSelector('article[data-testid="tweet"]');

        // Check if the element exists
        const elementExists = await page.$$eval('article[data-testid="tweet"]', elements => elements.length > 0);

        if (elementExists) {
            console.log("The 'article' tag is found!");
        } else {
            console.log("The 'article' tag is not found.");
        }

        const tweets = await page.$$eval('article[data-testid="tweet"]', nodes => {
            return nodes.map(node => {
                let content = (node.querySelector('div')?.innerText || '').replace(/\n/g, ' ').replace(/,/g, ';');
                const time = node.querySelector('time')?.innerText || '';
                const link = node.querySelector('a')?.href || '';
                return { content, time, link };
            });
        });


        // Clean the tweets content after retrieving them
        for (let tweet of tweets) {
            tweet.content = cleanText(tweet.content);
        }

        allTweets = allTweets.concat(tweets.map(tweet => ({ url, ...tweet })));

        console.log(`Scraped ${tweets.length} tweets from ${url}`);
        await new Promise(resolve => setTimeout(resolve, 100000)); // Wait for 100 seconds before the next profile
    }

    await browser.close();

    allTweets.forEach(tweet => {
        console.log(`Scraping tweet from ${tweet.url}: ${tweet.content.substring(0, 50)}...`);
    });

    const csvContent = allTweets.map(tweet => `${tweet.url},${tweet.content},${tweet.time},${tweet.link}`).join('\n');
    const outputFilename = `tweets_${getFormattedDate()}.csv`;
    fs.writeFileSync(outputFilename, `URL,Content,Time,Link\n${csvContent}`);

    console.log(`Scraped a total of ${allTweets.length} tweets.`);
    console.log(`Tweets saved to ${outputFilename}`);
})();