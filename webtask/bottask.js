'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
const app = express();

app.use(bodyParser.json());

app.post('/slack/events', (req, res) => {
  console.log("body:");
  console.log(req.body);

  if (req.body.type === 'url_verification'){
    //Slack verification handshake. Move this to a middleware
    console.log("Handling Slack handshake");
    var data = {};
    data.slack_verification_token = req.body.token;
    req.webtaskContext.storage.set(data, { force: 1 }, (error) => {
      if (error) {
        console.log("wt storage error:");
        console.log(error);
        return res.status(500)
                .send("Handshake failed");
      } 
      return res.status(200)
        .send({"challenge" : req.body.challenge});
    });
    return;
  }

  if (req.body.type === 'event_callback'){
    console.log("New event received!");
    req.webtaskContext.storage.get((error, data) => {
      if (error || !req.body.token || req.body.token !== data.slack_verification_token){
        console.log("Request doesn't seems to come from Slack. Error:");
        console.log(error);
        return res.sendStatus(200);
      }
      handleEvent(req.body.event.type, req.body);
      return res.sendStatus(200);
    });
    return;
  }
  
  return res.status(500)
           .send("Can't handle this body");
});

var handleEvent = (type, event) => {

}

var submitReport = (reportData) => {
// Format Input
//   {
//    "crew": "brucke",
//        "user": "walsh",
//        "date": "2018-02-09",
//        "category": {
//                "administration": 2,
//                "operational": 0,
//                "product_innovation": 4,
//                "internal_sales": 2,
//                "internal_cs": 0,
//                "hack_time": 0
//         }
//   }

  // Save S3 - 'username-date.json'

};

module.exports = fromExpress(app);