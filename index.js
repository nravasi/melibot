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

var useWit = true;

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
        var event = req.body.entry[0].messaging[i]

        if (event.message && event.message.text) {
            var sessionId = findOrCreateSession(event.sender.id, event);

            if (useWit) {
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
                    });
            } else {
                searchClient.search(event.sender.id, event.message.text, handleClientResponse);
            }
        }
    }
    res.sendStatus(200);
});

var sessions = {};

var findOrCreateSession = (fbid, event) => {
    var sessionId;
    // check if we already have a session for the user fbid
    Object.keys(sessions).forEach(k => {
        if (sessions[k].fbid === fbid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user fbid, create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = {
            fbid: fbid,
            name: event.sender.name,
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
            return sendTextMessage(senderId, "No siento! No encontré resultados para " + body.query);
        }
        var elements = item_formatter.formatItems(body.results)

        return sendMessage(senderId, {
            "text": 'Resultados encontrados para ' + body.query
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

var firstEntityValue = (entities, entity) => {
    var val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

var actions = {
    say(sessionId, context, message, cb) {
        // Find the session
        var recipientId = sessions[sessionId].fbid;
        if (recipientId) {
            // Forward the message
            sendTextMessage(recipientId, message.replace("$name$", sessions[sessionId].name));
        } else {
            console.log('Oops! Couldn\'t find user for session:', sessionId);
        }
        cb();

    },
    merge(sessionId, context, entities, message, cb) {
        var q = firstEntityValue(entities, 'search_query');
        if (q) {
            context.q = q;
        }
        cb(context);
    },
    search(sessionId, context, cb) {
        var recipientId = sessions[sessionId].fbid;
        searchClient.search(recipientId, context.q, handleClientResponse);
        cb(context);
    },
    error(sessionId, context, error) {
        console.log(error.message);
    }
};

var wit = new Wit(wit_token, actions)

var fb_token = "EAAD1W15TivwBAJQeP0mdn2QNmi4HVlJ42bO1jDDNZBzAQqItXPmprRzZBVGbnIc2hrugPnFtnShzZAORlKzZCLQOWqZBnkHlC1zhtm1aXcufIGFaUZCZAD1LHnwtLHDqzDPuUmP1ZCgOUigpuYAH6TrWnE0V9yUfAuHU86VBogxYGwZDZD"