
//
// Slack Messages
//

const eightHours = [
    {
        "label": "1 Hour",
        "value": "1"
    },
    {
        "label": "2 Hours",
        "value": "2"
    },
    {
        "label": "3 Hours",
        "value": "3"
    },
    {
        "label": "4 Hours",
        "value": "4"
    },
    {
        "label": "5 Hours",
        "value": "5"
    },
    {
        "label": "6 Hours",
        "value": "6"
    },
    {
        "label": "7 Hours",
        "value": "7"
    },
    {
        "label": "8 Hours",
        "value": "8"
    }
  ];
  
  const openReportDialogButton = [{
      "text": "When you're ready press the Fill button to complete your report.",
      "callback_id": "btn_open_dialog",
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
  
  const dialogForm = {
      "callback_id": "report_dialog",
      "title": "Request a Ride",
      "submit_label": "Request",
      "elements": [
          {
              "label": "Administration & TimeOff",
              "type": "select",
              "name": "cat_administration",
              "placeholder": "Select a value",
              "optional": true,
              "options": eightHours
          },
          {
              "label": "Operational",
              "type": "select",
              "name": "cat_operational",
              "placeholder": "Select a value",
              "optional": true,
              "options": eightHours
          },
          {
              "label": "Product",
              "type": "select",
              "name": "cat_product",
              "placeholder": "Select a value",
              "optional": true,
              "options": eightHours
          },
          {
              "label": "Internal Team Request",
              "type": "select",
              "name": "cat_request",
              "placeholder": "Select a value",
              "optional": true,
              "options": eightHours
          },
          {
              "label": "Hack Time",
              "type": "select",
              "name": "cat_hack",
              "placeholder": "Select a value",
              "optional": true,
              "options": eightHours
          },
      ]
    }


    module.exports = {}
    module.exports.openReportDialogButton=openReportDialogButton;
    module.exports.dialogForm=dialogForm;