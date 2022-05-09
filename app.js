// var express = require('express')
// var multer  = require('multer')
// var fs = require('fs');
// // var upload = multer({ dest: 'uploads/images/' })
// var fileImageName;

// var app = express()

// // Set The Storage Engine
// const upload = multer.diskStorage({
//   dest: './uploads/images/',
//   filename: function(req, file, cb){
//     cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });

// app.post('/upload', upload.single("picture"), function (req,res) {
//     fileImageName = req.file.originalname;
//     console.log("Received file" + req.file.originalname);
//     var src = fs.createReadStream(req.file.path);
//     var dest = fs.createWriteStream('uploads/images/' + req.file.originalname);
//     src.pipe(dest);
//     src.on('end', function() {
//     	fs.unlinkSync(req.file.path);
//     	res.json('OK: received ' + req.file.originalname);
//     });
//     src.on('error', function(err) { res.json('Something went wrong!'); });

//   })

// let port = process.env.PORT || 8888;
// app.listen(port, function () {
//     return console.log("Started file upload server on port " + port);
// });