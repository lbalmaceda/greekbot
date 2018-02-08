var formAttachments = require('./design/form.js');

module.exports = function(context) {
  return {
    help: function(req, res) {
        var helpMessage = "Try using `report`.";
        return res.text(helpMessage).send();
    },
    report: function(req, res) {
      try {
        return res.attachment("Engineer Investment Report", formAttachments).send();
      } catch (e) {
        return res.text('Ups! That was unexpected :/ \n```' + JSON.stringify(e) + '```').send();
      }
    }
  };
};