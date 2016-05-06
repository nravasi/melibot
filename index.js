var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var searchClient = require('./search_client')
var item_formatter = require('./item_formatter')
var util = require('util');
var app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'placeholder_token') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    //use async
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            searchClient.search(event, handleClientResponse);
        }
    }
    res.sendStatus(200)
})

var handleClientResponse = function(event, err, body){
    //console.log("La response es" + util.inspect(body, false, null));
    var senderId = event.sender.id;
    if(err){
        sendTextMessage(senderId, "Hubo un error");
    }else{
        if(!body.results || !body.results.length){
            return sendTextMessage(senderId, "No hay resultados");
        }
        var elements = item_formatter.formatItems(body.results)

        return sendMessage(senderId, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": elements
                }
            }
        });
    }
}

function sendTextMessage(sender, text) {
    sendMessage(sender, {
        text:text
    })
}

function sendMessage(sender, data){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: data,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}


var token = "EAAD1W15TivwBAJQeP0mdn2QNmi4HVlJ42bO1jDDNZBzAQqItXPmprRzZBVGbnIc2hrugPnFtnShzZAORlKzZCLQOWqZBnkHlC1zhtm1aXcufIGFaUZCZAD1LHnwtLHDqzDPuUmP1ZCgOUigpuYAH6TrWnE0V9yUfAuHU86VBogxYGwZDZD"