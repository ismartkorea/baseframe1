/*
 * 모듈명  : ascenter.js
 * 설명    : '고객센터' 에 대한 모듈.
 * 작성일  : 2017년 10월 17일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();
// db confing import
var config = require('./common/dbconfig');
// routes use set
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

// DB Connect
var conn = mysql.createConnection(config);
conn.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;

    res.render('./ascenter', {
        'session' : ss
    });
});

// 문의 내용 저장 처리.
router.post('/save', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;
    var name = req.body.name != null ? req.body.name : '';
    var usrId = req.body.usrId != null ? req.body.usrId : '';
    var email = req.body.email != null ? req.body.email : '';
    var telNo = req.body.telNo != null ? req.body.telNo : '';
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';

    conn.query('INSERT INTO tbl_qna(name, usr_id, email, telno, title, content, ins_dt) VALUES(?, ?, ?, ?, ?, ?, now())',
        [name, usrId, email, telNo, title, content],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.json({result : 'OK', session: ss});
            }
        });
    conn.end();
});

/**
 * 1:1 문의 요청 화면 호출.
 */
router.get('/inquire', function(req, res) {
    var ss = req.session;

    conn.query('SELECT @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count'
        + ' FROM tbl_announce, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./ascenter', { rList : results, session : ss});
            }
        });
    conn.end();
});

/**
 *
 */
router.get('/inquire/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('UPDATE tbl_announce SET count = (select * from (select count+1 from tbl_announce where no = ?) as tmp) WHERE no = ?',
        [req.params.no,req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                // 리스트 조회 처리.
                conn.query('SELECT no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count FROM tbl_announce WHERE no = ?',
                    [req.params.no],
                    function(err, results) {
                        if(err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error : err, session: ss});
                        } else {
                            console.log('routes view Result !!!');
                            console.dir(results);

                            res.render('./ascenterPopup', {title : "공지사항 상세", result : results[0], session : ss});
                        }
                    });
                conn.end();
            }
        }
    );
    conn.end();


});

module.exports = router;
