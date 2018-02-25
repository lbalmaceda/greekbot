'use latest';

import request from 'request';
import _ from 'underscore';
import moment from 'moment';
const MESSAGES = require('./slack_messages.js');

let WORK_HOURS_DAY = 8;

//Read secrets from Webtask Context
let BOT_DM_WEBHOOK_URL;
let SLACK_TOKEN;
let AWS_ACCESS_KEY_ID;
let AWS_SECRET_ACCESS_KEY;
//<<<<



let handleAction = (type, callbackId, payload) => {
    console.log("New action received!")
    console.log(payload);
    
    if (type === 'interactive_message' && callbackId === 'btn_open_dialog'){
        openDialog(MESSAGES.dialogForm, payload.trigger_id);
    } else if (type === 'dialog_submission' && callbackId === 'report_dialog'){
        let errorDescription = validateReport(payload.submission);
        if (errorDescription){
            return errorDescription;
        }
        let report = prepareReport(payload);
        submitReport(report);
    }
}

let validateReport = (data) => {    
    let hours = _.reduce(_.values(data), (sum, value)=>{
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


let prepareReport = (payload) => {
    
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

    let report = {};
    report.user = payload.user;
    report.date = moment().unix();
    let hours = _.mapObject(payload.submission, (val)=> {
        if(val){
            return parseInt(val);
        } else {
            return 0;
        }
    });
    report.categories = hours;
    return report;
}

let submitReport = (report) => {

    // Save S3 - 'username-date.json'
  
  };

  

let handleEvent = (type, event) => {
    if (type !== 'message' || 
        event.message && event.message.subtype === 'bot_message' ||
        event.subtype === 'bot_message'){
            //ignore
            console.log("---- Ignoring BOT message. ----");            
            return;
    }
    console.log("New event received!");
    console.log(event);
    
    let text = event.text.trim();
    //text = text.substr(text.indexOf(" ")+1);
    if (text === 'report'){
      //react to report
      sendMessage("Hello! Please complete the report below", MESSAGES.openReportDialogButton);
    } else {
      //teach them how to use the app
      sendMessage("Please use `report` to begin completing your investment hours.");
    }
  
  //other types?
};

let sendMessage = (text, attachments) => {
  //Construct the Slack message
  let message = {
    text:text
  };
  if (attachments && attachments instanceof Array){
    message.attachments = attachments;
  }

  makeRequest(BOT_DM_WEBHOOK_URL, message);
};

let openDialog = (dialog, triggerId) => {
    let payload = {};
    payload.dialog = dialog;
    payload.trigger_id = triggerId;
    makeRequest("https://slack.com/api/dialog.open", payload, SLACK_TOKEN);
}

let makeRequest = (uri, body, token) => {
    let options = {
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

module.exports = {};
module.exports.handleAction = handleAction;
module.exports.handleEvent = handleEvent;