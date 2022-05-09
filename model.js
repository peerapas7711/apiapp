
module.exports = {
  //*TODO ล้อกอินผู้ใช้
  doLogin(db, username, password) {
    return db('users')
      .select('u_user', 'u_pass', 'u_id')
      .where('u_user', username)
      .where('u_pass', password)
      .limit(1);
  },


  getList(db) {
    return db('users').orderBy('u_id');
  },

  save(db, data) {
    return db('users').insert(data, 'id');
  },
  //*TODO สมัครสมาชิกผู้ใช้
  register(db, data) {
    return db('users').insert(data, 'u_id');
  },

  //*TODO เข้าร่วมกิจกรรม
  getjoin(db, data) {
    return db('join').insert(data);
  },



  //*TODO ถูกใจกิจกรรม
  getfollow(db, data) {
    return db('follow').insert(data);
  },

  //*TODO แสดงกิจกรรมที่ถูกใจทั้งหมดของแต่ละ user
  getUserfollowActivity(db, id) {
    return db('follow').orderBy('follow.ac_id', 'desc')
      .where('follow.u_id', id)
      .leftJoin('activity', 'follow.ac_id', 'activity.ac_id')
      .leftJoin('users', 'activity.u_id', 'users.u_id')
      .leftJoin('imagesprofileactivity', 'activity.ac_id', 'imagesprofileactivity.ac_id')
      .select('*');
  },


  //*TODO เพิ่มกิจกรรม
  addactvity(db, data, id) {
    return db('activity').insert(data, 'ac_id')
      .leftJoin('users', 'activity.id', id, 'users.u_id');
  },



  //*TODO แก้ไขข้อมูลผู้ใช้
  update(db, id, data) {
    return db('users')
      .where('u_id', id)
      .update(data);
  },

  //*TODO แก้ไขข้อมูลกิจกรรม
  updateActivity(db, id, data) {
    return db('activity')
      .where('ac_id', id)
      .update(data);
  },

  //*TODO แก้ไข MAP
  updateMap(db, id, data) {
    return db('activity')
      .where('ac_id', id)
      .update(data);
  },

  remove(db, id) {
    return db('users')
      .where('id', id)
      .del();
  },
  //*TODO แสดงข้อมูล user
  getInfo(db, id) {
    return db('users')
      .where('u_id', id)
      // .leftJoin('imagesuser', 'users.u_id', 'imagesuser.u_id')
      .select('*');
  },
  //*TODO แสดงข้อมูลกิจกรรม 1 กิจกรรม
  getActivity(db, id) {
    return db('activity')
      .where('ac_id', id)
  },

  //*TODO แสดงกิจกรรมทั้งหมด
  getListActivity(db) {
    return db('activity').orderBy('activity.ac_id', 'desc')
      .leftJoin('users', 'activity.u_id', 'users.u_id')
      .leftJoin('imagesprofileactivity', 'activity.ac_id', 'imagesprofileactivity.ac_id')
      .select('*')
      ;
  },


  //*TODO! แสดงกิจกรรมทั้งหมดแบบไม่ล็อคอิน
  getListActivityNoLog(db) {
    return db('activity').orderBy('activity.ac_id', 'desc')
      .leftJoin('users', 'activity.u_id', 'users.u_id')
      .leftJoin('imagesprofileactivity', 'activity.ac_id', 'imagesprofileactivity.ac_id')
      .select('*')
      ;
  },

  //*TODO! เช็คจำนวนคนเข้าร่วมกิจกรรมหน้าหลัก
  checkUserjoinHome(db, numjoinhome) {
    return db('join')
      .where('ac_id', numjoinhome)
      .count('ac_id as countJoinHome')
  },

  //*TODO เช็คจำนวนคนเข้าร่วมกิจกรรม
  checkUserjoin(db, numjoin) {
    return db('join')
      .where('ac_id', numjoin)
      .count('ac_id as countJoin')
  },


  //*TODO เช็คว่าเข้าร่วมกิจกรรมยัง
  checkUserjoinActivity(db, uid, acid) {
    return db('join')
      .where('u_id', uid)
      .where('ac_id', acid)
      .count('u_id as countJoinUser')
  },

  //*TODO เช็คว่าถูกใจกิจกรรมยัง
  checkUserFollowActivity(db, uid, acid) {
    return db('follow')
      .where('u_id', uid)
      .where('ac_id', acid)
      .count('u_id as countFollowUser')
  },



  // checkUserjoinActivity(db, userjoin) {
  //   return db('join')
  //     .where('u_id', userjoin)
  //     .count('ac_id as countJoinUser')
  // },



  //*TODO เพิ่มความคิดเห็น
  addComment(db, data, id) {
    return db('comment').insert(data, 'com_id')
      .leftJoin('users', 'comment.id', id, 'users.u_id');
  },

  //*TODO แสดงข้อความความคิดเห็น
  getComActivity(db, id) {
    return db('comment').orderBy('com_id', 'asc')
      .where('comment.ac_id', id)
      .leftJoin('imagesuser', 'comment.u_id', 'imagesuser.u_id')
      .leftJoin('users', 'comment.u_id', 'users.u_id')
      .select('*');
    // .limit(3);
  },



  //*TODO แสดงกิจกรรมทั้งหมดของแต่ละ user
  getUserActivity(db, id) {
    return db('activity').orderBy('activity.ac_id', 'desc').where('activity.u_id', id)
      .leftJoin('imagesprofileactivity', 'activity.ac_id', 'imagesprofileactivity.ac_id')
      .select('*')
  },

  //*TODO แสดงกิจกรรมที่เข้าร่วมทั้งหมดของแต่ละ user
  getUserJoinActivity(db, id) {
    return db('join').orderBy('join.ac_id', 'desc')
      .where('join.u_id', id)
      .leftJoin('activity', 'join.ac_id', 'activity.ac_id')
      .leftJoin('users', 'activity.u_id', 'users.u_id')
      .leftJoin('imagesprofileactivity', 'activity.ac_id', 'imagesprofileactivity.ac_id')
      .select('*');
  },

  //!--------------------------------------------------------------------------------
  //! ฟังค์ชั่นลบ user
  //!--------------------------------------------------------------------------------

  //*TODO ยกเลิกการเข้าร่วมกิจกรรม
  cancelJoin(db, id) {
    return db('join')
      .where('j_id', id)
      .del();
  },

  //*TODO ยกเลิกการถูกใจกิจกรรม user
  cancelFollowAc(db, id) {
    return db('follow')
      .where('ac_id', id)
      .del();
  },

  //*TODO ลบกิจกรรม user
  deleteActivityUser(db, id) {
    return db('activity')
      .where('ac_id', id)
      .del();
  },

  //*TODO ลบคอมเม้นต์กิจกรรม
  deleteCommentActivity(db, id) {
    return db('comment')
      .where('ac_id', id)
      .del();
  },

  //TODO ลบรูปกิจกรรม
  deleteimg(db, id) {
    return db('images')
      .where('ac_id', id)
      .del();
  },
  //TODO ลบรูปปกกิจกรรม
  deleteimgProfile(db, id) {
    return db('imagesprofileactivity')
      .where('ac_id', id)
      .del();
  },


  //TODO ลบการเข้าร่วม Ac
  deleteJoinActivity(db, id) {
    return db('follow')
      .where('ac_id', id)
      .del();
  },

  //TODO ลบการถูกใจ Ac
  deleteFollowActivity(db, id) {
    return db('join')
      .where('ac_id', id)
      .del();
  },

  //!--------------------------------------------------------------------------------


  //todo เพิ่มรูปกิจกรรมหลายรูป
  sendImages(db, data) {
    return db('images')
      .insert(data, 'im_id')
  },

  //*TODO เก็บidกิจกรรม
  getAcid(db) {
    return db('activity')
      .orderBy('ac_id', 'desc')
      .select('activity.ac_id')
      .limit(1);
  },

  //*TODO แสดงรูปกิจกรรม
  getListActivityImages(db, id) {
    return db('images').where('images.ac_id', id,)
      // .limit(1)
      .select('*');
  },

  //*ปกกิจกรรรม--------------------------
  //todo เพิ่มรูปกิจกรรมหลายรูป
  sendImagesProfileAc(db, data) {
    return db('imagesprofileactivity')
      .insert(data, 'imac_id')
  },

  //*TODO แสดงรูปปกกิจกรรม
  getProfileActivityImages(db, id) {
    return db('imagesprofileactivity').where('imagesprofileactivity.ac_id', id,)
      // .limit(1)
      .select('*');
  },
  //*----------------------------------

  //todo แก้ไขรูปกิจกรรม
  editImagesActivity(db, data, id) {
    return db('images')
      .insert(data, 'im_id').where('ac_id', id);
  },

  //todo เพิ่มรูป Profileuser
  getImagesUser(db, data) {
    return db('imagesuser')
      .insert(data, 'iu_id')
  },
  //*TODO เก็บidผู้ใช้เพิ่มรูป
  getUserid(db) {
    return db('users')
      .orderBy('u_id', 'desc')
      .select('users.u_id')
      .limit(1);
  },

  //*TODO แสดงรูป user
  getListUserImages(db, id) {
    return db('imagesuser').where('imagesuser.u_id', id,)
      .select('*');
  },

  //*TODO แก้ไขรูปโปรไฟล์ *****
  sendImagesuser(db, data, id) {
    return db('imagesuser').where('u_id', id).update(data);
  },


  //* รายงานจบกิจกรรม-------------------------------
  //* รายงานจบกิจกรรม-------------------------------
  //* รายงานจบกิจกรรม-------------------------------

  //todo เพิ่มรูปจบกิจกรรมหลายรูป
  sendImagesReport(db, data, id) {
    return db('reportimages')
      .insert(data, 'reimg_id').where('ac_id', id);
  },

  ReportAc(db, data, id) {
    return db('report')
      .insert(data, 're_id').where('ac_id', id);
  },

  //*TODO แสดงรายงานจบกิจกรรม
  getReportActivity(db, id) {
    return db('report')
      .where('ac_id', id)
  },

  //*TODO แสดงรูปจบกิจกรรม
  getListReportActivityImages(db, id) {
    return db('reportimages').where('reportimages.ac_id', id,)
      // .limit(1)
      .select('*');
  },

  //* รายงานจบกิจกรรม-------------------------------
  //* รายงานจบกิจกรรม-------------------------------
  //* รายงานจบกิจกรรม-------------------------------






  //?----------------------------------------------------------------------------------------------------------------------------------------------
  //?----------------------------------------------------------------------------------------------------------------------------------------------
  //?----------------------------------------------------------------------------------------------------------------------------------------------

  //TODO ล้อกอิน admin
  loginAdmin(db, username, password) {
    return db('admin')
      .select('a_user', 'a_pass', 'a_id')
      .where('a_user', username)
      .where('a_pass', password)
      .limit(1);
  },

  //*TODO แสดงข้อมูล admin
  getInfoadmin(db, id) {
    return db('admin')
      .where('a_id', id);
  },


  //TODO แสดงข้อมูลผู้ใช้ทั้งหมด
  getListUser(db) {
    return db('users').orderBy('users.u_id')
      .leftJoin('imagesuser', 'users.u_id', 'imagesuser.u_id')
      .select('*');
  },

  //TODO แก้ไขข้อมูลผู้ใช้
  updateUserAdmin(db, id, data) {
    return db('users')
      .where('u_id', id)
      .update(data);
  },

  //!--------------------------------------------------------------------------------
  //! ฟังค์ชั่นลบ admin
  //!--------------------------------------------------------------------------------


  //*TODO ลบข้อมูล user
  deleteuser(db, id) {
    return db('users')
      .where('u_id', id)
      .del();
  },
  //TODO ลบรูป user
  deleteimguser(db, id) {
    return db('imagesuser')
      .where('u_id', id)
      .del();
  },
  //*TODO ลบคอมเม้นต์ของ user
  deleteCommentUser(db, id) {
    return db('comment')
      .where('u_id', id)
      .del();
  },

  //*TODO ลบการเข้าร่วมของ user
  deleteJoinUser(db, id) {
    return db('join')
      .where('u_id', id)
      .del();
  },

  //*TODO ลบการถูกใจของ user
  deleteFollowUser(db, id) {
    return db('follow')
      .where('u_id', id)
      .del();
  },

  //!---------------------------------------------------------------------------------

  //*TODO แสดงกิจกรรมทั้งหมด user
  showuserActivity(db) {
    return db('activity').orderBy('activity.ac_id', 'desc')
      .leftJoin('users', 'activity.u_id', 'users.u_id')
      .leftJoin('imagesuser', 'users.u_id', 'imagesuser.u_id')
      .select('*');

  },

  //*TODO แสดงผู้เข้าร่วมแต่ละกิจกรรม
  getUserJoinAll(db, id) {
    return db('join').orderBy('join.ac_id', 'desc')
      .where('join.ac_id', id)
      .leftJoin('users', 'join.u_id', 'users.u_id')
      .leftJoin('imagesuser', 'users.u_id', 'imagesuser.u_id')
      .select('*');
  },

};






