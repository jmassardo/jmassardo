// index.js
require('dotenv').config();
const xml2js = require('xml2js');
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';
const puppeteerService = require('./services/puppeteer.service');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

let DATA = {
  date: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Chicago',
  }),
};

async function setInstagramPosts() {
    const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount('jamesmassardo', 3);
    DATA.img1 = instagramImages[0];
    DATA.img2 = instagramImages[1];
    DATA.img3 = instagramImages[2];
}

async function setBlogPosts() {
    await fetch(
        `https://dxrf.com/atom.xml`
    )
    .then(r => r.text())
    .then(r => {
        parser.parseString(r, function(error, result) {
            if(error === null) {
                DATA.blog_updated_date = new Date(result.feed.updated[0]).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZoneName: 'short',
                    timeZone: 'America/Chicago',
                  });
                DATA.blog_posts = result.feed.entry
            }
            else {
                console.log(error);
            }
        });
    });
}

function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) =>  {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}
async function action() {
    await setInstagramPosts();
    await setBlogPosts();
    await generateReadMe();
    await puppeteerService.close();
  }
  
action();