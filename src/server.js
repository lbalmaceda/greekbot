'use latest';

const middleware = require('./middleware.js');
const slack = require('./slack.js');
import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';

// Express APP - Routing
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, type: "application/x-www-form-urlencoded" })); //Required to parse actions
app.use('/slack/*', middleware);

app.post('/slack/actions', (req, res) => {
    let body = slack.handleAction(req.body.type, req.body.callback_id, req.body);
    res.status(200).send(body);
    return;
});

app.post('/slack/events', (req, res) => {
  if (req.body.type === 'event_callback'){
    res.sendStatus(200);
    slack.handleEvent(req.body.event.type, req.body.event);
    return;
  }
  
  return res.status(500)
           .send("Can't handle this body");
});

module.exports = fromExpress(app);