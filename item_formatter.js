var _ = require("lodash");
var util = require('util');

var formatItems = function(results){
	return _.map(results, function(it){
		//console.log(util.inspect(it))
		return {
			title: it.title,
			subtitle: '$' + it.price + '\b testeo \b testeo2',
			image_url: _.replace(it.thumbnail, '-I', '-O'),	
			buttons: [{
				type: 'web_url',
				url: it.permalink,
				title: "Ver en MercadoLibre"
			}]
		}
	})
}

module.exports = {
	formatItems: formatItems
}