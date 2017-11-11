/*
 * 모듈명  : login.js
 * 설명    : '로그인처리' 에 대한 모듈.
 * 작성일  : 2017년 10월 14일
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
var path = require('path');
var passport = require('passport');
//var cookieSession = require('cookie-session');
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var templateDir = path.resolve(__dirname, 'templates3');
var smtpTransport = require('nodemailer-smtp-transport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var router = express.Router();

var SessionSchema = require('./common/SessionSchema');
var config = require('./common/dbconfig');
const saltRounds = 10;

// 이메일 서버 정보 셋팅
var smtpTransport = nodeEmail.createTransport(smtpTransport({
    host : 'smtp.gmail.com',
    secureConnection : false,
    port : 465,
    auth : {
        user : 'jtlab.notifier@gmail.com',
        pass : '0o0o!!!@'
    }
}));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(passport.initialize());

/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;

    res.render('./login', {
        'title': 'adpay.co.kr',
        'session' : ss
    });
});

passport.serializeUser(function(user, done) {
    done(null, user.usrId);
});

passport.deserializeUser(function(usrId, done) {
    done(null, usrId);
});

passport.use('login-local', new LocalStrategy({
        usernameField: 'usrId',
        passwordField: 'usrPwd',
        passReqToCallback: true
    },
    function(req, usrId, usrPwd, done) {
console.log('!!! function call ');
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT * FROM tbl_user WHERE c_id = ?', [usrId], function (err, rows) {

            if (err) return done(err);

            if (rows.length) {
                // 여기서 DB로부터 가져온 해싱된 부분과 입력받은 평문을 비교
                bcrypt.compare(usrPwd, rows[0].c_pwd, function(err, res) {
                    if (res) {
                        return done(null, { 'usrId' : usrId, 'usrName' : rows[0].c_name, 'usrEmail' : rows[0].c_email });
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

    console.log('USER login process router start!');
    //console.log('req.body', JSON.stringify(req.body));
    var ss = req.session;

    passport.authenticate('login-local', function (err, user, info) {
        console.log('>>> user is ', JSON.stringify(user));
        console.log('>>> info is ', JSON.stringify(info));
        if (err) {
            console.log('err is ', err);
            res.status(500).json(err);
        }
        if (!user) {
            console.log('err is 401');
            return res.status(200).json({'result' : 'fail', 'msg' : info.message});
        }

        req.login(user, function (err) {
            console.log('err2 is ', err);
            console.log('user is ', JSON.stringify(user));
            if (err) return next(err);
            // 세션에 사용자 정보 저장.
            ss.usrId = user.usrId;
            ss.usrNm = user.usrName;
            ss.usrEmail = user.usrEmail;
            ss.usrLevel = '001';

            //return res.json(user);
            return res.status(200).json({'result' : 'OK', 'user' : user, 'session' : ss});
        });
    })(req, res);

});


// 로그아웃처리.
router.get('/logout', function(req, res) {
    var ss = req.session;

    var usrId = ss.usrId !=null ? ss.usrId : 'NONE';
    // 로그인 IP 정보 취득.
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    // 삭제처리.
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO tbl_conn_his(cview, cpage, cid, cin_date, cout_date, cip) values("ADPAY", "index", ?,'
        + ' DATE_FORMAT("0000-00-00","%Y-%m-%d %H:%i:%s"), now(), ?);',
        [usrId, ipAddress],
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
                res.redirect('/login');
            }
        }
    );

});

/**
 * 아이디/패스워드 찾기 화면 호출.
 */
router.get('/findId', function(req, res, next) {
    console.log('아이디/패스워드 찾기 화면호출.');
    var ss = req.session;

    res.status(200).render('./searchIdPwd', {'session' : ss});
});

/**
 * 아이디 조회.
 */
router.post('/find/getid', function(req, res, next) {
    var ss = req.session;
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var SQL = 'SELECT COUNT(c_id) as cnt FROM tbl_user WHERE c_id = ?;';
    var SQL1 = ' SELECT c_id as id FROM tbl_user WHERE c_id = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL+SQL1, [usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var count = results[0][0].cnt;
                var result = '';
                if(count > 0) {
                    var getId = results[1][0].id;
                    if (usrId == getId) {
                        result = 'OK';
                    }
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
        });
    conn.end();

});

/**
 * 아이디 찾기.
 */
