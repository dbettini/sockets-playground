const gcmKey = "AIzaSyCrgV1mCcXYuFAv_6k7UVO3CsyXXqTVM8Y";
const webPush = require("web-push");

webPush.setGCMAPIKey(gcmKey);

module.exports = webPush;

