


## bottask.js file
Webtask file that uses Slack Events API and WebHooks.

Get the Slack OAuth Token from the App settings (xoxp-...) and the bot Webhook URL. Use them as parameters for the next command.

Install The [Webtasks CLI](https://github.com/auth0/wt-cli) and run:

```
wt create bottask.js --secret BOT_DM_WEBHOOK_URL={FILL-ME} --secret SLACK_TOKEN={xoxp-FILL-ME} --ignore-package-json --name greekbot
```

Check the logs using:

```
wt logs
```


## server.js file
Websocket server from the Slack RTM API. 
This file can be ignored.
