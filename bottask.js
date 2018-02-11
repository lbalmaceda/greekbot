'use latest';

import request from 'request';
import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
import _ from 'underscore';
import moment from 'moment';
const app = express();


//Read secrets from Webtask Context
//const BOT_DM_WEBHOOK_URL = context.secrets.BOT_DM_WEBHOOK_URL;
var BOT_DM_WEBHOOK_URL;
var SLACK_TOKEN;
//<<<<
var WORK_HOURS_DAY = 8;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, type: "application/x-www-form-urlencoded" })) //Required to parse actions

app.post('/slack/actions', (req, res) => {
  //FIXME:
  //Get the secrets from the upper context
    SLACK_TOKEN = req.webtaskContext.secrets.SLACK_TOKEN;
    if (!SLACK_TOKEN){
      throw new Error("Secrets must be loaded in the Webtask");
    }

    console.log("New action received!")
    var payload = JSON.parse(req.body.payload);

    req.webtaskContext.storage.get((error, data) => {
        if (error || !payload.token || payload.token !== data.slack_verification_token){
          console.log("Request doesn't seems to come from Slack. Error:");
          console.log(error);
          return res.status(200).send('');
        }

        var body = handleAction(payload.type, payload.callback_id, payload);
        return res.status(200).send(body);
    });
});

app.post('/slack/events', (req, res) => {
  //FIXME:
  //Get the secrets from the upper context
  BOT_DM_WEBHOOK_URL = req.webtaskContext.secrets.BOT_DM_WEBHOOK_URL;
  if (!BOT_DM_WEBHOOK_URL){
    throw new Error("Secrets must be loaded in the Webtask");
  }
  //<<<<

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
      handleEvent(req.body.event.type, req.body.event);
      return res.sendStatus(200);
    });
    return;
  }
  
  return res.status(500)
           .send("Can't handle this body");
});

var handleAction = (type, callbackId, payload) => {
    console.log(payload);
    
    if (type === 'interactive_message' && callbackId === 'btn_open_dialog'){
        openDialog(dialogForm, payload.trigger_id);
    } else if (type === 'dialog_submission' && callbackId === 'report_dialog'){
        var errorDescription = validateReport(payload.submission);
        if (errorDescription){
            return errorDescription;
        }
        var report = prepareReport(payload);
        submitReport(report);
    }
}

var validateReport = (data) => {    
    var hours = _.reduce(_.values(data), (sum, value)=>{
        if(value){
            return sum + parseInt(value);
        } else {
            return sum;
        }
    }, 0);

    console.log("Sum is: " + hours);
    if (hours !== WORK_HOURS_DAY){
        return {errors: [{
            name: 'cat_operational',
            error: 'Maybe this value is wrong?'
        }]}
    }
}

var prepareReport = (payload) => {
    
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

    var report = {};
    report.user = payload.user;
    report.date = moment().unix();
    var hours = _.mapObject(payload.submission, (val)=> {
        if(val){
            return parseInt(val);
        } else {
            return 0;
        }
    });
    report.categories = hours;
    return report;
}

var handleEvent = (type, event) => {
    if (type !== 'message' || 
        event.message && event.message.subtype === 'bot_message' ||
        event.subtype === 'bot_message'){
            //ignore
            return;
    }
    console.log(event);
    
    var text = event.text.trim();
    //text = text.substr(text.indexOf(" ")+1);
    if (text === 'report'){
      //react to report
      sendMessage("Hello! Please complete the report below", openReportDialogButton);
    } else {
      //teach them how to use the app
      sendMessage("Please use `report` to begin completing your investment hours.");
    }
  
  //other types?
};

var sendMessage = (text, attachments) => {
  //Construct the Slack message
  var message = {
    text:text
  };
  if (attachments && attachments instanceof Array){
    message.attachments = attachments;
  }

  makeRequest(BOT_DM_WEBHOOK_URL, message);
};

var openDialog = (dialog, triggerId) => {
    var payload = {};
    payload.dialog = dialog;
    payload.trigger_id = triggerId;
    makeRequest("https://slack.com/api/dialog.open", payload, SLACK_TOKEN);
}

var makeRequest = (uri, body, token) => {
    var options = {
        uri: uri,
        method: 'POST',
        json: body
    };
    if(token){
        options.headers = {'Authorization': 'Bearer ' + token}
    }
        
    request(options, (error, response, body) => {
        if (error){
            console.log("Request errored")
            console.log(error);
            return;
        }
        if (response.statusCode != 200) {
            console.log("Response not successful")
            //Should we retry instead?
        }
        console.log(body);        
    });
}

var submitReport = (report) => {

  // Save S3 - 'username-date.json'

};

module.exports = fromExpress(app);








//
// Slack Messages
//

var eightHours = [
  {
      "label": "1 Hour",
      "value": "1"
  },
  {
      "label": "2 Hours",
      "value": "2"
  },
  {
      "label": "3 Hours",
      "value": "3"
  },
  {
      "label": "4 Hours",
      "value": "4"
  },
  {
      "label": "5 Hours",
      "value": "5"
  },
  {
      "label": "6 Hours",
      "value": "6"
  },
  {
      "label": "7 Hours",
      "value": "7"
  },
  {
      "label": "8 Hours",
      "value": "8"
  }
];

var openReportDialogButton = [{
    "text": "When you're ready press the Fill button to complete your report.",
    "callback_id": "btn_open_dialog",
    "actions": [
        {
            "name": "submit",
            "text": "Fill",
            "type": "button",
            "style": "primary",
            "value": "submit"
        }
    ]
}];

var dialogForm = {
    "callback_id": "report_dialog",
    "title": "Request a Ride",
    "submit_label": "Request",
    "elements": [
        {
            "label": "Administration & TimeOff",
            "type": "select",
            "name": "cat_administration",
            "placeholder": "Select a value",
            "optional": true,
            "options": eightHours
        },
        {
            "label": "Operational",
            "type": "select",
            "name": "cat_operational",
            "placeholder": "Select a value",
            "optional": true,
            "options": eightHours
        },
        {
            "label": "Product",
            "type": "select",
            "name": "cat_product",
            "placeholder": "Select a value",
            "optional": true,
            "options": eightHours
        },
        {
            "label": "Internal Team Request",
            "type": "select",
            "name": "cat_request",
            "placeholder": "Select a value",
            "optional": true,
            "options": eightHours
        },
        {
            "label": "Hack Time",
            "type": "select",
            "name": "cat_hack",
            "placeholder": "Select a value",
            "optional": true,
            "options": eightHours
        },
    ]
  }