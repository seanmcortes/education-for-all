var express = require('express');
var session = require('express-session');
var app = express();
var mysql = require('./dbcon.js');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');

const path = require('path');
app.engine('handlebars', handlebars.engine);
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'handlebars');
app.set('port', 3000);

app.use(express.static('public'));


// test connection, run 'node ./server.js'
// mysql.pool.query('SELECT * FROM `user`', function(err, results, fields){
//       if(err){
//         console.log("Unable to connect to user table/database!");
//         return;
//       }
//       console.log(results);
//     })

app.use(session({
  secret: 'group18',
  authenticated: false,
  resave: true,
  saveUninitialized: true
}));


/*
Check if user is logged in and authenticated. Redirect to login screen if not.
*/
function checkAuth(req, res, next) {
  if(!req.session.authenticated) { // user is not authenticated, redirect to login
    res.redirect('/login');
  } else {
    next();   // user is authenticated, allow page to render
  }
}


/*
Check if user is logged in and authenticated as an administrator.
Block page if not.
*/
function checkAdmin(req, res, next) {
  if(!req.session.authenticated) { // user is not authenticated, redirect to login
    res.redirect('/login');
  } else if (req.session.user_type != 'admin') {
    res.send('You are not authorised to view this page.');
  } else {
    next();   // user is authenticated, allow page to render
  }
}

/* 
Check and see if student is enrolled in current course, or instructor teaches current course.
*/
function checkCourseAuth(req, res, next) {
  var authenticated = false;

  if(req.session.user_type == "student") {
    mysql.pool.query(
    'SELECT c.course_id FROM `course` c ' +
    'INNER JOIN `student_course` sc ON sc.c_id = c.course_id ' +
    'INNER JOIN `student` s on s.student_id = sc.s_id ' +
    'WHERE s.user_id = ' + req.session.user_id,
    function(err, results, fields) {
      if(err) {
        res.write(JSON.stringify(err));
        res.end();
      } else {
        rows = JSON.parse(JSON.stringify(results));   
        rows.forEach(function(row) {   // Iterate through results and look for matching student_id with session
          if (row.course_id == req.params.c_id) {
            authenticated = true;
            next();
          }
        });
        if(!authenticated) {
          res.send("You are not authorised to view this page.");
        }
      }
    });
  }
  else if(req.session.user_type == "instructor") {    // Get instructor_id from course and compare to session
    mysql.pool.query(
      'SELECT i.user_id FROM `instructor` i ' +
      'INNER JOIN `course` c ON c.instructor_id = i.instructor_id ' +
      'WHERE c.course_id = ' + req.params.c_id,
      function(err, results, fields) {
        if(err) {
          res.send("Database error.");
          res.end();
        } else {
          row = JSON.parse(JSON.stringify(results));
          if(row[0].user_id != req.session.user_id) {
            res.send("You are not authorised to view this page.");
          } else {
            next();
          }
        }
      })
  }
  else {
    res.send("You are not authorised to view this page.");
  }
}

/*
Verifies that the given lecture param belongs to the given course.
*/
function checkCourseLecture(req, res, next) {
  mysql.pool.query(
    'SELECT course_id FROM `lecture` WHERE lecture_id = ' + req.params.l_id,
    function(err, results, fields) {
      if(err) {
        res.send("Database error!");
        next(err);
      } else {
        results = JSON.parse(JSON.stringify(results));
        if (results[0].course_id == req.params.c_id) {
          next();
        } else {
          res.send("This page does not exist.");
        }
      }
    });
}

/*********** login GET route **********/
app.get('/login', function(req, res, next) {
  var context = {};
  res.render('login', context);
});

/*********** login POST route **********/
// Query database for matching username/password pairiing. Error if no matching pair is found.
app.post('/login', function(req, res, next) {
  mysql.pool.query(
    'SELECT u.user_id, u.user_type FROM `user` u WHERE u.username = ? AND u.password = ?',    // Match username/password in form to `user`
    [req.body.username, req.body.password], function(err, results, fields) {
    if(err) {
      console.log(err);
      next(err);
      return;
    } else {
      if (!results.length) {
        console.log("Incorrect username/password");
        res.redirect('/login')
      } else {
        req.session.authenticated = true;
        req.session.user_id = results[0].user_id;
        req.session.user_type = results[0].user_type;
        console.log(results);
        res.redirect('/dashboard');
      }
    }
  });
});


