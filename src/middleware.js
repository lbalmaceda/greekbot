/// Express Middlewares

let middleware = function(req, res, next){
    //Load environment variables from Webtask Context
    loadWebtaskSecrets(req.webtaskContext.secrets);

    //Check if this is the slack handshake
    if (req.body.type === 'url_verification'){
        return replySlackHandshake(req, res);
    }

    if (req.path.includes('/slack/actions')){
        //User actions are stringified
        req.body = JSON.parse(req.body.payload); 
    }
    
    req.webtaskContext.storage.get((error, data) => {
        if (error || !req.body.token || req.body.token !== data.slack_verification_token){
          console.error("Request doesn't seems to come from Slack. Error:");
          console.error(error);
          return res.status(200).send('');
        }
        next();
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