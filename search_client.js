var request = require('request');
var util = require('util');

var search = function (event, callback){
    request({
        url: 'https://api.mercadolibre.com/sites/MLA/search',
        qs: {
        	q:event.message.text,
        	offset: 0,
        	limit: 10
        },
        method: 'GET'
    },  function(error, response, body){
    	if(error){
    		return callback(event, error);
    	}
    	console.log("La response es" + util.inspect(response, false, null));

    	return callback(event, undefined, body);
    });
}

module.exports = {
	search: search
}