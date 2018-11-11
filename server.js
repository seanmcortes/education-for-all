var express = require('express');
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
app.set('port', 55451);

app.use(express.static('public'));


// test connection, run 'node ./server.js'
mysql.pool.query('SELECT * FROM `user`', function(err, results, fields){
      if(err){
        console.log("Unable to connect to user table/database!");
        return;
      }
      console.log(results);
    })