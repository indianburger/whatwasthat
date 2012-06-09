var express = require('express');
var app = express.createServer();
var fs = require('fs');

app.configure(function(){
	app.use(express.bodyParser({uploadDir:'./uploads'}));
  // disable layout
  app.set("view options", {layout: false});

  // make a custom html template
  app.register('.html', {
    compile: function(str, options){
      return function(locals){
        return str;
      };
    }
  });

	app.use(express['static'](__dirname + '/../www'));
	app.use(express['static'](__dirname + '/../uploads'));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
});

app.get('/', function(req, res){
	res.render(__dirname + '/../www/index.html');
});


app.post('/file-upload', function(req, res) {
  var tmp_path = req.files.file.path;
  var target_path = './uploads/' + req.files.file.name;
  console.info('Processing file upload. Copying %s to %s', tmp_path, target_path);
  // move the file from the temporary location to the intended location
  fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
      fs.unlink(tmp_path, function() {
          if (err) throw err;
          res.send(req.files.file.name);
      });
  });
});

app.post('/submitPhotoToDetect', function(req, res) {
  var Magician = require('magician');
  var UPLOADS_DIR = __dirname + "/../uploads/";
  console.log("Processing file:" + UPLOADS_DIR + req.body.path);
  var img = new Magician(UPLOADS_DIR + req.body.path, 
    UPLOADS_DIR + "cropped-" + req.body.path);
  img.crop({
    x:        parseInt(req.body.x, 10),
    y:        parseInt(req.body.y, 10),
    width:    parseInt(req.body.width, 10 ),
    height:   parseInt(req.body.height, 10)
  }, function(err) {
    if (err) {
      throw err;
    }
    console.log("crop success: cropped-" + req.body.path);
  });
  
});

app.listen(3000);

console.log("Server running in port 3000");