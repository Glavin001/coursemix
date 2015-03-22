var CourseDownloader = require('../uniapi/course_downloader');

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

    Course.subjects = function(req, res) {
        sails.models.courses.native(function(err, collection) {

            collection.aggregate({
                "$group": {
                    "_id": "subjects",
                    "total": {
                        "$addToSet": "$Subj_code"
                    }
                }
            }, function(err, results) {

                return res.json(results[0].total);

            });

        });
    };

};