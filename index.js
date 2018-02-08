module.exports = function(context) {
  return {
    help: function(req, res) {
        var helpMessage = "Try using `report`.";
        return res.text(helpMessage).send();
    },
    report: function(req, res) {
      try {
        const greetingAttachment = [{
                    "text": "Ok! Are you ready to fill today's report?",
                    "callback_id": "wopr_game",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "fill",
                            "text": "Fill report",
                            "type": "button",
                            "value": "fill"
                        },
                        {
                            "name": "cancel",
                            "text": "Cancel",
                            "style": "danger",
                            "type": "button",
                            "value": "cancel",
                            "confirm": {
                                "title": "Are you sure?",
                                "ok_text": "Yes",
                                "dismiss_text": "No"
                            }
                        }
                    ]
                }
            ];

        return res.attachment("Engineer Investment Report", greetingAttachment).send();
      } catch (e) {
        return res.text('Ups! That was unexpected:/\n```' + JSON.stringify(e) + '```').send();
      }
    },
    
  };
};