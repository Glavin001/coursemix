var credentials = {
    "url": "https://stream.watsonplatform.net/text-to-speech-beta/api",
    "username": "04758c7d-ad9f-4a22-b045-48ab7c10fb3e",
    "password": "9pF0FinHbGHp"
};
var watson = require('watson-developer-cloud');

if (process.env.VCAP_SERVICES) {
    // VCAP_SERVICES contains all the credentials of services bound to
    // this application. For details of its content, please refer to
    // the document or sample of each service.
    var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
    // TODO: Get service credentials and communicate with bluemix services.

    var env = JSON.parse(process.env.VCAP_SERVICES);

    credentials = env['text_to_speech'][0].credentials;

}

// if bluemix credentials exists, then override local
credentials.version = 'v1',
    credentials.headers = {
        'Accept': 'audio/ogg; codecs=opus'
    }

// Create the service wrapper
var textToSpeech = new watson.text_to_speech(credentials);

module.exports = function(server) {
    // Install a `/` route that returns server status
    var router = server.loopback.Router();
    router.get('/', server.loopback.status());

    router.get('/speech/synthesize', function(req, res) {
        console.log('synthesize', req.query);
        var transcript = textToSpeech.synthesize(req.query);

        transcript.on('response', function(response) {
            console.log(response.headers);
            if (req.query.download) {
                response.headers['content-disposition'] =
                    'attachment; filename=transcript.ogg';
            }
        });
        transcript.pipe(res);
    });

    server.use(router);
};