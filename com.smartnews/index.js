"use strict";
const Tp = require("thingpedia");
const API_URL = "http://dev-snva.smartnews.com/api/v1";
const DEVICE_TOKEN = 1;  // use 1 for now
const cheerio = require("cheerio");

module.exports = class SmartNewsDevice extends Tp.BaseDevice {
    constructor(engine, state) {
         super(engine, state);

         this.uniqueId = "com.smartnews";
         this.name = "SmartNews";
         this.description = "SmartNews latest articles";
    }

    //connect SN API endpoint /news with GET request
    get_article({news_id}) {
        let url = API_URL + "/news?articleId=" + news_id;
        return Tp.Helpers.Http.get(url).then((response) => {
            return JSON.parse(response);
        }).then((parsed) => {
            if (parsed['status'] === 404) {
                throw new Error("Invalid news ID");
            }
            return [{
                article_id: parsed["id"],
                title: parsed["title"],
                link: parsed["url"],
                date: new Date(parsed["publishedTimestamp"] * 1000),
                site_name: parsed["site"]["name"],
                snippet: parsed["snippet"]
            }];
        });
    }

    //connect SN API endpoint /top with GET request
    get_top_articles({device_token=DEVICE_TOKEN, count}) {
      let url = API_URL + "/top?deviceToken=" + device_token;
      count = count || 5; //default is 5 news
      return Tp.Helpers.Http.get(url).then(
        (response) => {return JSON.parse(response);}
      ).then(
        (parsed) => {
            let newArray = parsed['blocks'][0]['links'].concat(parsed['blocks'][1]['links']);
            newArray = newArray.filter(element => element['articleViewStyle']==='SMART');
            newArray = newArray.slice(0, count);
            let smartPromises = newArray.map((item) => {
              let smartUrl = API_URL + "/smart?url=" + item['url'];
              return Tp.Helpers.Http.get(smartUrl);
            });
            return Promise.all(smartPromises);
          }).then(
            (smartResponse) => {
            return smartResponse.map((response) => {
                let smartArticle = JSON.parse(response);
                //let $ = cheerio.load(smartArticle['content']);
                //let content = parsedHtml.body.textContent;
                return {
                    title: smartArticle["title"],
                    link: smartArticle["link"],
                    date: new Date(smartArticle["pubDate"]),
                    site_name: smartArticle["siteName"],
                    content: cheerio.load(smartArticle['content'])("p").text()
                };
              });
            });
    }

    //connect SN API endpoint /list with GET request
    get_reading_list({device_token=DEVICE_TOKEN}) {
        let url = API_URL + "/list?deviceToken=" + device_token;
        return Tp.Helpers.Http.get(url).then((response) => {
            let jsonData = JSON.parse(response);
            let articleIdList = jsonData.articleIdList;
            let newsPromises = articleIdList.map((articleId) => {
                let url = API_URL + "/news?articleId=" + articleId;
                return Tp.Helpers.Http.get(url);
            });
            return Promise.all(newsPromises);
        }).then((responses) => {
            return responses.filter((response) => {
                let newArray = JSON.parse(response);
                return (newArray['articleViewStyle'] === 'SMART') && (newArray['title'] !== 'coronavirus_push_landingpage');
              })}).then((filtered) => {
                return filtered.map((item) => {
                  let article = JSON.parse(item);
                  return {
                      news_id: article["id"].toString(),
                      title: article["title"],
                      link: article["url"],
                      date: new Date(article["publishedTimestamp"]*1000),
                      site_name: article["site"]["name"]
                    };
                  });
                });
    }

    //connect SN API endpoint /pocket with POST request
    do_pocket({news_id, device_token=DEVICE_TOKEN}) {
        return Tp.Helpers.Http.post(
            API_URL + "/pocket?deviceToken=" + device_token,
            JSON.stringify({ articleIds: [news_id] }),
            { dataContentType: 'application/json' }
        );
    }

    //connect SN API endpoint /drop with POST request
    do_drop({news_id, device_token=DEVICE_TOKEN}) {
        return Tp.Helpers.Http.post(
            API_URL + "/drop?deviceToken=" + device_token,
            JSON.stringify({ articleIds: [news_id] }),
            { dataContentType: 'application/json' }
        );
    }
};
