var _ = require("lodash");
var util = require('util');

var formatItems = function(results){
	return _.map(results, function(it){
		//console.log(util.inspect(it))
		return {
			title: '$' + it.price,
			subtitle: it.title,
			image_url: _.replace(it.thumbnail, '-I', '-O'),	
			item_url: it.permalink
			/*buttons: [{
				type: 'web_url',
				url: it.permalink,
				title: "Ver en MercadoLibre"
			}]*/
		}
	})
}

module.exports = {
	formatItems: formatItems
}