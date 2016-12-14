const gcmKey = "AIzaSyCrgV1mCcXYuFAv_6k7UVO3CsyXXqTVM8Y";
const webPush = require("web-push");

webPush.setGCMAPIKey(gcmKey);

module.exports = webPush;
webPush.sendNotification(endpoint,
    {
        TTL: req.body.ttl,
        payload: req.body.payload,
        userPublicKey: req.body.key,
        userAuth: req.body.authSecret
    })
    .then(wat => {
        console.log(wat);
    });
