var Wit = require('node-wit').Wit;
var searchClient = require('./search_client')
var responder = require('./responder')
var sessions = require('./sessions');

var useWit = true;

var respondTo = (sessionId, text) => {
	if (useWit) {
		wit.runActions(
			sessionId,
			text,
			sessions.getSession(sessionId).context,
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
					sessions.getSession(sessionId).context = context;
				}
			});
	} else {
		searchClient.search(event.sender.id, event.message.text, responder.sendResults);
	}
}

var actions = {
	say(sessionId, context, message, cb) {
		// Find the session
		var recipientId = sessions.getSession(sessionId).fbid;
		if (recipientId) {
			// Forward the message
			responder.sendTextMessage(recipientId, message);
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

	greeting(sessionId, context, cb) {
		var recipientId = getFBId(sessionId);
		responder.getUserInfo(recipientId, function(fname) {
			var greetingText = "Hola, " + fname + "! Qué estás buscando hoy?"
			responder.sendTextMessage(recipientId, greetingText)
		});

		cb(context);
	},
	search(sessionId, context, cb) {
		searchClient.search(getFBId(sessionId), context.q, responder.sendResults);
		cb(context);
	},
	sell(sessionId, context, cb) {
		responder.sendTextMessage(getFBId(sessionId), 'Podés publicar tu producto aquí: https://vender.mercadolibre.com.ar/sell')
		cb(context)
	},

	site_question(sessionId, context, cb) {
		responder.sendTextMessage(getFBId(sessionId), "Podés encontrar nuestra ayuda en http://ayuda.mercadolibre.com.ar/ayuda")
		cb(context);
	},
	help(sessionId, context, cb) {
		responder.sendTextMessage(getFBId(sessionId), "Puedo ayudarte a encontrar publicaciones, tipea por ejemplo \"buscar celulares\"")
		cb(context);
	},
	error(sessionId, context, error) {
		console.log(error.message);
	}
};

var wit = new Wit(process.env.WIT_TOKEN, actions)

function getFBId(sessionId) {
	return sessions.getSession(sessionId).fbid;
}

function firstEntityValue(entities, entity) {
	var val = entities && entities[entity] &&
		Array.isArray(entities[entity]) &&
		entities[entity].length > 0 &&
		entities[entity][0].value;
	if (!val) {
		return null;
	}
	return typeof val === 'object' ? val.value : val;
};

module.exports = {
	respondTo: respondTo
}