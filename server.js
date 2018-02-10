'use latest';
require('dotenv').config()
var formAttachments = require("./design/form.js");

const { RtmClient, CLIENT_EVENTS } = require('@slack/client');

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_TOKEN;

// Cache of data
const appData = {};

// Initialize the RTM client with the recommended settings. Using the defaults for these
// settings is deprecated.
const rtm = new RtmClient(token, {
  dataStore: false,
  useRtmConnect: true,
});

// The client will emit an RTM.AUTHENTICATED event on when the connection data is avaiable
// (before the connection is open)
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
  // Cache the data necessary for this app in memory
  appData.selfId = connectData.self.id;
  console.log(`Logged in as ${appData.selfId} of team ${connectData.team.id}`);
});

// The client will emit an RTM.RTM_CONNECTION_OPENED the connection is ready for
// sending and recieving messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
  console.log(`Ready`);
});

// New message . CLIENT_EVENTS.RTM.MESSAGE
rtm.on('message', (data) => {
    console.log(`Message on channel ${data.channel}: ${data.text}`);
    console.log(data);

    var message = {};
    message.type = "message";
    message.channel = data.channel;
    if (data.text === 'report'){
        //react to report
        message.text = "Hello! Please complete the report below";
        message.attachments = reportFormAttachments;
    } else {
        //teach them how to use the app
        message.text = "Please use `report` to begin completing your investment hours.";
    }

    rtm.send(message)
        // Returns a promise that resolves when the message is sent
        .then(() => console.log(`Message sent to channel ${message.channel}`))
        .catch(console.error);
    return;
});

// Start the connecting process
rtm.start();


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