/*********** create user GET route **********/
app.get('/admin/createuser', checkAdmin, function(req, res, next) {
  var context = {};
  res.render('createuser', context);
});


/*********** create user POST route **********/
// Submit form and add user to database. Must be logged in as admin.
app.post('/admin/createuser', checkAdmin, function(req, res, next) {
  var user_type = req.body.user_type;
  mysql.pool.query(
    'INSERT INTO `user` (username, password, register_date, user_type) VALUES (?, ?, NOW(), ?)',
    [req.body.username, req.body.password, req.body.user_type],
    function (err, results, fields) {
    if(err) {
      next(err);
      return;
    } else {
      var new_id = results.insertId;
      mysql.pool.query(
        'INSERT INTO `' + user_type + '` (last_name, first_name, DOB, identification, user_id) VALUES (?, ?, ?, ?, ' + new_id + ')',
        [req.body.last_name, req.body.first_name, req.body.DOB, req.body.identification],
        function (err, results, fields) {
          if(err) {
            next(err);
            return;
          } else {
            console.log("User creation success!");
            res.redirect('/admin/createuser');
          }
        });
    } 
  });
})

/*********** profile page **********/
// Displays last name, first  name, DOB, identification, and user type of currently logged in user.
app.get('/profile', checkAuth, function(req, res, next) {
  var context = {};
  mysql.pool.query(
    'SELECT ' + req.session.user_type + '_id, last_name, first_name, DOB, identification, user_id FROM ' + req.session.user_type + ' WHERE user_id = ' + req.session.user_id,
    function (err, results, fields) {
      if(err){
        res.write(JSON.stringify(error));
        res.end();
      } else {
        context.last_name = results[0].last_name;
        context.first_name = results[0].first_name;
        context.DOB = results[0].DOB;
        context.identifiction = results[0].identification;
        context.user_type = req.session.user_type;
        console.log(context);
        res.render('profile', context);
      }
  });
});

/*********** home page **********/
app.get('/', function (req, res) {
    var context = {};
   context.text = "This is home page!";
    res.render('home', context);
});

/*********** dashboard page including the link of selected courses **********/

//return html page for dashboard

//example : enter http://localhost:3000/dashboard to get the course overview for student id 1.
app.get('/dashboard', function (req, res) {

  //debug, the function works.
  // req.session.user_id = 1; 

  var context = {};
  getDashboardByStudentId(req.session.user_id, 
    function(courseLink) {
      context.courseLink = courseLink;
      res.render('dashboard', context);
    },
    function(error) {
      context.errorMessage = JSON.stringify(error);
      res.render('500', context);
    }
  );
});

//get dashboard API
app.get('/getDashboard', function(req, res, next){

  //debug 
  // req.session.user_id = 1; 


  getDashboardByStudentId(req.session.user_id,
  function(courseLink) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(courseLink));
  },
  function(error) {
    res.send(JSON.stringify(error));
  }
);
});

var getDashboardByStudentId = function(studentId, success, failure) {
  if (!studentId) {
    var errorMessage = "studentId is invalid";
    console.log(errorMessage);
    failure(errorMessage);
    return;
  }

  mysql.pool.query("SELECT course.name, course.course_id FROM course " +
                    "INNER JOIN student_course ON student_course.c_id = course.course_id " +
                    "INNER JOIN student ON student.student_id = student_course.s_id " + 
                    "WHERE student.student_id = ?", [studentId], function (error, result) {
      if (error) {
        console.log("Failed to get course links for student : " + studentId);
        failure(error);
      } else {
        console.log("Get courses link for user : " + JSON.stringify(result));
        success(result);
      }
  });
};

/*********** coursesOverview page to display Course overview that user takes**********/

//return html page for course overview


app.get('/course/:c_id', checkCourseAuth, function (req, res) {
  var context = {
    course_id: req.params.c_id
  };

  mysql.pool.query(
    "SELECT l.lecture_id, l.title FROM `course` c " +
      "INNER JOIN `lecture` l ON l.course_id = c.course_id " +
      "WHERE c.course_id = " + req.params.c_id, 
      function(err, results, fields) {
      if(err){
        res.write(JSON.stringify(err));
        res.end();
      } else {
        context.lecture = results;

        mysql.pool.query(
          "SELECT a.assignment_id, a.title FROM `course` c " +
            "INNER JOIN `assignment` a ON a.course_id = c.course_id " +
            "WHERE c.course_id = " + req.params.c_id,
            function(err, results, fields) {
              if(err) {
                res.write(JSON.stringify(err));
                res.end();
              } else {
                context.assignment = results;
                console.log(context);
                res.render('course', context);
              }
            });
      }
  });
});

