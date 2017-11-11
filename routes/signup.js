var express = require('express');
var path = require('path');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var config = require('./common/dbconfig');
var Request = require('request');
var async = require('async');

var router = express.Router();

const saltRounds = 10;
const IMP_KEY = '6727859979366252';
const IMP_SECRET = 'npEtTRfzAuks0hrLfQpR5V3d4kqJXkZlJEPDv4c6zxzAO1l4RKVWFZaKkBtiVtDF8siExvK72kHRl3Vc';


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(passport.initialize());

// Routing
router.get('/', function(req, res) {
    var ss = req.session;

    res.render('./signup/signupForm', {
        'title' : '신규 회원 신청 화면',
        'session' : ss
    });
});

passport.serializeUser(function(user, done) {
    done(null, user.usrId);
});

passport.deserializeUser(function(usrId, done) {
    done(null, usrId);
});

// 성공했을때 리다이렉트 시키는 부분
router.post('/process', passport.authenticate('user-local', {
    successRedirect: '/login',
    failureRedirect: '/signup',
    failureFlash: true
}));

passport.use('user-local', new LocalStrategy({
        usernameField: 'usrId',
        passwordField: 'usrPwd',
        passReqToCallback: true
    },
    function(req, usrId, usrPwd, done) {

        console.log('req.body : ', JSON.stringify(req.body));

        var usrType = req.body.usrType !=null ? req.body.usrType : '';
        var usrName = req.body.usrName !=null ? req.body.usrName : '';
        var usrAddr1 = req.body.usrAddr1 !=null ? req.body.usrAddr1 : '';
        var usrAddr2 = req.body.usrAddr2 !=null ? req.body.usrAddr2 : '';
        var usrPostNo = req.body.usrPostNo !=null ? req.body.usrPostNo : '';
        var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
        var usrSex = req.body.usrSex !=null ? req.body.usrSex : '';
        var usrBirth = req.body.usrBirth !=null ? req.body.usrBirth : '';
        var usrTelNo = req.body.usrTelNo !=null ? req.body.usrTelNo : '';
        var usrTelNo1 = req.body.usrTelNo1 !=null ? req.body.usrTelNo1 : '';
        var usrTelNo2 = req.body.usrTelNo2 !=null ? req.body.usrTelNo2 : '';
        var usrTelNo3 = req.body.usrTelNo3 !=null ? req.body.usrTelNo3 : '';
        var usrCellNo = req.body.usrCellNo !=null ? req.body.usrCellNo : '';
        var usrCellNo1 = req.body.usrCellNo1 !=null ? req.body.usrCellNo1 : '';
        var usrCellNo2 = req.body.usrCellNo2 !=null ? req.body.usrCellNo2 : '';
        var usrCellNo3 = req.body.usrCellNo3 !=null ? req.body.usrCellNo3 : '';
        var usrEmailYn = req.body.usrEmailYn !=null ? req.body.usrEmailYn : '';
        var usrSmsYn = req.body.usrSmsYn !=null ? req.body.usrSmsYn : '';
        var usrTermYn = req.body.usrTermYn !=null ? req.body.usrTermYn : '';
        var usrInfoYn = req.body.usrInfoYn !=null ? req.body.usrInfoYn : '';
        var usrLevel = req.body.usrLevel !=null ? req.body.usrLevel : '';
        var usrArea = req.body.usrArea !=null ? req.body.usrArea : '';
        var usrCertYn = req.body.usrCertYn !=null ? req.body.usrCertYn : '';
        //console.log('usrEmail = ', usrEmail);

        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT * FROM tbl_user WHERE c_id = ?', [usrId], function (err, rows) {
            if (err) {
                console.log('err : ', err);
                return done(err);
            }

            if (rows.length) {
                console.log('rows.length : ', rows.length);

                return done(null, false, {'result' : 'fail', 'message': 'your id is already used'});
            } else {
                bcrypt.hash(usrPwd, saltRounds, function (err, hash) {

                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query('INSERT INTO tbl_user (c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,'
                        + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3,'
                        + ' c_email_yn, c_sms_yn, c_term_yn, c_inf_use_yn, c_user_tp, c_auth_level, c_area, c_cert_yn,'
                        + ' insert_dt, insert_usr, update_dt, update_usr) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'
                        + ' ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
                        [
                            usrId, hash, usrName, usrAddr1, usrAddr2, usrPostNo, usrEmail, usrSex, usrBirth, usrTelNo,
                            usrTelNo1, usrTelNo2, usrTelNo3, usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3, usrEmailYn,
                            usrSmsYn, usrTermYn, usrInfoYn, usrType, usrLevel, usrArea, usrCertYn, usrId, usrId
                        ],
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

/**
 * 가입정보 조회.
 */
router.get('/view', function(req, res) {
    console.log("멤버 정보 조회 처리");

    var ss = req.session;
    var ssId = ss.usrId !=null ? ss.usrId : '';

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT c_no as no, c_id as id, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email,'
        + ' SUBSTRING(c_birth,1,4) as year,SUBSTRING(c_birth,5,2) as month, SUBSTRING(c_birth,7,2) as day,'
        + ' c_tel_no as telno, c_tel_no1 as telno1, c_tel_no2 as telno2, c_tel_no3 as telno3,'
        + ' c_cell_no as cellno, c_cell_no1 as cellno1, c_cell_no2 as cellno2, c_cell_no3 as cellno3,'
        + ' c_email_yn as emailyn, c_inf_use_yn as infoyn, c_user_tp as usertype, c_auth_level as level, c_auth_cd as authcd,'
        + ' insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm FROM tbl_user WHERE c_id = ?',
        [ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes member Edit Result !!!');

                res.render('./signup/updateForm', {result : 'OK', info : results[0], session : ss});
            }
        });
    conn.end();

});

/**
 * 회원정보 수정처리.
 */
router.post('/edit', function(req, res) {
    console.log("멤버 수정 처리");
    
    var ss = req.session;
    var ssId = ss.usrId !=null ? ss.usrId : '';
    var usrId = req.body.usrId != null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd != null ? req.body.usrPwd : '';
    var usrName = req.body. usrName != null ? req.body.usrName : '';
    var usrAddr1 = req.body.usrAddr1 != null ? req.body.usrAddr1 : '';
    var usrAddr2 = req.body.usrAddr2 != null ? req.body.usrAddr2 : '';
    var usrPostNo = req.body.usrPostNo != null ? req.body.usrPostNo : '';
    var usrEmail = req.body.usrEmail != null ? req.body.usrEmail : '';
    var usrBirth = req.body.usrBirth !=null ? req.body.usrBirth : '';
    var usrTelNo = req.body.usrTelNo != null ? req.body.usrTelNo : '';
    var usrTelNo1 = req.body.usrTelNo1 != null ? req.body.usrTelNo1 : '';
    var usrTelNo2 = req.body.usrTelNo2 != null ? req.body.usrTelNo2 : '';
    var usrTelNo3 = req.body.usrTelNo3 != null ? req.body.usrTelNo3 : '';
    var usrCellNo = req.body.usrCellNo != null ? req.body.usrCellNo : '';
    var usrCellNo1 = req.body.usrCellNo1 != null ? req.body.usrCellNo1 : '';
    var usrCellNo2 = req.body.usrCellNo2 != null ? req.body.usrCellNo2 : '';
    var usrCellNo3 = req.body.usrCellNo3 != null ? req.body.usrCellNo3 : '';
    var usrEmailYn = req.body.usrEmailYn != null ? req.body.usrEmailYn : '';
    var usrInfoYn = req.body.usrInfoYn != null ? req.body.usrInfoYn : '';
    var usrType = req.body.usrType != null ? req.body.usrType : '';
    var usrAuthLvl = req.body.usrAuthLvl != null ? req.body.usrAuthLvl : '';


    bcrypt.hash(usrPwd, saltRounds, function (err, hash) {
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('UPDATE tbl_user SET c_id = ?, c_pwd = ?, c_name = ?,'
            + ' c_addr1 = ?, c_addr2 = ?, c_postno = ?, c_email = ?, c_birth = ?, c_tel_no = ?,'
            + ' c_tel_no1 = ?, c_tel_no2 = ?, c_tel_no3 = ?, c_cell_no = ?, c_cell_no1 = ?, c_cell_no2 = ?, c_cell_no3 = ?,'
            + ' c_email_yn = ?, c_inf_use_yn = ?, c_user_tp = ?, c_auth_level = ?, update_dt = now(), update_usr = ?'
            + ' WHERE c_id = ?',
            [
                usrId, hash, usrName, usrAddr1, usrAddr2, usrPostNo, usrEmail, usrBirth, usrTelNo, usrTelNo1, usrTelNo2, usrTelNo3,
                usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3, usrEmailYn, usrInfoYn, usrType, usrAuthLvl, ssId, ssId
            ],
            function(err, result) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err});
                } else {
                    console.log('result : ' + result.message);

                    res.json({result:'OK', session : ss});
                }
            }
        );
        conn.commit();
        conn.end();
    });

});

/**
 * 본인인증결과 확인.
 */
router.post('/cert', function(req, res) {
    console.log('본인인증결과 확인 처리.');

    var ss = req.session;
    var impUid = req.body.impUid != null ? req.body.impUid : '';
    var merchantUid = req.body.merchantUid != null ? req.body.merchantUid : '';

    async.waterfall([

        function(callback) {
            var params = {
                "imp_key": IMP_KEY,
                "imp_secret": IMP_SECRET
            };
            // 전송 처리.
            Request.post({url:'https://api.iamport.kr/users/getToken', formData: params},function(err, response, body) {
                if(!err && response.statusCode == '200') {
                    var result1 = JSON.parse(body);
                    token = result1.response.access_token;

                    callback(null, token);
                } else {
                    console.log('error : ', err.message);
                }
            });
        },
        function(retToken, callback) {
            console.log('call function2');
//console.log('retToken : ', retToken);
            var url = 'https://api.iamport.kr/certifications/'+impUid+'?_token='+retToken;
            //console.log('url = ' , url);

            // 전송 처리.
            Request.get({url : url}, function (err, response, body) {
                console.log('body : ', JSON.parse(body));
                var result2 = JSON.parse(body);
                console.log('response : ', result2.response);

                if (!err && response.statusCode == 200) {
                    res.json({'result' : 'OK', 'data': result2.response, 'session': ss});
                } else {
                    res.json({'result' : 'FAIL', 'message': result2.message, 'session': ss});
                }
                callback(null);
            });
        }
    ], function (err, result) {
        if(err) {
            console.log('final end err : ', err);
        } else {
            console.log('final end results : ', result);
        }
    });

});


module.exports = router;
