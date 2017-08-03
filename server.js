var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var crypto = require('crypto');
var jsonfile = require('jsonfile');
var app = express();
mongoose.Promise = global.Promise;
var bodyParser = require('body-parser');
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));


app.get('/bibleimage/:name', function (req, res, next) {

  var options = {
    root: __dirname + '/bible img/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = req.params.name;
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      //console.log('Sent:', fileName);
    }
  });

});



var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

/*------------------------ Connect Mongoose ----------------*/
mongoose.connect('mongodb://debasish:bible@ds151232.mlab.com:51232/bible');

var db = mongoose.connection;

db.once('open', function() {
  console.log('MongoDB Successfully Connected!!');
});

var filepath = 'bible/books/';


/*================== User schema ==============*/

var personSchema = mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  contact_number : {
    type: String,
    required: true
  },
  book:[{
    bible_name:{type: String},
    chapter_name:{type: String}
  }],
  hash: String,
  salt: String
});

personSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

personSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
};

var Person = mongoose.model("Users", personSchema);



/*----------------------------------- Webservices -------------------------------*/

app.post('/register', function(req,res){

  console.log(req.body);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.set("Content-Type",'application/text');

  var newPerson = new Person({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    contact_number : req.body.contact_number,
    book:[]
  });
  var cryptPass = newPerson.setPassword(req.body.password);
  newPerson.save(function(err, Person){
    if(err)
      res.status(500).send();
    else
      res.send(Person);
      res.status(200).send();
    console.log('User Successfully Registered!');
  });

});

app.post('/login', function(req,res){
  console.log(req.body);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.set("Content-Type",'application/text');
  Person.findOne({email: req.body.email}, function(err, Person){
    if(err)
      res.status(500).send();
    else
    if(Person == null){
      console.log('not found');
      res.status(404).send();
    }
    else{

      if (!Person.validPassword(req.body.password)) {
        console.log('wrong pass');
      }
      else{
        console.log(Person);
        res.send(Person);
        console.log('Logged In!');
      }
    }
  })
});

app.post('/updatebook', function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.set("Content-Type",'application/text');
  var flag = 0;


 /* Person.findOneAndUpdate({'_id':req.body._id}, {$push:{ book: req.body.book }}, function(err, Person){
    if(err)
      res.status(500).send();
    if(Person){
      console.log(Person);
      res.status(200).send(req.body.book);
    }
  });*/

  Person.findOne({'_id':req.body._id,}, function(err, Person1){
    if(err)
      res.status(500).send();
    else{
      //console.log(Person.book);
      for(var i = 0; i<Person1.book.length; i++){
        if(Person1.book[i].bible_name == req.body.book.bible_name){
          var chapter = Person1.book[i].chapter_name;
          flag = 1;
          res.status(200).send(chapter);
          console.log("found you");
          break;
        }
      }
      if(flag == 0){
        console.log("found you here");
        Person.findOneAndUpdate({'_id':req.body._id}, {$push:{ book: req.body.book }}, function(err, person){
          if(err)
            res.status(500).send();
          if(person){
            console.log(person);
            res.status(200).send(1);
          }
        });
      }
    }
  });


  /**/
});




app.get('/getbiblelist', function(req, res){

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.set("Content-Type",'application/json');

  jsonfile.readFile('bible/booklist/bookname.json', function(err, obj) {
    //console.log(obj);
    res.send(obj);
  });
});


app.get('/bible/:bookName', function(req, res){

  	res.setHeader("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.set("Content-Type",'application/json');

  var bookname = req.params.bookName;
  console.log(bookname);
  var bookpath = filepath + bookname +'.json';
	jsonfile.readFile(bookpath, function(err, obj) {
    //console.log(obj);
    res.send(obj);
  });

});


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
