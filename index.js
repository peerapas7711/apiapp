'use strict';

require('dotenv').config();
const Knex = require('knex');
const crypto = require('crypto');
var multer = require('multer');
const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const HttpStatus = require('http-status-codes');
const fse = require('fs-extra');
const jwt = require('./jwt');
const model = require('./model');
const { json } = require('body-parser');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const uploadDir = process.env.UPLOAD_DIR || './uploaded';

fse.ensureDirSync(uploadDir);

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir)
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname)
//   }
// })

// var upload = multer({ storage: storage });

// var upload = multer({ dest: process.env.UPLOAD_DIR || './uploaded' });

var db = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: +process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    insecureAuth: true
  }
});

let checkAuth = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else {
    token = req.body.token;
  }

  jwt.verify(token)
    .then((decoded) => {
      req.decoded = decoded;
      next();
    }, err => {
      return res.send({
        ok: false,
        error: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED),
        code: HttpStatus.UNAUTHORIZED
      });
    });
}

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//get 
// app.get('/', (req, res) => res.send({ ok: true, message: 'Welcome to my api serve!', code: HttpStatus.OK }));
// app.post('/upload', upload.single('file'), (req, res) => {
//   console.log(req.body);
//   console.log(req.file);
//   res.send({ ok: true, message: 'File uploaded!', code: HttpStatus.OK });
// });


//*TODO ล้อกอินยูเซ้อ------------------------------------------------------------------------------------
app.post('/login', async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  if (username && password) {
    //var encPassword = crypto.createHash('md5').update(password).digest('hex');

    try {
      var rs = await model.doLogin(db, username, password);
      if (rs.length) {
        var token = jwt.sign({ username: username });
        res.send({ ok: true, token: token, id: rs[0].u_id });
      } else {
        res.send({ ok: false, error: 'Invalid username or password!', code: HttpStatus.UNAUTHORIZED });
      }
    } catch (error) {
      console.log(error);
      res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
    }

  } else {
    res.send({ ok: false, error: 'Invalid data!', code: HttpStatus.INTERNAL_SERVER_ERROR });
  }

});

