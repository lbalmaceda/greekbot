'use latest';

import request from 'request';
import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
import _ from 'underscore';
import moment from 'moment';
const AWS = require('aws-sdk');

//Read secrets from Webtask Context
let BOT_DM_WEBHOOK_URL;
let SLACK_TOKEN;
let AWS_ACCESS_KEY_ID;
let AWS_SECRET_ACCESS_KEY;
//<<<<
let WORK_HOURS_DAY = 8;

const engCategories = [
    {name: "Administration & TimeOff", key: "cat_adm", color: "#a76e56"},
    {name: "Operational", key: "cat_ops", color: "#43fd21"},
    {name: "Product", key: "cat_prod", color: "#d52d6f"},
    {name: "Internal Team Request", key: "cat_req_internal", color: "#2093e0"},
    {name: "External Team Request", key: "cat_req_external", color: "#631ec7"},
    {name: "Hack Time", key: "cat_hack", color: "#ffff50"}
]

//Report structure
// {
//     entries : [
//         {
//             key: "cat_adm", 
//             hours: 3
//         }
//     ],
//     totalHours : 4
// }

let handleAction = (payload, storage) => {
    console.log("New action received!")
    console.log(JSON.stringify(payload));
    let type = payload.type;
    let callbackId = payload.callback_id;

    if (type === 'interactive_message'){
        if (callbackId === 'btn_start_report'){
            //FIXME: Don't use an interactive button for this, as requires
            //that we edit the message to remove the button later...
            processNextCategory();
        } else if (callbackId.startsWith('cat_')) {
            storage.get((error, data) =>{
                if (error){
                    console.error("Partial report reading error. " + error);
                }

                if (!data.reports){
                    data.reports = {};
                }
                let report = data.reports[payload.user.id] || {};
                report.entries = report.entries || [];
                let currentTotalHours = report.totalHours || 0;
                let hoursAmount = parseInt(payload.actions[0].selected_options[0].value);
                if (currentTotalHours + hoursAmount > WORK_HOURS_DAY){
                    console.error("Something went wrong. The counted hours are exceeding the max!");
                }
                let entry = { key: callbackId, hours: hoursAmount };
                report.entries.push(entry);
                report.totalHours = currentTotalHours + hoursAmount;
                
                //Continue with Slack response, save to Storage later
                processNextCategory(report);

                //Save to Storage
                data.reports[payload.user.id] = report;
                storage.set(data, (error) => {
                    if (error){
                        console.error("Partial report saving error. " + error);
                    }
                });
            });
        } else if (callbackId == 'confirm_report'){
            if (payload.actions[0].value === 'submit'){
                //Submit && then delete data
            } else if (payload.actions[0].value === 'cancel'){
                //Delete data
            }
            //Edit the message. Remove the buttons
        }
    } else if (type === 'dialog_submission' && callbackId === 'report_dialog'){
        let errorDescription = validateReport(payload.submission);
        if (errorDescription){
            return errorDescription;
        }
        let report = prepareReport(payload);
        submitReport(report);
    }
}

