var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var searchClient = require('./search_client')
var item_formatter = require('./item_formatter')
var util = require('util');
var app = express()
var Wit = require('node-wit').Wit;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === 'placeholder_token') {
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
        event = req.body.entry[0].messaging[i]

        if (event.message && event.message.text) {
            var sessionId = findOrCreateSession(event.sender.id);
            wit.runActions(
                sessionId,
                event.message.text,
                sessions[sessionId].context,
                (error, context) => {
                    if (error) {
                        console.log('Oops! Got an error from Wit:', error);
                    } else {
                        // Our bot did everything it has to do.
                        // Now it's waiting for further messages to proceed.
                        console.log('Waiting for futher messages.');

                        // Based on the session state, you might want to reset the session.
                        // This depends heavily on the business logic of your bot.
                        // Example:
                        // if (context['done']) {
                        //   delete sessions[sessionId];
                        // }

                        // Updating the user's current session state
                        sessions[sessionId].context = context;
                    }
                })
        }
    }
    res.sendStatus(200);
});

var sessions = {};

var findOrCreateSession = (fbid) => {
    var sessionId;
    // Let's see if we already have a session for the user fbid
    Object.keys(sessions).forEach(k => {
        if (sessions[k].fbid === fbid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user fbid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = {
            fbid: fbid,
            context: {}
        };
    }
    return sessionId;
};

var handleClientResponse = function(senderId, err, body) {
    if (err) {
        sendTextMessage(senderId, "Hubo un error");
    } else {
        if (!body.results || !body.results.length) {
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
        text: text
    })
}

function sendMessage(sender, data) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: fb_token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
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

var wit_token = "X4RADLYL7NP5VZULIGFVCCULEOFVVTZZ"


var actions = {
    say(sessionId, context, message, cb) {
        // Our bot has something to say!
        // Let's retrieve the Facebook user whose session belongs to
        var recipientId = sessions[sessionId].fbid;
        if (recipientId) {
            // Yay, we found our recipient!
            // Let's forward our bot response to her.
            sendTextMessage(recipientId, message);

            // Let's give the wheel back to our bot
        } else {
            console.log('Oops! Couldn\'t find user for session:', sessionId);
            // Giving the wheel back to our bot
        }
        cb();

    },
    merge(sessionId, context, entities, message, cb) {
        cb(context);
    },
    search(sessionId, context, cb) {
        console.log("Entities: " + util.inspect(context, false, null));
        var recipientId = sessions[sessionId].fbid;
        searchClient.search(recipientId, context, handleClientResponse);
    },
    error(sessionId, context, error) {
        console.log(error.message);
    }
    // You should implement your custom actions here
    // See https://wit.ai/docs/quickstart
};

var wit = new Wit(wit_token, actions)

var fb_token = "EAAD1W15TivwBAJQeP0mdn2QNmi4HVlJ42bO1jDDNZBzAQqItXPmprRzZBVGbnIc2hrugPnFtnShzZAORlKzZCLQOWqZBnkHlC1zhtm1aXcufIGFaUZCZAD1LHnwtLHDqzDPuUmP1ZCgOUigpuYAH6TrWnE0V9yUfAuHU86VBogxYGwZDZD"