//*TODO แสดงรูปผู้ใช้--------------------------------------------------------------------------------
app.get('/getuserprofileimg/:u_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.u_id;

    var rs = await model.getListUserImages(db, id);
    res.send({ ok: true, showprofileimg: rs[0] });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//
app.get('/users', checkAuth, async (req, res, next) => {
  try {

    var rs = await model.getList(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมทั้งหมด--------------------------------------------------------------------------------
app.get('/showactivity', checkAuth, async (req, res, next) => {
  try {

    var rs = await model.getListActivity(db);

    for (const val of rs) {
      // let status = await getEMStatus(val.SERIAL_NO);
      var rscountnum = await model.checkUserjoinHome(db,val.ac_id);
      var numberjoins = rscountnum[0].countJoinHome;
      val.numberjoin = numberjoins;
    }

    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO! แสดงกิจกรรมทั้งหมดแบบไม่ล็อคอิน--------------------------------------------------------------------------------
app.get('/showactivitynolog', async (req, res, next) => {
  try {

    var rs = await model.getListActivityNoLog(db);
    res.send({ ok: true, rowslistnolog: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});



//*TODO แสดงกิจกรรมรูป--------------------------------------------------------------------------------
app.get('/showactivitimg/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    var rs = await model.getListActivityImages(db, id);
    res.send({ ok: true, showactivitimg: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมรูปปก--------------------------------------------------------------------------------
app.get('/showprofileactivitimg/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    var rs = await model.getProfileActivityImages(db, id);
    res.send({ ok: true, showprofileactivitimg: rs[0] });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});



//*TODO แสดงกิจกรรมทั้งหมดของแต่ละ user-------------------------------------------------------------------------------------
app.get('/useractivity/:u_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.u_id;
    console.log(id);

    if (id) {
      var rs = await model.getUserActivity(db, id);
      res.send({ ok: true, rows: rs });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมที่เข้าร่วมทั้งหมดของแต่ละ user--------------------------------------------------------------------------------------------------
app.get('/joinuseractivity/:u_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.u_id;
    // var acid = req.params.ac_id;
    console.log(id);

    if (id) {
      var rs = await model.getUserJoinActivity(db, id);
      res.send({ ok: true, showactivityjoin: rs });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO เพิ่มข้อมูล regis-------------------------------------------------------------------------------------------------------------------------------
app.post('/register', async (req, res, next) => {
  try {
    var u_user = req.body.u_user;
    var u_pass = req.body.u_pass;
    var u_name = req.body.u_name;
    var u_lname = req.body.u_lname;
    var u_old = req.body.u_old;
    var u_email = req.body.u_email;
    var u_tel = req.body.u_tel;


    console.log(u_user);
    console.log(u_pass);
    console.log(u_name);
    console.log(u_lname);
    console.log(u_old);
    console.log(u_email);
    console.log(u_tel);

    if (u_user && u_pass && u_name && u_lname && u_old && u_email && u_tel) {
      // var encPassword = crypto.createHash('md5').update(password).digest('hex');
      var data = {
        u_user: u_user,
        u_pass: u_pass,
        u_name: u_name,
        u_lname: u_lname,
        u_old: u_old,
        u_email: u_email,
        u_tel: u_tel,
      };

      var rs = await model.register(db, data);
      res.send({ ok: true, id: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });

    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO ถูกใจกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
app.post('/followac', checkAuth, async (req, res, next) => {
  try {
    var u_id = req.body.u_id;
    var ac_id = req.body.ac_id;
    var rscountfollow = await model.checkUserFollowActivity(db, u_id, ac_id);


    // console.log(u_id);
    // console.log(ac_id);


    if (rscountfollow[0].countFollowUser == 0) {

      if (u_id && ac_id) {
        // var encPassword = crypto.createHash('md5').update(password).digest('hex');
        var data = {
          u_id: u_id,
          ac_id: ac_id,

        };

        var rs = await model.getfollow(db, data);
        res.send({ ok: true, id: rs[0] });
      } else {
        res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });

      }

      console.log('แสดงการถูกใจ ' + rscount[0].countJoinUser);
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมทั้งหมดที่ถูกใจ
app.get('/followuseractivity/:u_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.u_id;
    // var acid = req.params.ac_id;
    console.log(id);

    if (id) {
      var rs = await model.getUserfollowActivity(db, id);
      res.send({ ok: true, showactivityfollow: rs });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO เข้าร่วมกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
app.post('/joinac', checkAuth, async (req, res, next) => {
  try {
    var u_id = req.body.u_id;
    var ac_id = req.body.ac_id;
    var jo_time = new Date();
    var rscount = await model.checkUserjoinActivity(db, u_id, ac_id);

    if (rscount[0].countJoinUser == 0) {
      if (u_id && ac_id && jo_time) {
        var data = {
          u_id: u_id,
          ac_id: ac_id,
          jo_time: jo_time,
        };

        var rs = await model.getjoin(db, data);
        res.send({ ok: true, id: rs[0] });
      } else {
        res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });

      }
    }
    console.log('แสดงการเข้าร่วม ' + rscount[0].countJoinUser);
    // console.log(u_id);
    // console.log(ac_id);
    // console.log(jo_time);

  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


// //todo เช็คการเข้าร่วมกิจกรรม-------------------------------------------------------------------------------------
// app.get('/useractivitycountjoin/:ac_id', checkAuth, async (req, res, next) => {
//   try {
//     var ac_id = req.params.ac_id;


//     var rs = await model.checkUserjoinActivity(db, ac_id);
//     res.send({ countJoinUser: rs[0] });
//   } catch (error) {
//     console.log(error);
//     res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
//   }
// });

//*TODO! เพิ่มแสดงความคิดเห็น---------------------------------------------------------------------------
app.post('/useractivitycountjoin', checkAuth, async (req, res, next) => {
  try {
    var u_id = req.params.u_id;
    var ac_id = req.body.ac_id;
    var com_message = req.body.com_message;
    var com_date = new Date();
    var com_time = new Date();



    console.log(u_id);
    console.log(ac_id);
    console.log(com_message);
    console.log(com_date);
    console.log(com_time);


    if (u_id && ac_id && com_message && com_time && com_date) {
      // var encPassword = crypto.createHash('md5').update(password).digest('hex');
      var data = {
        u_id,
        ac_id: ac_id,
        com_message: com_message,
        com_date: com_date,
        com_time: com_time,

      };
      var rs = await model.addComment(db, data, u_id);
      res.send({ ok: true, id: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});




//todo แสดงจำนวนคนเข้าร่วมกิจกรรม-------------------------------------------------------------------------------------
app.get('/useractivitycount/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var ac_id = req.params.ac_id;
    // console.log(id);

    var rs = await model.checkUserjoin(db, ac_id);
    res.send({ countJoin: rs[0] });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO เพิ่มแสดงความคิดเห็น---------------------------------------------------------------------------
app.post('/addcomment/:u_id', checkAuth, async (req, res, next) => {
  try {
    var u_id = req.params.u_id;
    var ac_id = req.body.ac_id;
    var com_message = req.body.com_message;
    var com_date = new Date();
    var com_time = new Date();



    console.log(u_id);
    console.log(ac_id);
    console.log(com_message);
    console.log(com_date);
    console.log(com_time);


    if (u_id && ac_id && com_message && com_time && com_date) {
      // var encPassword = crypto.createHash('md5').update(password).digest('hex');
      var data = {
        u_id,
        ac_id: ac_id,
        com_message: com_message,
        com_date: com_date,
        com_time: com_time,

      };
      var rs = await model.addComment(db, data, u_id);
      res.send({ ok: true, id: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO แสดงข้อความความคิดเห็น--------------------------------------------------------------------------------
app.get('/showcomment/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    // var id = req.params.u_id;

    var rs = await model.getComActivity(db, id);
    res.send({ ok: true, showcomment: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});




//*TODO เพิ่มข้อมูล activity-------------------------------------------------------------------------------------------------------------------------------
app.post('/addactivity/:u_id', checkAuth, async (req, res, next) => {
  try {
    var u_id = req.params.u_id;
    var ac_name = req.body.ac_name;
    var ac_type = req.body.ac_type;
    var ac_time = req.body.ac_time;
    var ac_date = req.body.ac_date;
    var ac_ldate = req.body.ac_ldate;
    var ac_number = req.body.ac_number;
    // var ac_numberjoin = req.body.ac_numberjoin;
    var ac_home = req.body.ac_home;
    var ac_sub = req.body.ac_sub;
    var ac_district = req.body.ac_district;
    var ac_province = req.body.ac_province;
    var ac_la = req.body.ac_la;
    var ac_long = req.body.ac_long;
    var ac_detel = req.body.ac_detel;



    // console.log(u_id);
    console.log(ac_name);
    console.log(ac_type);
    console.log(ac_time);
    console.log(ac_date);
    console.log(ac_ldate);
    console.log(ac_number);
    // console.log(ac_numberjoin);
    console.log(ac_home);
    console.log(ac_sub);
    console.log(ac_district);
    console.log(ac_province);
    console.log(ac_la);
    console.log(ac_long);
    console.log(ac_detel);


    if (u_id && ac_name && ac_type && ac_time && ac_date && ac_ldate && ac_number && ac_home && ac_sub && ac_district && ac_province && ac_la && ac_long && ac_detel) {
      // var encPassword = crypto.createHash('md5').update(password).digest('hex');
      var data = {
        u_id,
        ac_name: ac_name,
        ac_type: ac_type,
        ac_time: ac_time,
        ac_date: ac_date,
        ac_ldate: ac_ldate,
        ac_number: ac_number,
        // ac_numberjoin: ac_numberjoin,
        ac_home: ac_home,
        ac_sub: ac_sub,
        ac_district: ac_district,
        ac_province: ac_province,
        ac_la: ac_la,
        ac_long: ac_long,
        ac_detel: ac_detel,


      };

      var rs = await model.addactvity(db, data, u_id);
      res.send({ ok: true, id: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });

    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//เก็บ-------------------------------------------------------------------------------------------------------------------------
// app.get('/get', async (req, res, next) => {
//   try {
//     // var id = req.params.;
//     // console.log(id);
//     var rs = await model.getAcid(db);
//       res.send({ ok: true, info: rs[0] });

//   } catch (error) {
//     console.log(error);
//     res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
//   }
// });


//*TODO update ผู้ใช้---------------------------------------------------------------------------------------------------------------------------------------
app.put('/updateuser/:u_id', checkAuth, async (req, res, next) => {
  try {

    var u_id = req.params.u_id;
    var u_name = req.body.u_name;
    var u_lname = req.body.u_lname;
    var u_old = req.body.u_old;
    var u_email = req.body.u_email;
    var u_tel = req.body.u_tel;

    // console.log(id);
    console.log(u_name);
    console.log(u_lname);
    console.log(u_old);
    console.log(u_email);
    console.log(u_tel);


    if (u_id && u_name && u_lname && u_old && u_email && u_tel) {
      var data = {
        //u_id: id,
        u_name: u_name,
        u_lname: u_lname,
        u_old: u_old,
        u_email: u_email,
        u_tel: u_tel,
      };
      var rs = await model.update(db, u_id, data);
      console.log(rs);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});




//*TODO update กิจกรรม---------------------------------------------------------------------------------------------------------------------------------------
app.put('/updateactivity/:ac_id', checkAuth, async (req, res, next) => {
  try {

    var ac_id = req.params.ac_id;
    var ac_name = req.body.ac_name;
    var ac_type = req.body.ac_type;
    var ac_time = req.body.ac_time;
    var ac_date = req.body.ac_date;
    var ac_ldate = req.body.ac_ldate;
    var ac_number = req.body.ac_number;
    var ac_home = req.body.ac_home;
    var ac_sub = req.body.ac_sub;
    var ac_district = req.body.ac_district;
    var ac_province = req.body.ac_province;
    var ac_detel = req.body.ac_detel;
    // var ac_la = req.body.ac_la;
    // var ac_long = req.body.ac_long;

    // console.log(id);
    console.log(ac_name);
    console.log(ac_type);
    console.log(ac_time);
    console.log(ac_date);
    console.log(ac_ldate);
    console.log(ac_number);
    console.log(ac_home);
    console.log(ac_sub);
    console.log(ac_district);
    console.log(ac_province);
    console.log(ac_detel);
    // console.log(ac_la);
    // console.log(ac_long);


    if (ac_id && ac_name && ac_type && ac_time && ac_date && ac_ldate && ac_number && ac_home && ac_sub && ac_district && ac_province && ac_detel) {
      var data = {
        //u_id: id,
        ac_name: ac_name,
        ac_type: ac_type,
        ac_time: ac_time,
        ac_date: ac_date,
        ac_ldate: ac_ldate,
        ac_number: ac_number,
        ac_home: ac_home,
        ac_sub: ac_sub,
        ac_district: ac_district,
        ac_province: ac_province,
        ac_detel: ac_detel,
        // ac_la: ac_la,
        // ac_long: ac_long,
      };
      var rs = await model.updateActivity(db, ac_id, data);
      console.log(rs);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แก้ไขแมพ---------------------------------------------------------------------------------------------------------------------------------------
app.put('/updateMap/:ac_id', checkAuth, async (req, res, next) => {
  try {

    var ac_id = req.params.ac_id;

    var ac_la = req.body.ac_la;
    var ac_long = req.body.ac_long;

    console.log(ac_id);

    console.log(ac_la);
    console.log(ac_long);


    if (ac_id && ac_la && ac_long) {
      var data = {
        //u_id: id,

        ac_la: ac_la,
        ac_long: ac_long,
      };
      var rs = await model.updateMap(db, ac_id, data);
      console.log(rs);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


app.delete('/users/:id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.id;

    if (id) {
      await model.remove(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO ยกเลิกการเข้าร่วม--------------------------------------------------------------------------------------------------

app.delete('/canceljoin/:j_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.j_id;

    if (id) {

      await model.cancelJoin(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});



//*TODO ส่งข้อมูลแสดง user-------------------------------------------------------------------------------------------------------------------------
app.get('/getprofile/:u_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.u_id;
    console.log(id);

    if (id) {
      var rs = await model.getInfo(db, id);
      res.send({ ok: true, info: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//*TODO ส่งข้อมูลแสดงกิจกรรม 1 กิจกรรม-------------------------------------------------------------------------------------------------------------------------
app.get('/getactivity/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    console.log(id);

    if (id) {
      var rs = await model.getActivity(db, id);
      res.send({ ok: true, info: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------

app.post('/reportac/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var ac_id = req.body.ac_id;
    var re_detel = req.body.re_detel;

    console.log(re_detel);

    if (ac_id && re_detel) {
      // var encPassword = crypto.createHash('md5').update(password).digest('hex');
      var data = {
        ac_id: ac_id,
        re_detel: re_detel,
      };

      var rs = await model.ReportAc(db, data ,ac_id);
      res.send({ ok: true, id: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });

    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงรายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------
app.get('/getreportactivity/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    console.log(id);

    if (id) {
      var rs = await model.getReportActivity(db, id);
      res.send({ ok: true, reportinfo: rs });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงรูปจบกิจกรรม--------------------------------------------------------------------------------
app.get('/showreportactivitimg/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    var rs = await model.getListReportActivityImages(db, id);
    res.send({ ok: true, showreportactivitimg: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//? แก้ไขรูปจบกิจกรรม-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//* ---------------------------------------------------------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/reportimages', express.static('reportimages'));

// Set The Storage Engine
const storagereport = multer.diskStorage({
  destination: './uploads/reportimages',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const getuploadreport = multer({
  storage: storagereport,
  limits: { fileSize: 20480000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 50);



//!อัพโหลดรูปภาพกิจกรรม (Sendactivity Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadImgReport(db, data, id) {
  return await model.sendImagesReport(db, data, id);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.post('/reportimgactivity/:ac_id', function (req, res, next) {
  getuploadreport(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          var ac_id = req.params.ac_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          // var u_id = model.getUserid(db);

          fileImageName = req.files[0].filename;

          console.log(req.files[0].filename);
          console.log(fileImageName);
          // console.log(u_id);

          if (ac_id && fileImageName) {
            var data = {
              ac_id: ac_id,
              reimg_img: fileImageName

            };
            var rs = uploadImgReport(db, data, ac_id);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});
//* ---------------------------------------------------------------------------------------------------------------------------
//?-------------------------------------------------------------------------------------------------------------------
//* ---------------------------------------------------------------------------------------------------------------------------

//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------
//TODO* รายงานจบกิจกรรม-------------------------------------------------------------------------------------------------------------------------------


//!--------------------------------------------------------------------------------
//! ฟังค์ชั่นลบ user
//!--------------------------------------------------------------------------------

//*TODO ลบภาพกิจกรรมนะ--------------------------------------------------------------------------------------------------

app.delete('/deleteimg/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    // var join = req.body.jo_id;
    if (id) {

      await model.deleteimg(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO ลบภาพปกกิจกรรมนะ--------------------------------------------------------------------------------------------------

app.delete('/deleteimgprofile/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    // var join = req.body.jo_id;
    if (id) {

      await model.deleteimgProfile(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ยกเลิกการถูกใจกิจกรรมผู้ใช้--------------------------------------------------------------------------------------------------
app.delete('/cancelfollowac/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    if (id) {

      await model.cancelFollowAc(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบกิจกรรมผู้ใช้--------------------------------------------------------------------------------------------------
app.delete('/deleteactivityuser/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    if (id) {

      await model.deleteActivityUser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบคอมเม้นต์กิจกรรม--------------------------------------------------------------------------------------------------
app.delete('/deletecommentactivity/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    if (id) {

      await model.deleteCommentActivity(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบการเข้าร่วม Ac--------------------------------------------------------------------------------------------------
app.delete('/deletejoinactivity/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    if (id) {

      await model.deleteJoinActivity(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบการถูกใจ Ac--------------------------------------------------------------------------------------------------
app.delete('/deletefollowctivity/:ac_id', async (req, res, next) => {
  try {
    var id = req.params.ac_id;

    if (id) {

      await model.deleteFollowActivity(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});



//!----------------------------------------------------------------------------------------------


//?-------------------------------------------------------------------------------------------------------------------------------
//?-------------------------------------------------------------------------------------------------------------------------------
//?Admin
//?-------------------------------------------------------------------------------------------------------------------------------
//?-------------------------------------------------------------------------------------------------------------------------------


//*TODO ล้อกอินแอดมิน-----------------------------------------------------------------------------------------------------------
app.post('/loginadmin', async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  if (username && password) {
    //var encPassword = crypto.createHash('md5').update(password).digest('hex');

    try {
      var rs = await model.loginAdmin(db, username, password);
      if (rs.length) {
        var token = jwt.sign({ username: username });
        res.send({ ok: true, token: token, id: rs[0].a_id });
      } else {
        res.send({ ok: false, error: 'Invalid username or password!', code: HttpStatus.UNAUTHORIZED });
      }
    } catch (error) {
      console.log(error);
      res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
    }

  } else {
    res.send({ ok: false, error: 'Invalid data!', code: HttpStatus.INTERNAL_SERVER_ERROR });
  }

});

//*TODO ส่งข้อมูลแสดง admin-------------------------------------------------------------------------------------------------------------------------
app.get('/getproadmin/:a_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.a_id;
    console.log(id);

    if (id) {
      var rs = await model.getInfoadmin(db, id);
      res.send({ ok: true, info: rs[0] });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงข้อมูลผู้ใช้ทั้งหมด--------------------------------------------------------------------------------
app.get('/showuser', checkAuth, async (req, res, next) => {
  try {

    var rs = await model.getListUser(db);
    res.send({ ok: true, listuser: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO update ผู้ใช้ ADMIN---------------------------------------------------------------------------------------------------------------------------------------
app.put('/updateuseradmin/:u_id', async (req, res, next) => {
  try {

    var u_id = req.params.u_id;
    var u_name = req.body.u_name;
    var u_lname = req.body.u_lname;
    var u_old = req.body.u_old;
    var u_email = req.body.u_email;
    var u_tel = req.body.u_tel;

    // console.log(id);
    console.log(u_name);
    console.log(u_lname);
    console.log(u_old);
    console.log(u_email);
    console.log(u_tel);


    if (u_id && u_name && u_lname && u_old && u_email && u_tel) {
      var data = {
        //u_id: id,
        u_name: u_name,
        u_lname: u_lname,
        u_old: u_old,
        u_email: u_email,
        u_tel: u_tel,
      };
      var rs = await model.updateUserAdmin(db, u_id, data);
      console.log(rs);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมทั้งหมด user--------------------------------------------------------------------------------
app.get('/showactivityuser', checkAuth, async (req, res, next) => {
  try {

    var rs = await model.showuserActivity(db);
    res.send({ ok: true, adminlistactivity: rs });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO แสดงกิจกรรมที่เข้าร่วมทั้งหมดของแต่ละ user--------------------------------------------------------------------------------------------------
app.get('/showjoinuserall/:ac_id', checkAuth, async (req, res, next) => {
  try {
    var id = req.params.ac_id;
    // var acid = req.params.ac_id;
    console.log(id);

    if (id) {
      var rs = await model.getUserJoinAll(db, id);
      res.send({ ok: true, showuseractivityjoinall: rs });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//!--------------------------------------------------------------------------------
//! ฟังค์ชั่นลบ admin
//!--------------------------------------------------------------------------------

//todo ลบข้อมูลผู้ใช้--------------------------------------------------------------------------------------------------

app.delete('/deleteuser/:u_id', async (req, res, next) => {
  try {
    var id = req.params.u_id;

    if (id) {

      await model.deleteuser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//*TODO ลบรูปผู้ใช้นะ--------------------------------------------------------------------------------------------------

app.delete('/deleteimguser/:u_id', async (req, res, next) => {
  try {
    var id = req.params.u_id;
    // var join = req.body.jo_id;
    if (id) {

      await model.deleteimguser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบคอมเม้นต์กิจกรรม--------------------------------------------------------------------------------------------------
app.delete('/deletecommentuser/:u_id', async (req, res, next) => {
  try {
    var id = req.params.u_id;

    if (id) {

      await model.deleteCommentUser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบการเข้าร่วมของ user--------------------------------------------------------------------------------------------------
app.delete('/deletejoinuser/:u_id', async (req, res, next) => {
  try {
    var id = req.params.u_id;

    if (id) {

      await model.deleteJoinUser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

//todo ลบการถูกใจของ user--------------------------------------------------------------------------------------------------
app.delete('/deletefollowuser/:u_id', async (req, res, next) => {
  try {
    var id = req.params.u_id;

    if (id) {

      await model.deleteFollowUser(db, id);
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});


//!------------------------------------------------------------------------------------------------------
//! รูป อย่ามาวางใต้นี้---------------------------------------------------------------------------------------
//!------------------------------------------------------------------------------------------------------
//!------------------------------------------------------------------------------------------------------

//!addimmageactivity-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/images', express.static('images'));

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './uploads/images',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const upload = multer({
  storage: storage,
  limits: { fileSize: 20480000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 12);



//!อัพโหลดรูปภาพกิจกรรม (Sendactivity Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadImgAc(db, data) {
  return await model.sendImages(db, data);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.post('/uploads', function (req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          // var u_id = req.params.u_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          var ac_id = model.getAcid(db);

          fileImageName = req.files[0].filename;

          console.log(req.files[0].filename);
          console.log(fileImageName);
          console.log(ac_id);

          if (ac_id && fileImageName) {
            var data = {
              ac_id: ac_id,
              im_img: fileImageName

            };
            var rs = uploadImgAc(db, data);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});

//!//!ปกกิจกรรม-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/imagesprofileactivity', express.static('imagesprofileactivity'));

// Set The Storage Engine
const storageprofileac = multer.diskStorage({
  destination: './uploads/imagesprofileactivity',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const uploadprofileac = multer({
  storage: storageprofileac,
  limits: { fileSize: 2048000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 12);



//!อัพโหลดรูปภาพกิจกรรม (Sendactivity Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadProfileImgAc(db, data) {
  return await model.sendImagesProfileAc(db, data);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.post('/uploadsprofileac', function (req, res, next) {
  uploadprofileac(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          // var u_id = req.params.u_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          var ac_id = model.getAcid(db);

          fileImageName = req.files[0].filename;

          console.log(req.files[0].filename);
          console.log(fileImageName);
          console.log(ac_id);

          if (ac_id && fileImageName) {
            var data = {
              ac_id: ac_id,
              imac_img: fileImageName

            };
            var rs = uploadProfileImgAc(db, data);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});
//!ปกกิจกรรม--------------------------------------------------------------------------------------------

//? แก้ไขรูปกิจกรรม-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//* ---------------------------------------------------------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/images', express.static('images'));

// Set The Storage Engine
const storageeditac = multer.diskStorage({
  destination: './uploads/images',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const getuploadeditac = multer({
  storage: storageeditac,
  limits: { fileSize: 20480000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 12);



//!อัพโหลดรูปภาพกิจกรรม (Sendactivity Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadImgEditAc(db, data, id) {
  return await model.editImagesActivity(db, data, id);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.post('/editimgactivity/:ac_id', function (req, res, next) {
  getuploadeditac(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          var ac_id = req.params.ac_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          // var u_id = model.getUserid(db);

          fileImageName = req.files[0].filename;

          console.log(req.files[0].filename);
          console.log(fileImageName);
          // console.log(u_id);

          if (ac_id && fileImageName) {
            var data = {
              ac_id: ac_id,
              im_img: fileImageName

            };
            var rs = uploadImgEditAc(db, data, ac_id);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});
//* ---------------------------------------------------------------------------------------------------------------------------
//?-------------------------------------------------------------------------------------------------------------------
//* ---------------------------------------------------------------------------------------------------------------------------

//? addimmageuser เพิ่มรูปผู้ใช้-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/imagesuser', express.static('imagesuser'));

// Set The Storage Engine
const storageuserprofile = multer.diskStorage({
  destination: './uploads/imagesuser',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const getuploaduser = multer({
  storage: storageuserprofile,
  limits: { fileSize: 20480000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 12);



//!อัพโหลดรูปภาพกิจกรรม (Sendactivity Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadImg(db, data) {
  return await model.getImagesUser(db, data);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.post('/uploadsimguser', function (req, res, next) {
  getuploaduser(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          // var u_id = req.params.u_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          var u_id = model.getUserid(db);

          fileImageName = req.files[0].filename;

          console.log(req.files[0].filename);
          console.log(fileImageName);
          console.log(u_id);

          if (u_id && fileImageName) {
            var data = {
              u_id: u_id,
              iu_img: fileImageName

            };
            var rs = uploadImg(db, data);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});

//?-----------------------------------------------------------------------------------------------------------------------------------------


//! addimmage แก้ไขรูปผู้ใช้-------------------------------------------------------------------------
app.use('/public', express.static('public')); app.use('/imagesuser', express.static('imagesuser'));

// Set The Storage Engine
const storageprofile = multer.diskStorage({
  destination: './uploads/imagesuser',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  return cb(null, true);

  // if(mimetype && extname){
  //   return cb(null,true);
  // } else {
  //   cb('Error: Images Only!');
  // }
}


const userupload = multer({
  storage: storageprofile,
  limits: { fileSize: 20480000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }

}).array('picture', 12);



//!อัพโหลดรูปภาพแจ้งซ่อม (Sendrepair Upload IMG)---------------------------------------------------
var fileImageName = '';

async function uploadImgs(db, data, id) {
  return await model.sendImagesuser(db, data, id);
}

// async function getRN_NO(){
//   return await model.getRNNO(db);
// } 

app.put('/uploadsuser/:u_id', function (req, res, next) {
  userupload(req, res, (err) => {
    if (err) {
      console.log('error : ' + err)

    } else {
      if (req.files[0].filename == undefined) {
        console.log('Error: No File Selected')

      } else {
        console.log(`uploads/${req.files[0].filename}`);

        try {

          var u_id = req.params.u_id;
          //นำ path รูปมาเก็บไว้ใน ตัวแปร
          // var ac_id = model.getAcid(db);

          fileImageName = req.files[0].filename;

          console.log(u_id);
          console.log(req.files[0].filename);
          console.log(fileImageName);


          if (u_id && fileImageName) {
            var data = {

              iu_img: fileImageName

            };
            var rs = uploadImgs(db, data, u_id);
            console.log(rs);

            return res.send({ ok: true, id: rs[0] });
          } else {
            res.send({ ok: false, error: 'Invalid data', code: HttpStatus.INTERNAL_SERVER_ERROR });
          }
        } catch (error) {
          console.log(error);
          res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
        }
        // insert db 
        // get RN_NO last insert
        // 
      }
    }
  });
});

//!-------------------------------------------------------------------------------------------------------




//error handlers
if (process.env.NODE_ENV === 'development') {
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        ok: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR)
      }
    });
  });
}

app.use((req, res, next) => {
  res.status(HttpStatus.NOT_FOUND).json({
    error: {
      ok: false,
      code: HttpStatus.NOT_FOUND,
      error: HttpStatus.getStatusText(HttpStatus.NOT_FOUND)
    }
  });
});


var port = +process.env.WWW_PORT || 3000;

app.listen(port, () => console.log(`Api listening on port ${port}!`));

