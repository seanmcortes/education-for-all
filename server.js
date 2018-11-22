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

// Display profile page
// app.get('/profile', function(req, res, next) {
//   var context = {};
//   mysql.pool.query(
//     'SELECT ' + req.session.user_type + '_id, first_name, last_name, DOB, identification, user_id FROM ' + req.session.user_type + ' WHERE user_id = ' + req.session.user_id,
//     function (err, results, fields) {
//       if(error){
//         res.write(JSON.stringify(error));
//         res.end();
//       } else {
//       	context.identification = results[0].identification;
//       	res.render('profile', context);
//       }
//   });
// });


/*********** profile page s**********/

//return html page of profile

//example : enter http://localhost:3000/profile to get the lecture overview for student user_id 1 or instructor user_id 4

app.get('/profile', function (req, res) {

  //debug for student ID
  // req.session.user_id = 1; 
  // req.session.user_type = "student";

  //or debug for instructor ID
  // req.session.user_id = 4; 
  // req.session.user_type = "instructor";

  var context = {};
  getProfileForUser(req.session.user_type, req.session.user_id, 
    function(profileResult) {
      context.profileResult = profileResult;
      res.render('profile', context);
    },
    function(error) {
      context.errorMessage = JSON.stringify(error);
      res.render('500', context);
    }
  );
  
});

//get Profile API
app.get('/profile', function(req, res, next){

   //debug  choice 1
  // req.session.user_id = 1; 
  // req.session.user_type = "student";

  //debug  choice 2
  // req.session.user_id = 4; 
  // req.session.user_type = "instructor"; 

  getProfileForUser(req.session.user_type, req.session.user_id,  
    function(profileResult) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(profileResult));
    },
    function(error) {
      res.send(JSON.stringify(error));
    }
  );
});


var getProfileForUser = function(userType, userId, success, failure) {
  if (!userType || !userId) {
    var errorMessage = "user type or user ID is invalid";
    console.log(errorMessage);
    failure(errorMessage);
    return;
  }

  if(userType == "student") {

    mysql.pool.query("SELECT user.user_type, user.user_id, student.first_name, student.last_name, student.DOB, student.identification FROM user " + 
      "INNER JOIN student ON student.user_id = user.user_id " + 
      "WHERE user.user_id = ?", [userId], function (error, result) {
      if (error) {
        console.log("Failed to get profile for user ID " + userId + JSON.stringify(error));
        failure(error);
      } else {
        console.log("Get profile for user : " + JSON.stringify(result));
        success(result);
      }
      });
    }

  else if (userType == "instructor") {

    mysql.pool.query("SELECT user.user_type, user.user_id, instructor.first_name, instructor.last_name, instructor.DOB, instructor.identification FROM user " + 
      "INNER JOIN instructor ON instructor.user_id = user.user_id " +
      "WHERE user.user_id = ?", [userId], function (error, result) {
      if (error) {
        console.log("Failed to get profile for user ID " + userId + JSON.stringify(error));
        failure(error);
      } else {
        console.log("Get profile for user : " + JSON.stringify(result));
        success(result);
      }
    });
  }
};


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
