sessions = {}

var createSession = (fbid) => {
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
            context: {}
        };
    }
    return sessionId;
};

var getSession = (sid) => {
    return sessions[sid];
}


module.exports = {
    createSession: createSession
    getSession: getSession
}