/*
 * 모듈명  : sms.js
 * 설명    : 관리자화면 'SMS 관리' 에 대한 모듈.
 * 작성일  : 2017년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var config = require('../common/dbconfig');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection(config);
conn.connect();

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "no") {
            addSQL = ' WHERE no = ?';
        } else if (srchType == "subject") {
            addSQL = ' WHERE subject LIKE concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM tbl_sms' + addSQL
            + '; SELECT @rownum:=@rownum+1 as num, no, subject as subject, content as content,'
            + ' from_tel_no as fromTelNo, CASE WHEN type = "PAY" THEN "결제" ELSE "" END as type,'
            + ' CASE WHEN use_yn = "Y" THEN "사용" WHEN use_yn = "N" THEN "사용안함"'
            + ' ELSE "" END as useYn, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date'
            + ' FROM tbl_sms, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY no DESC LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/sms/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            })
    } else {
        res.redirect('/admin');
    }
});

router.post('/search', function(req, res) {

    var ss = req.session;

    if(ss.usrType == null || ss.usrType != "S") {
        res.redirect('/');
    }
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if (srchType == "no") {
        addSQL = ' WHERE no = ?';
    } else if (srchType == "subject") {
        addSQL = ' WHERE subject LIKE concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt FROM tbl_sms' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, no, subject as subject, content as content,'
        + ' from_tel_no as fromTelNo, CASE WHEN type = "PAY" THEN "결제" ELSE "" END as type,'
        + ' CASE WHEN use_yn = "Y" THEN "사용" WHEN use_yn = "N" THEN "사용안함"'
        + ' ELSE "" END as useYn, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date'
        + ' FROM tbl_sms, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' ORDER BY no DESC LIMIT ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/sms/list', {
                    rList : results[1],
                    srchType: srchType,
                    srchText : srchText,
                    page : page,
                    maxPage: maxPage,
                    offset: offset,
                    session : ss
                });
            }
        });
});
/**
 * 신규 작성 화면 호출.
 */
router.get('/new', function(req, res) {
    console.log('routes sms 작성 화면 호출');
    var ss = req.session;

    res.render('./admin/sms/new', {session : ss});
});

/**
 * 신규 작성 처리.
 */
router.post('/save', function(req, res) {
    console.log('routes 작성 처리');
    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var subject = req.body.subject != null ? req.body.subject : '';
    var content = req.body.content != null ? req.body.content : '';
    var fromTelNo = req.body.fromTelNo != null ? req.body.fromTelNo : '';
    var type = req.body.type != null ? req.body.type : '';
    var useYn = req.body.useYn != null ? req.body.useYn : '';

    conn.query('INSERT INTO tbl_sms(subject, content, from_tel_no, type, use_yn, ins_dt, ins_id)'
        + ' values(?, ?, ?, ?, ?, now(), ?)',
        [subject, content, fromTelNo, type, useYn, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                //res.json({result : 'OK', session: ss});
                res.redirect('/admin/sms');
            }
        });
});

/**
 * 상세 화면 호출.
 */
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리. /admin/qna/view");
    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('SELECT no, subject, content, from_tel_no, type, use_yn'
        + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as insId'
        + ' FROM tbl_sms WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.render('./admin/sms/view', {result : results[0], session : ss});
            }
        });

});

/**
 * 수정 화면 호출.
 */
router.get('/edit/:no', function(req, res) {
    console.log("수정 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('SELECT no, subject, content, from_tel_no as fromTelNo, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date,'
        + ' type as type, use_yn as useYn, ins_id as insId FROM tbl_sms WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.render('./admin/sms/edit', {result : results[0], session : ss});
            }
        });
    //conn.end();
});

/**
 * 수정 처리.
 */
router.post('/edit', function(req, res) {
    console.log("수정 처리");
    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var subject = req.body.subject != null ? req.body.subject : '';
    var content = req.body.content != null ? req.body.content : '';
    var fromTelNo = req.body.fromTelNo != null ? req.body.fromTelNo : '';
    var type = req.body.type != null ? req.body.type : '';
    var useYn = req.body.useYn != null ? req.body.useYn : '';
    var no = req.body.no != null ? req.body.no : '';

    conn.query('UPDATE tbl_sms SET subject = ?, content = ?, from_tel_no = ?, type = ?, use_yn = ?,'
        + ' upd_dt = now(), upd_id = ? WHERE no = ?',
        [subject, content, fromTelNo, type, useYn, ssId, no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.redirect('/admin/sms');
            }
        });
});

/**
 * 삭제.(get)
 */
router.get('/delete/:no', function(req, res) {
    console.log("게시글 삭제 처리");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('DELETE FROM tbl_sms WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.redirect('/admin/sms');
            }
        });
});

/**
 * 삭제.(post)
 */
router.post('/delete', function(req, res) {
    console.log("삭제 처리(post)");

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('DELETE FROM tbl_sms WHERE no = ?',
            [params[i]],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    console.log('result : ', results.message);
                }
            }
        );
    }

    res.json({'result' : 'OK'});
});


module.exports = router;