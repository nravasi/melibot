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


function getUserInfo(sender, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/' + sender,
        qs: {
            fields: 'first_name',
            access_token: process.env.FB_TOKEN
        },
        method: 'GET'
    }, function(error, response, body) {
        if (error) {
            console.log('Error getting info: ', error)
        }

        return callback(JSON.parse(body).first_name);
    });
}

var sendTextMessage = function(senderId, text) {
    sendMessage(senderId, {
        text: text
    })
}

var sendResults = function(senderId, err, body) {
    if (err) {
        sendTextMessage(senderId, 'Hubo un error');
    } else {
        if (!body.results || !body.results.length) {
            return sendTextMessage(senderId, 'Lo siento! No encontré resultados para ' + body.query);
        }
        var elements = formatItems(body.results, body.query)

        sendTextMessage(senderId, 'Encontré estas publicaciones para ' + body.query)

        // elements.push({
        //     'title': 'Ver más resultados',
        //     'subtitle':'alalalla',
        //     'image_url': 'http://static.mlstatic.com/org-img/homesnw/mercado-libre.png',
        //     'item_url': 'listado.mercadolibre.com.ar/' + body.query
        // })

        // sendMessage(senderId, {
        //     'attachment': {
        //         'type': 'template',
        //         'payload': {
        //             'template_type': 'button',
        //             'text': 'Resultados para ' + body.query,
        //             'buttons': [{
        //                 'type': 'web_url',
        //                 'title': 'Ver más resultados',
        //                 'url': 'listado.mercadolibre.com.ar/' + body.query
        //             }]
        //         }
        //     }
        // });

        return sendMessage(senderId, {
            'attachment': {
                'type': 'template',
                'payload': {
                    'template_type': 'generic',
                    'elements': elements
                }
            }
        });

    }
}

function formatItems(results, q) {
    return _.map(results, function(it) {
        return {
            title: '$ ' + it.price,
            subtitle: it.title,
            image_url: _.replace(it.thumbnail, '-I', '-O'),
            item_url: it.permalink,
            'buttons': [{
                        'type': 'web_url',
                        'title': 'Ver más resultados',
                        'url': 'listado.mercadolibre.com.ar/' + q
                    }]
        }
    })
}

module.exports = {
    sendTextMessage: sendTextMessage,
    sendResults: sendResults,
    getUserInfo: getUserInfo
}