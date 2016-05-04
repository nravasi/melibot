var request = require('request');

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
    	console.log("La response es" + response);
    	console.log("el site es" + response.body.site_id);
    	console.log("La query es" + response.query);
    	return callback(event, undefined, body);
    });
}

module.exports = {
	search: search
}