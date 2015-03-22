var mongoUrl = "mongodb://localhost/coursemix";
sendGridUser = "MhG32AG0WA";
sendGridKey = "tuvyJCt6tw";

if (process.env.VCAP_SERVICES) {
    // VCAP_SERVICES contains all the credentials of services bound to
    // this application. For details of its content, please refer to
    // the document or sample of each service.
    var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
    // TODO: Get service credentials and communicate with bluemix services.

    var env = JSON.parse(process.env.VCAP_SERVICES);

    mongoUrl = env['mongodb-2.4'][0].credentials.url;

    sendGridUser = env['sendgrid'][0].credentials.username;
    sendGridKey = env['sendgrid'][0].credentials.password;

}

/**
"mongodb-2.4": [
      {
         "name": "mongodb-fg",
         "label": "mongodb-2.4",
         "plan": "100",
         "credentials": {
            "hostname": "75.126.37.68",
            "host": "75.126.37.68",
            "port": 10033,
            "username": "ee376cef-56e7-4669-a499-a94283e529f6",
            "password": "6d634437-7c8c-453f-8d49-2b22b20b0187",
            "name": "98afd66b-645b-47c4-9a3d-6db2d28a89ea",
            "db": "db",
            "url": "mongodb://ee376cef-56e7-4669-a499-a94283e529f6:6d634437-7c8c-453f-8d49-2b22b20b0187@75.126.37.68:10033/db"
         }
      }
   ]
*/

module.exports = {
    "db": {
        "name": "db",
        "connector": "mongodb",
        "url": mongoUrl
    },
    "sendgrid": {
        "connector": "loopback-connector-sendgrid",
        "api_user": sendGridUser,
        "api_key": sendGridKey
    }
};