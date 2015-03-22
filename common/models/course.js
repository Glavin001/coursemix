var CourseDownloader = require('../uniapi/course_downloader');
var watson = require('watson-developer-cloud');
var TradeoffAnalytics = watson.tradeoff_analytics;

var credentials = {
    "version": "v1",
    "url": "https://gateway.watsonplatform.net/tradeoff-analytics-beta/api",
    "username": "a174c4b0-a409-429b-b435-43c5243beb7c",
    "password": "XYCOl9iWSr5o"
};
var tradeoffAnalytics = new TradeoffAnalytics(credentials);

module.exports = function(Course) {

    // Course.getName = function(shopId, cb) {
    //     CoffeeShop.findById(shopId, function(err, instance) {
    //         response = "Name of coffee shop is " + instance.name;
    //         cb(null, response);
    //         console.log(response);
    //     });
    // }
    //
    // Course.remoteMethod(
    //     'getName', {
    //         http: {
    //             path: '/getname',
    //             verb: 'get'
    //         },
    //         accepts: {
    //             arg: 'id',
    //             type: 'number',
    //             http: {
    //                 source: 'query'
    //             }
    //         },
    //         returns: {
    //             arg: 'name',
    //             type: 'string'
    //         }
    //     }
    // );

    // Updating Courses from Banner

    Course.status = function(cb) {
        return cb(null, {
            "message": this.progressMessage
        });
    }


    // Course.count: function(req, res) {
    //     Courses.count(function(err, result) {
    //         return res.json({
    //             "value": result
    //         });
    //     });
    // },

    Course.updateTerm = function(term, cb) {
        console.log('updateTerm:', term);
        var downloader = new CourseDownloader();

        var dataSource = Course.getDataSource();
        var connector = dataSource.connector;
        var collection = connector.collection('course');

        downloader.downloadTerm(term, function(err, allCourses) {

            if (err) {
                return cb(err, allCourses);
            }

            downloader.updateCourses(collection, allCourses,
                function(err) {
                    console.log(
                        "Done loading courses",
                        err);

                    return cb(err, allCourses);

                });
        });

    };

    Course.remoteMethod(
        'updateTerm', {
            http: {
                path: '/update-term',
                verb: 'post'
            },
            accepts: {
                arg: 'term-id',
                type: 'number',
                http: {
                    source: 'query'
                }
            },
            returns: {
                arg: 'courses',
                type: 'array'
            }
        }
    );

    Course.terms = function(cb) {

        var s = new selfService();
        s.getTerms(function(error, response, terms) {
            cb(error, terms);
        });

    };

    Course.remoteMethod(
        'terms', {
            http: {
                path: '/terms',
                verb: 'get'
            },
            returns: {
                arg: 'terms',
                type: 'array'
            }
        }
    );

    Course.dilemmas = function(body, cb) {
        // console.log(body);

        tradeoffAnalytics.dilemmas(body, function(err, dilemmas) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, dilemmas);
            }
        });

    };

    Course.remoteMethod(
        'dilemmas', {
            http: {
                path: '/dilemmas',
                verb: 'post'
            },
            accepts: {
                arg: 'data',
                type: 'object',
                http: {
                    source: 'body'
                }
            },
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Course.subjects = function(cb) {

        var dataSource = Course.getDataSource();
        var connector = dataSource.connector;
        var collection = connector.collection('course');

        collection.aggregate({
            "$group": {
                "_id": "subjects",
                "list": {
                    "$addToSet": "$subject_id"
                }
            }
        }, function(err, results) {
            return cb(err, results[0].list);
        });
    };


    Course.remoteMethod(
        'subjects', {
            http: {
                path: '/subjects',
                verb: 'get'
            },
            returns: {
                root: true,
                type: 'array'
            }
        }
    );

};