let processNextCategory = (report) => {
    let category;
    if (!report || !report.entries){
        category = engCategories[0];
    } else if (engCategories.length > report.entries.length){
        category = engCategories[report.entries.length];
    } 

    let totalHours = (report && report.totalHours) ? report.totalHours : 0;
    if (category && totalHours < WORK_HOURS_DAY){
        let message = reportMessageFor(category, WORK_HOURS_DAY - totalHours);
        makeRequest(BOT_DM_WEBHOOK_URL, message);
    } else {
        //Send report summary. 
        console.log("> > > > > > > > > The report has been completed");
        makeRequest(BOT_DM_WEBHOOK_URL, reportSummaryMessage(report));
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
            console.log("---- Ignoring BOT message. ----");            
            return;
    }
    console.log("New event received!");
    console.log(event);
    
    let text = event.text.trim();
    //text = text.substr(text.indexOf(" ")+1);
    if (text === 'report'){
      //react to report
      sendMessage("Hello! Please complete the report below", startReportMessage);
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



/// Express Middlewares

let middleware = function(req, res, next){
    //Load environment variables from Webtask Context
    loadWebtaskSecrets(req.webtaskContext.secrets);

    //Check if this is the slack handshake
    if (req.body.type === 'url_verification'){
        return replySlackHandshake(req, res);
    }

    if (req.baseUrl.includes('/slack/actions')){
        //User actions are stringified
        req.body = JSON.parse(req.body.payload); 
    }
    
    req.webtaskContext.storage.get((error, data) => {
        if (error || !req.body.token || req.body.token !== data.slack_verification_token){
          console.error("Request doesn't seems to come from Slack. Error:");
          console.error(error);
          return res.status(200).send('');
        }

        // if (!req.body.user){
            return next();
        // }

        //Recover previous report, if available.
        // req.webtaskContext.storage.get((error, data) => {
        //     if (error){
        //         console.error(error);
        //         return res.status(200).send('');
        //     }
        //     if (data.reports && data.reports[req.body.user.id]){
        //         req.report = data.reports[req.body.user.id];
        //     }
        //     next();            
        // });
    });
}

let loadWebtaskSecrets = (secrets) => {
    SLACK_TOKEN = secrets.SLACK_TOKEN;
    BOT_DM_WEBHOOK_URL = secrets.BOT_DM_WEBHOOK_URL;
    AWS_ACCESS_KEY_ID = secrets.AWS_ACCESS_KEY_ID;
    AWS_SECRET_ACCESS_KEY = secrets.AWS_SECRET_ACCESS_KEY;

    if (!SLACK_TOKEN || !BOT_DM_WEBHOOK_URL 
        // || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY
    ){
        throw new Error("Secrets must be loaded in the Webtask");
    }
}

let replySlackHandshake = (req, res) => {
    console.log("Handling Slack handshake");
    //Store token
    req.webtaskContext.storage.set(
        { slack_verification_token : req.body.token },
        { force: 1 },
        (error) => {
            if (error) {
                console.log("wt storage error:");
                console.log(error);
                return res.status(500)
                        .send("Handshake failed");
            } 
            return res.status(200)
                .send({"challenge" : req.body.challenge});
    });
}

///
/// Storage Logic
///

AWS.config.update({region:'us-east-1'});

// Create an S3 client
const s3 = new AWS.S3();
//FIXME: const athena = new AWS.Athena();

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

function getQueryResults(queryExecutionId, callback)
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



// Express APP - Routing

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, type: "application/x-www-form-urlencoded" })); //Required to parse actions
app.use('/slack/*', middleware);

app.post('/slack/actions', (req, res) => {
    res.status(200).send(body);
    let body = handleAction(req.body, req.webtaskContext.storage);
    return;
});

app.post('/slack/events', (req, res) => {
  if (req.body.type === 'event_callback'){
    res.sendStatus(200);
    handleEvent(req.body.event.type, req.body.event);
    return;
  }
  
  return res.status(500)
           .send("Can't handle this body");
});

module.exports = fromExpress(app);




//
// Slack Messages
//

//FIXME: This should not be a button. Better begin as soon as "report" is received
const startReportMessage = [{
    "text": "When you're ready press the Fill button to complete your report.",
    "callback_id": "btn_start_report",
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

let reportMessageFor = (category, remainingHours) => {
    return {
        "text": "Report completion in progress",
        "response_type": "in_channel",
        "attachments": [
            {
                "text": "How many hours have you spent on *" + category.name + "*",
                "attachment_type": "default",
                "callback_id": category.key,
                "color": category.color,
                "actions": [
                    generateOptions(remainingHours)
                ]
            }
        ]};
}

let reportSummaryMessage = (report) => {
    let sum = "";
    engCategories.forEach(c => {
        let entry = _.find(report.entries, (e) => e.key === c.key);
        let hours = entry ? entry.hours : 0;
        sum = sum.concat("_"+c.name+":_ " + hours + " hours\n");
    });
    sum = sum.concat("\n");
    return {
        "text": "This is your report summary: \n" + sum,
        "response_type": "in_channel",
        "attachments": [
            {
                "text": "Are you ready to submit this report?",
                "fallback": "You are unable to choose a game",
                "color": "#3AA3E3",
                "callback_id" : "confirm_report",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "confirm_report",
                        "text": "Submit",
                        "type": "button",
                        "style": "primary",
                        "value": "submit"
                    },
                    {
                        "name": "confirm_report",
                        "text": "Cancel",
                        "type": "button",
                        "style": "danger",
                        "value": "cancel",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "You will have to start over again."
                        }
                    }
                ]
            }
        ]
    };
}

let generateOptions = (remainingHours) => {
    //Remaining hours must be > 0
    let options = [{
        "text": "None",
        "value": "0"
    }];
    for (let i=1; i<=remainingHours; i++){
        options.push({
            "text": i + " Hours",
            "value": i//.toString()
        })
    }

    return {
        "name": "hours",
        "text": "Select a value",
        "type": "select",
        "options": options
    };
}