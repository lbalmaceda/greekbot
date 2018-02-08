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
                    "fallback": "Complete the time investment form",
                    "callback_id": "greet_msg",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "fill",
                            "text": "Fill",
                            "type": "button",
                            "value": "fill",
                            "style": "primary"
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