/*********** lecture page to display all lectures for selected course that user takes**********/

//return html page of lecture for selected course

//example : enter http://localhost:3000/lectures?course_id=1 to get the lecture overview for student id 1.


// app.get('/lectures', function (req, res) {
app.get('/course/:c_id/lecture/:l_id', checkCourseAuth, checkCourseLecture, function (req, res) {

  //debug 
  // req.session.user_id = 1; 

  var context = {};
  getAllLecturesForCourse(req.params.c_id, req.params.l_id, 
    function(lectureList) {
      context = lectureList[0];
      console.log(context);
      res.render('lecture', context);
    },
    function(error) {
      context.errorMessage = JSON.stringify(error);
      res.render('500', context);
    }
  );
});

//get Lectures API
app.get('/getLectures', function(req, res, next){

  //debug 
  // req.session.user_id = 1; 

  getAllLecturesForCourse(req.query.course_id, req.session.user_id,  
    function(lectureList) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(lectureList));
    },
    function(error) {
      res.send(JSON.stringify(error));
    }
  );
});


var getAllLecturesForCourse = function(courseId, lectureId, success, failure) {
  if (!courseId || !lectureId) {
    var errorMessage = "course Id or student Id is invalid";
    console.log(errorMessage);
    failure(errorMessage);
    return;
  }

  mysql.pool.query("SELECT lecture.title, lecture.body FROM lecture " + 
                  "WHERE lecture.course_id = ? AND lecture.lecture_id = ?", [courseId, lectureId], function (error, result) {
    if (error) {
      console.log("Failed to get lecture of course " + courseId, "for lecture ID " + lectureId);
      failure(error);
    } else {
      console.log("Get lecture for user : " + JSON.stringify(result));
      success(JSON.parse(JSON.stringify(result)));
    }
  });
};



/*********** assignments page to display all assignments for selected course that user take **********/

//return html page of assignments for selected course
//example : enter http://localhost:3000/assignments?course_id=1 to get the assignment for user(student_id=1).

app.get('/assignments', function (req, res) {

  //debug 
  // req.session.user_id = 1; 

  var context = {};
  getAllAssignmentsForCourse(req.query.course_id, req.session.user_id, 
    function(assignmentList) {
      context.assignmentList = assignmentList;
      res.render('assignment', context);
    },
    function(error) {
      context.errorMessage = JSON.stringify(error);
      res.render('500', context);
    }
  );
});

//get assignment API
app.get('/getAssignments', function(req, res, next){

  //debug 
  // req.session.user_id = 1; 

  getAllAssignmentsForCourse(req.query.course_id, req.session.user_id,  
  function(assignmentList) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(assignmentList));
  },
  function(error) {
    res.send(JSON.stringify(error));
  }
);
});


var getAllAssignmentsForCourse = function(courseId, studentId, success, failure) {
  if (!courseId || !studentId) {
    var errorMessage = "courseId or studentId is invalid";
    console.log(errorMessage);
    failure(errorMessage);
    return;
  }

  mysql.pool.query("SELECT assignment.title, assignment.questions FROM assignment " + 
                  "INNER JOIN course ON assignment.course_id = course.course_id " + 
                  "INNER JOIN student_course ON course.course_id = student_course.c_id " +
                  "WHERE course.course_id = ? AND student_course.s_id = ?", [courseId, studentId], function (error, result) {
    if (error) {
      console.log("Failed to get assignments of course " + courseId, "for student " + studentId);
      failure(error);
    } else {
      console.log("Get assignment for user " + JSON.stringify(result));
      success(result);
    }
  });
};


// Route to Education Plans. Not implemented
app.get('/educationplan', function (req, res) {
  var context = {};
  res.send("Page under construction.")
});


// Route to Education Progress. Not implemented
app.get('/educationprogress', function (req, res) {
  var context = {};
  res.send("Page under construction.")
});

/*********** logout **********/
app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
})

app.use(function(req,res) {
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function() {
  console.log('Express started on port:' + app.get('port') + '; press Ctrl-C to terminate.');
});