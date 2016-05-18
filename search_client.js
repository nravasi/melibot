var request = require('request');
var util = require('util');

var LIMIT = 5;

var search = function (sender, text, callback){
    request({
        url: 'https://api.mercadolibre.com/sites/MLA/search',
        qs: {
        	q:text,
        	offset: 0,
        	limit: LIMIT
        },
        method: 'GET'
    },  function(error, response, body){
    	if(error){
    		return callback(sender, error);
    	}
    	//console.log("La response es" + util.inspect(response, false, null));

    	return callback(sender, undefined, JSON.parse(body));
    });
}

module.exports = {
	search: search
}