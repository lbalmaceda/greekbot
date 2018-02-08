var eightHours = [
    {
        "text": "No",
        "value": "0"
    },
    {
        "text": "1 Hour",
        "value": "1"
    },
    {
        "text": "2 Hours",
        "value": "2"
    },
    {
        "text": "3 Hours",
        "value": "3"
    },
    {
        "text": "4 Hours",
        "value": "4"
    },
    {
        "text": "5 Hours",
        "value": "5"
    },
    {
        "text": "6 Hours",
        "value": "6"
    },
    {
        "text": "7 Hours",
        "value": "7"
    },
    {
        "text": "8 Hours",
        "value": "8"
    }
];

var form = [
    {
        "text": "Administration (includes time off)",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "administration",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    },
        {
        "text": "Operational",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "operational",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    },
        {
        "text": "Product Innovation & Improvements",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "product_innovation",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    },
        {
        "text": "Internal Team Request - Sales",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "internal_sales",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    }
    ,
        {
        "text": "Internal Team Request - CS (not support)",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "internal_cs",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    },
        {
        "text": "Hack Time",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "callback_id": "framework_form",
        "actions": [
            {
                "name": "hack_time",
                "text": "Select Hours Spent",
                "type": "select",
                "options": eightHours
            }
        ]
    },
    {
        "text": "Finished?",
        "callback_id": "framework_form",
        "attachment_type": "default",
        "actions": [
            {
                "name": "Submit",
                "text": "Submit",
                "type": "button",
                "value": "submit"
            }
        ]
    }
];


module.exports = form;