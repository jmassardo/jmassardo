// index.js
require('dotenv').config();
const xml2js = require('xml2js');
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';
const puppeteerService = require('./services/puppeteer.service');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

/**
  * DATA is the object that contains all
  * the data to be provided to Mustache
  * Notice the "name" and "date" property.
*/
let DATA = {
  name: 'James',
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
        //fs.readFileSync("data.xml", "utf8")
        `http://127.0.0.1:4000/atom.xml`
        //`https://dxrf.com/atom.xml`
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

async function setWeatherInformation() {
    await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=joplin&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=imperial`
    )
    .then(r => r.json())
    .then(r => {
        DATA.city_temperature = Math.round(r.main.temp);
        DATA.city_weather = r.weather[0].description;
        DATA.city_weather_icon = r.weather[0].icon;
        DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Chicago',
        });
        DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Chicago',
        });
    });
}
/**
  * A - We open 'main.mustache'
  * B - We ask Mustache to render our file with the data
  * C - We create a README.md file with the generated output
  */
function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) =>  {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}
async function action() {
    /**
     * Fetch Weather
     */
    await setWeatherInformation();
  
    /**
     * Get pictures
     */
    await setInstagramPosts();
  
    /**
     * Get blog posts
     */
    await setBlogPosts();
  
    /**
     * Generate README
     */
    await generateReadMe();
  
    await puppeteerService.close();
  }
  
  action();