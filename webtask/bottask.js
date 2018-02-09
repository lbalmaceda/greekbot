'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
const app = express();

app.use(bodyParser.json());

app.get('/submit_report', (req, res) => {
// Format Input
//   {
//    "crew": "brucke",
// 	  "user": "walsh",
// 	  "date": "2018-02-09",
// 	  "category": {
// 		  "administration": 2,
// 		  "operational": 0,
// 		  "product_innovation": 4,
// 		  "internal_sales": 2,
// 		  "internal_cs": 0,
// 		  "hack_time": 0
// 	   }
//   }


  // Save S3 - 'username-date.json'
  
  res.sendStatus(200);
});

module.exports = fromExpress(app);