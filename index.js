var admin = require('firebase-admin');
var request = require('request');
var authorization = require('./authorization.js');

admin.initializeApp({
    credential: admin.credential.cert("service-account-key.json"),
    databaseURL: "https://menlo-ea5c9.firebaseio.com"
});

var db = admin.database();

var postsRef = db.ref("/posts").limitToLast(10);
postsRef.once("value", function(snapshot, prevChildKey) {
    var posts = snapshot.val();
    var keys = Object.keys(posts);
    var numberOfNotifications = 0;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var post = posts[key];
        if (!post.notification) {
            numberOfNotifications++;
        }
    }
    if (numberOfNotifications == 0) {
        process.exit();
    }
    var numberOfNotificationsSent = 0;
    console.log("Notifications to Send:", numberOfNotifications);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var post = posts[key];
        if (!post.notification) {
            console.log(post);

            var notificationBody = {
                "to": "/topics/" + post.topic,
                "data": {
                    "message": post.title
                },
                "priority": "high",
                "notification": {
                    "body": post.title
                }
            };

            var options = {
                'url': 'https://fcm.googleapis.com/fcm/send',
                'method': 'POST',
                'headers': {
                    'Authorization': authorization.key,
                    'Content-Type': 'application/json'
                },
                'body': notificationBody,
                'json': true
            };
            request(options, function(error, response, body) {
                numberOfNotificationsSent++;
                if (error) {
                    console.error("Error:", error);
                } else {
                    console.log("Success:", body);
                    var notificationRef = db.ref("/posts/" +
                        key + '/notification');
                    notificationRef.set(true);
                }
                if (numberOfNotificationsSent ==
                    numberOfNotifications) {
                    process.exit();
                }
            })
        }
    }
})
