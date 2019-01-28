var start = new Date();

const puppeteer = require('puppeteer');
const fs = require("fs");
var out;
function run () {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://www.unibet.com/betting#filter/all/all/all/all/in-play", { waitUntil: "networkidle2" });
            let urls = await page.evaluate(() => {
                let results = [];
                let items = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-mod-event-group-container--live");
                items.forEach((item) => {
                  var txtCheck = item.innerText.toString();
                  if (txtCheck.includes(":")) {
                    //do nothing!, this should be already expanded
                  } else {
                    item.querySelector("header > div > h2 > div").click();
                  }
                  results.push({
                    url:  item.nodeValue,
                    text: item.innerText,
                    count: item.childElementCount,
                  });
                });
                return results;
            })
            let urls2 = await page.evaluate(() => {
                let results2 = [];
                let items2 = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-expanded.KambiBC-mod-event-group-container--live > div > ul.KambiBC-betoffer-labels.KambiBC-betoffer-labels--with-title.KambiBC-betoffer-labels--collapsable");
                items2.forEach((item) => {
                    if (item.childElementCount == 2) {
                      item.click();
                      results2.push({
                          url2:  item.getAttribute('href'),
                          text2: item.innerText,
                      });
                    }
                });
                return results2;
            })
            //this is hacky but works fine for now, maybe we can wait for all the odds to load somehow?
            await page.waitFor(1 * 1000);
            //all games w/ odds should be loaded
            let urls3 = await page.evaluate(() => {
                let results3 = [];
                //select boxes for each sport w/:
                //"#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div:nth-child(n)"
                //class="KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-expanded KambiBC-mod-event-group-container--live"

                //save name of sport at:
                //"header > div > h2 > div > span.KambiBC-mod-event-group-header__main-title"

                //select match boxes
                //#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div:nth-child(2) > div > ul:nth-child(2)
                //"div > ul.KambiBC-list-view__column.KambiBC-list-view__event-list"
                //"ul.KambiBC-list-view__column.KambiBC-list-view__event-list"

                //save each name of competitors at: should be two iterations!
                //"div > ul:nth-child(2) > li > a > div > div.KambiBC-event-item__event-info > div.KambiBC-event-item__details > div.KambiBC-event-item__participants-container > div > div:nth-child(n)"
                //class="KambiBC-list-view__column KambiBC-list-view__event-list"
                //"div > ul.KambiBC-list-view__column.KambiBC-list-view__event-list > li > a > div > div.KambiBC-event-item__event-info > div.KambiBC-event-item__details > div.KambiBC-event-item__participants-container > div > div:nth-child(n)"
                //***if ul substitution doesn't work, we can grab only even ul:nth-child's

                let sportBoxes = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-expanded.KambiBC-mod-event-group-container--live");
                sportBoxes.forEach((item) => {
                  var sport = item.querySelector("header > div > h2 > div > span.KambiBC-mod-event-group-header__main-title");
                  let leagueBoxes = item.querySelectorAll("div > ul.KambiBC-list-view__column.KambiBC-list-view__event-list");
                  results3.push({
                    sport_name:  sport.innerText,
                  });
                  leagueBoxes.forEach((league) => {
                    let gameBoxes = league.querySelectorAll("li");
                      gameBoxes.forEach((game) => {
                        let outcomeBoxes = game.querySelectorAll("a > div > div.KambiBC-event-item__bet-offers-container > div > div > div > div > button:nth-child(n)");
                        //class="KambiBC-mod-outcome"
                        //a > div > div.KambiBC-event-item__bet-offers-container > div > div > div > div > button:nth-child(n)
                        /*
                        results3.push({
                          sport_name:  sport.innerText,
                        });
                        */
                        outcomeBoxes.forEach((outcome) => {
                          //div > div.KambiBC-mod-outcome__label-wrapper > span
                          var name = outcome.querySelector("div > div.KambiBC-mod-outcome__label-wrapper > span").innerText;
                          //div > div.KambiBC-mod-outcome__odds-wrapper > span
                          var odds = (1/ (parseFloat(outcome.querySelector("div > div.KambiBC-mod-outcome__odds-wrapper > span").innerText,10)));
                          results3.push({
                            outcome_label: name,
                            probability: odds,
                          });
                        });
                      });
                  });

                });
                return results3;
            });

            html = await page.content();
            //await page.goto("https://www.unibet.com/betting#filter/all/all/all/all/in-play", { waitUntil: "networkidle2" });
            fs.writeFileSync("unibetBoxes.html", html);
            browser.close();
            return resolve(urls3);
        } catch (e) {
            return reject(e);
        }
    })
}

(async function(){
  let out = await run();
  out = JSON.stringify(out);
  fs.writeFileSync("unibetOutcomes.json", out);
  console.log(out);
  var time = new Date() - start;
  console.log(time);
})();
