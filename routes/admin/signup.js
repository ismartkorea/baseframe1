var express = require('express');
var path = require('path');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var router = express.Router();

var config = require('../common/dbconfig');

const saltRounds = 10;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(passport.initialize());

// Routing
router.get('/', function(req, res) {
    var ss = req.session;

    res.render('./admin/signup', {'title' : '관리자 추가 화면', 'session' : ss});
});

passport.serializeUser(function(user, done) {
    done(null, user.usrId);
});

passport.deserializeUser(function(usrId, done) {
    done(null, usrId);
});

// 성공했을때 리다이렉트 시키는 부분
router.post('/', passport.authenticate('join-local', {
    successRedirect: '/admin/login',
    failureRedirect: '/admin/signup',
    failureFlash: true
}));

passport.use('join-local', new LocalStrategy({
        usernameField: 'usrId',
        passwordField: 'usrPwd',
        passReqToCallback: true
    },
    function(req, usrId, usrPwd, done) {

        console.log('usrId = ', usrId);
        console.log('usrPwd = ', usrPwd);
        var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
        var usrName = req.body.usrName !=null ? req.body.usrName : '';
        console.log('usrEmail = ', usrEmail);

        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT * FROM tbl_manager WHERE m_id = ?', [usrId], function (err, rows) {
            if (err) {
                console.log('err : ', err);
                return done(err);
            }

            if (rows.length) {
                console.log('rows.length : ', rows.length);

                return done(null, false, {message: 'your id is already used'});
            } else {
                bcrypt.hash(usrPwd, saltRounds, function (err, hash) {
                    //var sql = {m_id: usrId, m_pwd: hash, m_email: usrEmail, m_name : usrName, insert_dt : "now()", insert_usr : "admin", update_dt : "now()", update_usr : "admin"}; // 입력받은 평문을 hash로 바꿔서 넣어준다
                   /*
                    conn.query('INSERT INTO tbl_manager SET ?', sql, function (err, rows) {
                        if (err) throw err;
                        return done(null, {'usrId': usrId, 'usrName': rows[0].m_name});
                    });
                    */
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query('INSERT INTO tbl_manager (m_id, m_pwd, m_email, m_name, insert_dt, insert_usr, update_dt, update_usr) VALUES(?, ?, ?, ?, now(), ?, now(), ?)',
                        [usrId, hash, usrEmail, usrName, usrId, usrId],
                        function (err, rows) {
                            if (err) throw err;
                            return done(null, {'usrId': usrId, 'usrName': rows.m_name});
                        }
                    );
                    conn.commit();
                    conn.end();
                });
            }
        });
        conn.end();
    }
));

module.exports = router;