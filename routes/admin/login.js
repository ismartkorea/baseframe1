/*
 * 모듈명  : login.js
 * 설명    : 관리자화면 '로그인처리' 에 대한 모듈.
 * 작성일  : 2017년 09월 30일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var passport = require('passport');
//var cookieSession = require('cookie-session');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var router = express.Router();

var SessionSchema = require('../common/SessionSchema');
var config = require('../common/dbconfig');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(passport.initialize());

// login 폼 호출.
router.get('/', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    var ss = req.session;

    if(ss.usrNo) {
        res.redirect('/admin');
    } else {
        res.render('./admin/login', {'title': '관리자 로그인 화면', 'message' : '', 'result' : ss});
    }

});

passport.serializeUser(function(user, done) {
    done(null, user.usrId);
});

passport.deserializeUser(function(usrId, done) {
    done(null, usrId);
});

passport.use('admin-login-local', new LocalStrategy({
        usernameField: 'usrId',
        passwordField: 'usrPwd',
        passReqToCallback: true
    },
    function(req, usrId, usrPwd, done) {
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT * FROM tbl_manager WHERE m_id = ?', [usrId], function (err, rows) {

            if (err) return done(err);

            if (rows.length) {
                // 여기서 DB로부터 가져온 해싱된 부분과 입력받은 평문을 비교
                bcrypt.compare(usrPwd, rows[0].m_pwd, function(err, res) {
                    if (res) {
                        return done(null, { 'usrId' : usrId, 'usrName' : rows[0].c_name });
                    } else {
                        return done(null, false, {'message' : '패스워드가 올바르지 않습니다.'});
                    }
                });
            } else {
                return done(null, false, {'message' : '해당 로그인 아이디가 없습니다.'});
            }
        });
        conn.end();
    }
));

// login 처리.
router.post('/process', function(req, res) {

    console.log('ADMIN login process router start!');
    console.log('req.body', JSON.stringify(req.body));
    var ss = req.session;

    passport.authenticate('admin-login-local', function (err, user, info) {
//console.log('>>> user is ', JSON.stringify(user));
//console.log('>>> info is ', JSON.stringify(info));
        if (err) {
console.log('err is ', err);
            res.status(500).json(err);
        }
        if (!user) {
console.log('err is 401');
            return res.status(401).json(info.message);
        }

        req.login(user, function (err) {
console.log('err2 is ', err);
console.log('user is ', JSON.stringify(user));
            if (err) return next(err);
            // 세션에 사용자 정보 저장.
            ss.usrId = user.usrId;
            ss.usrName = user.usrName;
            ss.usrLevel = '001';

            //return res.json(user);
            return res.status(200).json({'result' : 'OK', 'user' : user});
        });
    })(req, res);

});


// 로그아웃처리.
router.get('/logout', function(req, res) {
    var ss = req.session;

    var usrId = ss.usrId !=null ? ss.usrId : 'NONE';

    // 삭제처리.
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO tbl_conn_his(cview, cpage, cid, cin_date, cout_date, cip) values("ADMIN", "index", ?,'
        + ' DATE_FORMAT("0000-00-00","%Y-%m-%d %H:%i:%s"), now(), ?);',
        [usrId, ss.usrIp],
        function(err){
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                // 세션 삭제.
                req.session.destroy(function(err){
                    if(err) {
                        console.log(">>> destroy err: " + err);
                        conn.rollback();
                    } else {
                        req.session;
                        conn.commit();
                    }
                    conn.end();
                });
                res.redirect('/admin/login');
            }
        }
    );

});

module.exports = router;