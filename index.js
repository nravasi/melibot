var express = require('express')
var bodyParser = require('body-parser')
var util = require('util');
var sessions = require('./sessions');
var app = express()
var bot = require('./wit-bot.js')

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

var useWit = true;

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function(req, res) {
    //use async
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i]

        if (event.message && event.message.text) {
            var sessionId = sessions.createSession(event.sender.id);
            bot.respondTo(sessionId, event.message.text)

        }
    }
    res.sendStatus(200);
});

