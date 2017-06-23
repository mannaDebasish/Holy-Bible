//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express();


var mongoose = require('mongoose');
mongoose.connect('mongodb://sourav_dutta:delgence55@ds159371.mlab.com:59371/project_management');

var db = mongoose.connection;

db.once('open', function() {
    console.log('MongoDB Successfully Connected!!');
});

app.use(express.static(__dirname + '/views'));


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
