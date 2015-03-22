var SelfService = require("self-service-banner");
var async = require('async');
var _ = require('lodash');

var CourseDownloader = module.exports = (function() {

    function CourseDownloader() {

        return this;
    }

    CourseDownloader.prototype.downloadTerm = function(term, cb) {
        var self = this;
        console.log('term:', term);

        if (!term) {
            return cb(new Error("Please provide a `term`."));
        }

        try {

            // Create SelfService connection
            var banner = new SelfService();

            // Load courses into database
            self._downloadTerm(term, banner, function(err,
                allCourses) {
                if (err) {
                    throw err;
                }

                console.log("# of Courses: " +
                    allCourses.length);

                cb(err, allCourses);

            });

        } catch (e) {
            return cb(e, null);
        }

    };


    CourseDownloader.prototype.timeFromStr = function(str) {
        // Catch errors
        // It could be "TBA"
        try {
            // Ex: "4:00 pm"
            var hours = 0;
            var minutes = 0;
            var s = str.split(':');
            hours = parseInt(s[0]);
            minutes = parseInt(s[1]);
            // Check if 'pm'
            if (s[1].indexOf("pm") != -1 && hours != 12) {
                hours += 12;
            }
            return {
                'hours': hours,
                'minutes': minutes
            };
            // return (hours * 100)+minutes;
        } catch (e) {
            return null;
        }
    };

    CourseDownloader.prototype.normalizeCourse = function(row) {
        // term
        // row.term = row.term;

        // CRN
        // row.crn = row.crn;

        // subject
        row.subject_id = row.subject;
        delete row.subject;

        // course
        row.course_id = parseInt(row.courseNumb);
        delete row.courseNumb;
        row.section = row.seqNumb;
        delete row.seqNumb;

        // title
        // row.title = row.title;
        // delete row.title;

        // cross listed

        // linked(labs)

        // start date
        row.start_date = new Date(row.startDate);
        delete row.startDate;

        // end date
        row.end_date = new Date(row.endDate);
        delete row.endDate;

        // start time
        row.begin_time = this.timeFromStr(row.time.start);
        delete row.time.start;

        // end time
        row.end_time = this.timeFromStr(row.time.end);
        delete row.time.end;
        delete row.time;

        // days
        var d = row.days;
        var dayMap = {
            "M": "on_monday",
            "T": "on_tuesday",
            "W": "on_wednesday",
            "R": "on_thursday",
            "F": "on_friday",
            "S": "on_saturday",
            "U": "on_sunday"
        }
        _.forOwn(dayMap, function(v, key) {
            if (_.contains(d, key)) { // Check for day
                row[v] = true;
            } else {
                row[v] = false;
            }
        });
        delete row.days;

        // building
        var r = /(.*)\s?([0-9]*).*/;
        var loc = row.location;
        var ls = loc.match(r);
        row.Bldg_code = ls[1];
        delete row.location;
        // room
        row.room_code = ls[2];

        // faculty
        row.instructor = row.instructors;
        delete row.instructors;

        // Return
        return row;
    };

    // Download courses for term
    CourseDownloader.prototype._downloadTerm = function(termv, banner,
        callback) {
        var self = this;

        // Get Subjects
        banner.getSubjects({
            p_term: termv
        }, function(error, response, subjects) {
            // console.log(subjects);

            var len = subjects.length;
            // var bar = new ProgressBar(
            //     '[:bar] Downloading Subjects', {
            //         total: len,
            //         stream: self.progressMessage
            //     });

            var taskFun = function(subject,
                termv) {
                var subjectv = subject.value;
                // Create task
                var task = function(
                    callback) {
                    // Update download message
                    // Get Courses Schedule
                    banner.getCoursesSchedule({
                        'term_in': termv,
                        'sel_subj': subjectv
                    }, function(
                        error,
                        response,
                        courses
                    ) {
                        console.log(
                            'Loaded ' +
                            courses
                            .length +
                            ' course schedules for subject ' +
                            subjectv +
                            '.'
                        );
                        callback
                            (
                                null,
                                courses
                            );
                    });
                };
                tasks.push(task);
            };

            var tasks = [];
            for (var s = 0; s < len; s++) {
                var subj = subjects[s];
                // console.log("Selected subject "+subject.title);
                taskFun(subj, termv);
            }

            async.parallel(tasks, function(err,
                results) {

                // Merge courses from all subjects into aggregate list of courses
                var allCourses = _.flatten(
                    results, true);
                console.log(
                    'Loaded ' +
                    allCourses.length +
                    ' courses!');

                // Create row Object with headers
                async.map(allCourses, function(
                    course, callback) {
                    // Check if Cancelled
                    if (course.title ===
                        "*CANCELLED*") {
                        // var e = new Error(
                        //     "Course has been cancelled"
                        // );
                        // sails.log.error(e);
                        return callback(
                            null, null);
                    }
                    self.normalizeCourse(
                        course);
                    return callback(null,
                        course);
                }, function(err, results) {
                    return callback(err,
                        results);
                });

            });
        });
    };


    CourseDownloader.prototype.updateCourses = function(collection,
        allCourses,
        callback) {
        var self = this;

        console.log("updateCourses: " + allCourses.length);

        // Process Data
        var data = [];

        console.log(allCourses.length);

        async.map(allCourses,
            function(data,
                callback) {
                if (data) {
                    console.log(
                        "Updating course " +
                        data
                        .subject_id +
                        " " +
                        data
                        .course_id
                    );
                    collection
                        .update({
                                'crn': data.crn
                            },
                            data, {
                                upsert: true
                            },
                            function(
                                err
                            ) {
                                if (
                                    err
                                ) {
                                    console.log(
                                        "An error occured: ",
                                        err
                                    );
                                }
                                callback
                                    (
                                        err
                                    );
                            }
                        );
                } else {
                    callback
                        (
                            null
                        );
                }
            },
            function(errors) {
                callback(
                    errors
                );
            }
        );


    };

    return CourseDownloader;

})();