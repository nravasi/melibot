
var search = function (event, callback){
    request({
        url: 'https://api.mercadolibre.com/sites/MLA/search',
        qs: {q:event.message.text},
        method: 'GET'
    },  function(error, response, body){
    	if(error){
    		return callback(event, error);
    	}
    	console.log(response);
    	return callback(event, undefined, body);
    });
}

module.exports{
	search: search
}