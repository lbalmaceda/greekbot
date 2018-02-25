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
let BOT_DM_WEBHOOK_URL;
let SLACK_TOKEN;
//<<<<
let WORK_HOURS_DAY = 8;

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
    let payload = JSON.parse(req.body.payload);

    req.webtaskContext.storage.get((error, data) => {
        if (error || !payload.token || payload.token !== data.slack_verification_token){
          console.log("Request doesn't seems to come from Slack. Error:");
          console.log(error);
          return res.status(200).send('');
        }

        let body = handleAction(payload.type, payload.callback_id, payload);
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
    let data = {};
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

let handleAction = (type, callbackId, payload) => {
    console.log(payload);
    
    if (type === 'interactive_message' && callbackId === 'btn_open_dialog'){
        openDialog(dialogForm, payload.trigger_id);
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

let handleEvent = (type, event) => {
    if (type !== 'message' || 
        event.message && event.message.subtype === 'bot_message' ||
        event.subtype === 'bot_message'){
            //ignore
            return;
    }
    console.log(event);
    
    let text = event.text.trim();
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

let submitReport = (report) => {

  // Save S3 - 'username-date.json'

};

module.exports = fromExpress(app);







///
/// Storage Logic
///

const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({region:'us-east-1'});

// Create an S3 client
const s3 = new AWS.S3();

//Must be defined in the webtask's secrets
AWS_ACCESS_KEY_ID = req.webtaskContext.secrets.AWS_ACCESS_KEY_ID;
AWS_SECRET_ACCESS_KEY = req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY;

// Create a bucket and upload something into it
let bucketName = 'dennis-storage';

let body = {
    team: "brucke",
    user: "walsh",
    date: "2018-01-01",
    administration : 2,
    operations : 10,
    product : 2,
    internal_sales : 20,
    internal_cs : 3,
    hacktime : 2
};

const athena = new AWS.Athena();


let report = {
    team: "brucke",
    user: "lucho",
    date: "2018-02-07",
    administration : 2,
    operations : 10,
    product : 2,
    internal_sales : 20,
    internal_cs : 3,
    hacktime : 2
};

// usage sample
// postReport(report, function(err, data) {
//     if (!err)  {
//         getCurrentWeekReport('brucke', function(err, data) {
//             if (err) console.log(err);
//             else console.log(data);
//         });
//     } else {
//         console.log(err);
//     }
// });

function postReport(report, callback)
{
    let entryName = report.user + "_" + report.date + ".json";
    let params = { Bucket: bucketName, Key: entryName, Body: JSON.stringify(report)};

    s3.putObject(params, function(err, data) {
        callback(err, data);
    });
}

function getPastWeekReport(team, callback)
{
    getTimeReport(team, moment().startOf('isoWeek').subtract(1, "week"), callback);
}

function getCurrentWeekReport(team, callback)
{
    getTimeReport(team, moment().startOf('isoWeek'), callback);
}

function getTimeReport(team, week, callback)
{
    let weekStart = week.format("YYYY-MM-DD");
    let weekEnd = moment(week).add(6, "days").format("YYYY-MM-DD");

    let sqlQuery =  
        `select team, 
            sum(administration) as administration,
            sum(product) as product,
            sum(operations) as operations,
            sum(internal_sales) as internal_sales,
            sum(internal_cs) as internal_cs,
            sum(hacktime) as hacktime_cs
        from time_reports 
        where team = '${team}' and date >= date '${weekStart}' and date <= date '${weekEnd}'
        group by team`;

    executeQuery(sqlQuery, callback);
}

function executeQuery(sqlQuery, callback)
{
    let params = {
        QueryString: sqlQuery,
        ResultConfiguration: { /* required */
            OutputLocation: S3_OUTPUT_LOCATION, /* required */
        },
        QueryExecutionContext: {
            Database: 'dennisdb'
        }
    };

    athena.startQueryExecution(params, function (err, data) {
        if (err) 
        {
            callback(err, {});
        }
        else    
        {
            getQueryResults(data.QueryExecutionId, function (err, json)
            {
                callback(err, json);
            });
        } 
    });
}

getQueryResults = function(queryExecutionId, callback)
{
    let params = {
        QueryExecutionId: queryExecutionId
      };

    athena.getQueryResults(params, function(err, data) {
        if (err) 
        {
            if (err.code == 'InvalidRequestException')
            {
                getQueryResults(queryExecutionId, callback);
                // console.log("retry " + err);
            }
            else
            {
                callback(err, null);
            }
        }
        else     
        { 
            let result = '[';

            for (let rowIdx = 1; rowIdx < data.ResultSet.Rows.length; rowIdx ++)
            {
                result += '{';
                for (let colIdx = 0; colIdx < data.ResultSet.Rows[0].Data.length; colIdx++)
                {
                    result += '"' + data.ResultSet.Rows[0].Data[colIdx].VarCharValue + '": "' + data.ResultSet.Rows[rowIdx].Data[colIdx].VarCharValue + '",'
                }
                result = result.substring(0, result.length - 1);
                result += "},";
            }
            
            result = result.substring(0, result.length - 1);
            
            result += "]";
            callback(null, JSON.parse(result));
        }
      });
}






//
// Slack Messages
//

const eightHours = [
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

const openReportDialogButton = [{
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

const dialogForm = {
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