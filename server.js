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
  user_id: 0,
  resave: false,
  saveUninitialized: false
}));


// Middleware to check if user is logged in
function checkAuth(req, res, next) {
  if(req.path == '/login') {  // ignore if on login page
    next();
  } else if(!req.session.authenticated) { // user is not authenticated, redirect to login
    res.send('Not logged in yet.');
    res.redirect('/login');
  } else {
    next();   // user is authenticated, allow page to render
  }
}


// Middleware to check if user is admin
function checkAdmin(req, res, next) {
  if(!req.session.authenticated) { // user is not authenticated, redirect to login
    res.send('Not logged in yet.');
  } else if (req.session.user_type != 'admin') {
    res.send('You are not authorised.');
  } else {
    next();   // user is authenticated, allow page to render
  }
}


app.get('/login', function(req, res, next) {
  var context = {};
  context.test = "Hello World!";
  res.render('login', context);
});


app.post('/login', function(req, res, next) {
  mysql.pool.query(
    'SELECT u.id FROM `user` u WHERE u.username = ? AND u.password = ?',    // Match username/password in form to `user`
    [req.body.username, req.body.password], function(err, results, fields) {
    if(err) {
      console.log(err);
      next(err);
      return;
    } else {
      req.session.authenticated = true;
      req.session.user_id = results;
    }
  });
});


// Render createuser page for admin
app.get('/admin/createuser', checkAdmin, function(req, res, next) {
  var context = {};
  context.test = "Hello World!";
  res.render('createuser', context);
});


// Submit form and add user to database
app.post('/admin/createuser', checkAdmin, function(req, res, next) {
  mysql.pool.query(
    'INSERT INTO `user` (username, password, register_date, user_type) VALUES (?, ?, NOW(), ?)',
    [req.body.username, req.body.password, req.body.user_type],
    function(err, results, fields) {
    if(err) {
      next(err);
      return;
    } else {
      res.redirect('/admin/createuser');
    } 
  });
})

/*********** home page **********/
app.get('/', function (req, res) {
    var context = {};
   context.text = "This is home page!";
    res.render('home', context);
});

/*********** dashboard page including the link of selected courses **********/

//return html page for dashboard

//example : enter http://localhost:3000/dashboard?student_id=1 to get the course overview for student id 1.
app.get('/dashboard', function (req, res) {
  var context = {};
  getDashboardByStudentId(req.query.student_id, 
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
  getDashboardByStudentId(req.query.student_id, 
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

  mysql.pool.query("SELECT course.name FROM course " +
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


  

/*********** lecture page to display all lectures for selected course that user takes**********/

//return html page of lecture for selected course

//example : enter http://localhost:3000/lectures?course_id=1&student_id=1 to get the lecture overview for student id 1.
app.get('/lectures', function (req, res) {
  var context = {};
  getAllLecturesForCourse(req.query.course_id, req.query.student_id, 
    function(lectureList) {
      context.lectureList = lectureList;
      res.render('lecture', context);
    },
    function(error) {
      context.errorMessage = JSON.stringify(error);
      res.render('500', context);
    }
  );
  
  getAllAssignmentsForCourse(req.query.course_id, req.query.student_id, 
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

//get Lectures API
app.get('/getLectures', function(req, res, next){
  getAllLecturesForCourse(req.query.course_id, req.query.student_id, 
  function(lectureList) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(lectureList));
  },
  function(error) {
    res.send(JSON.stringify(error));
  }
);
});


var getAllLecturesForCourse = function(courseId, studentId, success, failure) {
  if (!courseId || !studentId) {
    var errorMessage = "course Id or student Id is invalid";
    console.log(errorMessage);
    failure(errorMessage);
    return;
  }

  mysql.pool.query("SELECT lecture.title, lecture.body FROM lecture " + 
                  "INNER JOIN course ON lecture.course_id = course.course_id " + 
                  "INNER JOIN student_course ON course.course_id = student_course.c_id " +
                  "WHERE course.course_id = ? AND student_course.s_id = ?", [courseId, studentId], function (error, result) {
    if (error) {
      console.log("Failed to get lecture of course " + courseId, "for student ID " + studentId);
      failure(error);
    } else {
      console.log("Get lecture for user : " + JSON.stringify(result));
      success(result);
    }
});
};



/*********** assignments page to display all assignments for selected course that user take **********/

//return html page of assignments for selected course
//example : enter http://localhost:3000/assignments?course_id=1&student_id=1 to get the assignment for user(student_id=1).

app.get('/assignments', function (req, res) {
  var context = {};
  getAllAssignmentsForCourse(req.query.course_id, req.query.student_id, 
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

//get Lectures API
app.get('/getAssignments', function(req, res, next){
  getAllAssignmentsForCourse(req.query.course_id, req.query.student_id, 
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


app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});


app.listen(app.get('port'), function() {
  console.log('Express started on port:' + app.get('port') + '; press Ctrl-C to terminate.');
});
