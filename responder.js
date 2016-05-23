var _ = require('lodash')
var request = require('request')
var util = require('util');

function sendMessage(sender, data) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: process.env.FB_TOKEN
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


function getUserInfo(sender) {
    console.log ("ESTOY ACA")
    request({
        url: 'https://graph.facebook.com/v2.6/' + sender,
        qs: {
            fields:'first_name',
            access_token: process.env.FB_TOKEN
        },
        method: 'GET'
    }, function(error, response, body){
      if(error){
        console.log('Error getting info: ', error)
      }
      console.log("La response es " + util.inspect(response, false, null));
      console.log("La body es " + util.inspect(body, false, null));
      console.log("La nombre es " + util.inspect(body.first_name, false, null));
      return JSON.parse(body.first_name);
    });
}

var sendTextMessage = function(senderId, text) {
    sendMessage(senderId, {
        text: text
    })
}

var sendResults = function(senderId, err, body) {
    if (err) {
        sendTextMessage(senderId, "Hubo un error");
    } else {
        if (!body.results || !body.results.length) {
            return sendTextMessage(senderId, "Lo siento! No encontré resultados para " + body.query);
        }
        var elements = formatItems(body.results)

        sendTextMessage(senderId, 'Encontré estas publicaciones para ' + body.query)

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

function formatItems(results){
    return _.map(results, function(it){
        var subtitlePrefix = it.installments.quantity+'x $'+it.installments.amount
        return {
            title: '$ ' + it.price,
            subtitle: it.title,
            image_url: _.replace(it.thumbnail, '-I', '-O'), 
            item_url: it.permalink
        }
    })
}

module.exports = {
    sendTextMessage: sendTextMessage,
    sendResults: sendResults,
    getUserInfo:getUserInfo
}