router.post('/find/id', function(req, res, next) {
    var ss = req.session;
    var usrNm = req.body.usrNm !=null ? req.body.usrNm : '';
    var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
    var SQL = 'SELECT COUNT(c_id) as cnt FROM tbl_user WHERE c_name = ? AND c_email = ?;';
    var SQL1 = ' SELECT c_id as id FROM tbl_user WHERE c_name = ? AND c_email = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL+SQL1, [usrNm, usrEmail, usrNm, usrEmail],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var result = '';
                if(results[0][0].cnt > 0) {
                    var id = results[1][0].id;
                    var content = usrNm + " 님의 아이디는 '" + id + "' 입니다.";

                    // 관리자에게 이메일 전송처리.
                    sendMail(usrEmail, usrNm, content);

                    result = 'OK';
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
        });
    conn.end();

});

/**
 * 비밀번호 찾기.
 */
router.post('/find/pwd', function(req, res, next) {
    var ss = req.session;
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrNm = req.body.usrNm !=null ? req.body.usrNm : '';
    var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
    var SQL = 'SELECT COUNT(c_id) as cnt FROM tbl_user WHERE c_name = ? AND c_id = ? AND c_email = ?;';
    var SQL2 = 'UPDATE tbl_user SET c_pwd = ? WHERE c_name = ? AND c_id = ? AND c_email = ?;';
    var tmpPwd = randomString(6, 'an');
console.log('tmpPwd', tmpPwd);

    bcrypt.hash(tmpPwd, saltRounds, function (err, hash) {
        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL + SQL2, [usrNm, usrId, usrEmail, hash, usrNm, usrId, usrEmail],
            function (err, results) {
                if (err) {
                    console.log('err : ', err);
                } else {
                    var result = '';
//console.log('results[0][0].cnt : ', results[0][0].cnt );
                    if (results[0][0].cnt > 0) {
                        var content = usrNm + " 님의 임시 비밀번호는 '" + tmpPwd + "' 입니다. 확인하시고 다시 로그인 하시면 비밀번호를 변경해주세요.";

                        // 관리자에게 이메일 전송처리.
                        sendMail(usrEmail, usrNm, content);

                        result = 'OK';
                    }
                    res.status(200).json({'result': result, 'session': ss});
                }
            });
        conn.end();
    });

});

/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
function sendMail(receiverEmail, receiver, content) {

    var title = '[ADPAY] 아이디/비밀번호 찾기 안내';
    var fromEmail = '[ADPAY] < jtlab.notifier@gmail.com >';
    var toEmail = '['+ receiver+'] '+ '< ' + receiverEmail +' >';
    var ccEmail = '< logger@jt-lab.co.kr >';
    var fromName = '[ADPAY] 관리자';
    var toName = receiver;

    var template = new EmailTemplate(path.join(templateDir, 'newsletter'));
    // HTML 에 들어갈 문자 변수 셋팅.
    var locals = {
        title : title,
        fromEmail : fromEmail,
        toEmail : toEmail,
        fromName : fromName,
        toName : toName,
        content : content
    };
    template.render(locals, function(err, results) {
        if(err) {
            return console.log(err);
        }
        console.log('results : ', JSON.stringify(results));

        smtpTransport.sendMail({
            from : fromEmail,
            to : toEmail,
            bc : ccEmail,
            subject: title,
            html : results.html
        }, function(err, responseStatus) {
            if(err) {
                console.error(err);
                //res.send('error');
            } else {
                console.log(responseStatus.message);
                //res.end('sent');
            }
        })
    });

}

/*
 * RANDOM STRING GENERATOR
 *
 * Info:      http://stackoverflow.com/a/27872144/383904
 * Use:       randomString(length [,"A"] [,"N"] );
 * Default:   return a random alpha-numeric string
 * Arguments: If you use the optional "A", "N" flags:
 *            "A" (Alpha flag)   return random a-Z string
 *            "N" (Numeric flag) return random 0-9 string
 */
function randomString(len, an){
    an = an&&an.toLowerCase();
    var str="", i=0, min=an=="a"?10:0, max=an=="n"?10:62;
    for(;i++<len;){
        var r = Math.random()*(max-min)+min <<0;
        str += String.fromCharCode(r+=r>9?r<36?55:61:48);
    }
    return str;
}

module.exports = router;
