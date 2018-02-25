'use latest';

import moment from 'moment';
const AWS = require('aws-sdk');

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



