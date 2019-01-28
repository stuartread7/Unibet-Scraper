//puppeteer and fs must be properly installed.  Puppeteer allows creation of a headless browser and fs allows easy file-writing.
const puppeteer = require('puppeteer');
const fs = require("fs");
//function that returns JSON of implied probabilities of all bettable outcomes of in-play matches on unibet.com
function run () {
    return new Promise(async (resolve, reject) => {
        try {
            //open headless browser and navigate to in-play section of unibet.com
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://www.unibet.com/betting#filter/all/all/all/all/in-play", { waitUntil: "networkidle2" });
            let urls = await page.evaluate(() => {
                //the page contains different boxes for each sport.  Save these elements in a list
                let items = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-mod-event-group-container--live");
                items.forEach((item) => {
                  var txtCheck = item.innerText.toString();
                  if (txtCheck.includes(":")) {
                    //do nothing!, this box includes a match time and is already expanded
                  } else {
                    //for unexpanded boxes, query the references to the buttons that expand them and click them
                    item.querySelector("header > div > h2 > div").click();
                  }
                });
            })
            //all sports are now expanded and at the least the headers of the matches for each sport are visible
            //we must now expand the unexpanded matches to display outcomes and odds
            let urls2 = await page.evaluate(() => {
                //the page contains a header for each match.  Save these elements in a list
                let items2 = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-expanded.KambiBC-mod-event-group-container--live > div > ul.KambiBC-betoffer-labels.KambiBC-betoffer-labels--with-title.KambiBC-betoffer-labels--collapsable");
                items2.forEach((item) => {
                    if (item.childElementCount == 2) {
                      //from inspecting the html, only the items with two child elements have not yet been expanded. We click those items.
                      item.click();
                    }
                });
            })
            /*
            The information for all matches loads slowly and is continuously updated so we cannot use waitUntil: "networkidle2"
            We wait 3 seconds after expanding all the matches before trying to extract any information.
            Wait time can be tweaked depending on connection speed.
            *** A better implementation might find a way to continuously check if all odds are loaded then continue ***
            */
            await page.waitFor(1 * 3000);
            //all games w/ odds should be loaded
            let urls3 = await page.evaluate(() => {
                let results = [];
                //select boxes for each sport
                let sportBoxes = document.querySelectorAll("#KambiBC-content > div > div > div > div.KambiBC-quick-browse-container.KambiBC-quick-browse-container--list-only-mode > div.KambiBC-quick-browse__list.KambiBC-delay-scroll--disabled > div > div.KambiBC-time-ordered-list-container > div.KambiBC-time-ordered-list-content > div > div > div.KambiBC-collapsible-container.KambiBC-mod-event-group-container.KambiBC-expanded.KambiBC-mod-event-group-container--live");
                sportBoxes.forEach((item) => {
                  //record name of sport
                  var sport = item.querySelector("header > div > h2 > div > span.KambiBC-mod-event-group-header__main-title");
                  //select league boxes within each sport
                  let leagueBoxes = item.querySelectorAll("div > ul.KambiBC-list-view__column.KambiBC-list-view__event-list");
                  //push sport name to output
                  results.push({
                    sport_name:  sport.innerText,
                  });
                  leagueBoxes.forEach((league) => {
                    //select game boxes within each league
                    let gameBoxes = league.querySelectorAll("li");
                      gameBoxes.forEach((game) => {
                        //select outcome containers within each game
                        let outcomeBoxes = game.querySelectorAll("a > div > div.KambiBC-event-item__bet-offers-container > div > div > div > div > button:nth-child(n)");
                        outcomeBoxes.forEach((outcome) => {
                          //record name of outcome (team name, draw)
                          var name = outcome.querySelector("div > div.KambiBC-mod-outcome__label-wrapper > span").innerText;
                          //record implied probability of that outcome
                          var odds = (1/ (parseFloat(outcome.querySelector("div > div.KambiBC-mod-outcome__odds-wrapper > span").innerText,10)));
                          //push to output
                          results.push({
                            outcome_label: name,
                            probability: odds,
                          });
                        });
                      });
                  });
                });
                return results;
            });
            //save html of page after expanding all sports/matches.  Not necessary but helpful if experimenting.
            html = await page.content();
            fs.writeFileSync("unibetBoxes.html", html);
            //close headless browser
            browser.close();
            return resolve(urls3);
        } catch (e) {
            return reject(e);
        }
    })
}

//run our function, write a JSON file w/ results and output results to terminal/console
(async function(){
  let out = await run();
  out = JSON.stringify(out);
  fs.writeFileSync("unibetOutcomes.json", out);
  console.log(out);
})();
