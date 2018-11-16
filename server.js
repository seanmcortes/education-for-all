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
  user_type: '',
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
    'SELECT u.id, u.user_type FROM `user` u WHERE u.username = ? AND u.password = ?',    // Match username/password in form to `user`
    [req.body.username, req.body.password], function(err, results, fields) {
    if(err) {
      console.log(err);
      next(err);
      return;
    } else {
      req.session.authenticated = true;
      req.session.user_id = results.id;
      req.session.user_type = results.user_type;
      res.redirect('/dashboard');
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


// Render dashboard page for students
app.get('/dashboard', checkAuth, function(req, res, next) {
  if (req.session.user_type == "admin"){
    res.redirect('/admin/createuser');
  } else {
    var context = {};
    context.test = "Hello World!";
    res.render('dashboard', context);
  }
});


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