/*
 * 모듈명  : qna.js
 * 설명    : 관리자화면 '1:1문의 관리' 에 대한 모듈.
 * 작성일  : 2017년 10월 25일
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
var config = require('../common/dbconfig');

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
        if (srchType == "qno") {
            addSQL = ' WHERE qno = ?';
        } else if (srchType == "name") {
            addSQL = ' WHERE name LIKE concat(?,"%")';
        } else if (srchType == "title") {
            addSQL = ' WHERE title LIKE concat(?,"%")';
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
        conn.query('SELECT count(*) as cnt from tbl_qna' + addSQL
            + '; SELECT @rownum:=@rownum+1 as num, qno, name, usr_id, email, title, content,'
            + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, case when reply_yn = "Y" then "답변완료" when reply_yn = "N"'
            + ' then "답변중" else "" end  as replyyn FROM tbl_qna, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY qno DESC LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/qna/list', {
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
    if(srchType=="qno") {
        addSQL =  ' WHERE qno = ?';
    } else if(srchType=="name") {
        addSQL =  ' WHERE name LIKE concat(?,"%")';
    } else if(srchType=="title") {
        addSQL =  ' WHERE title LIKE concat(?,"%")';
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
    conn.query('SELECT count(*) as cnt FROM tbl_qna' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, qno, name, usr_id, email, title, content,'
        + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, case when reply_yn = "Y" then "답변완료" when reply_yn = "N"'
        + ' then "답변중" else "" end  as replyyn FROM tbl_qna, (SELECT @rownum:='+skip+') TMP' + addSQL
        + ' ORDER BY qno DESC LIMIT '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/qna/list', {
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

router.get('/new', function(req, res) {
    console.log('routes qna 게시글 작성 화면 호출');
    var ss = req.session;

    res.render('./admin/qna/new', {session : ss});
});

router.post('/save', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;
    var name = req.body.name != null ? req.body.name : '';
    var email = req.body.email != null ? req.body.email : '';
    var telNo = req.body.telNo != null ? req.body.telNo : '';
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';


    conn.query('INSERT INTO qna_tbl(name, email, telno, title, content, ins_dt) VALUES(?, ?, ?, ?, ?, now())',
        [name, email, telNo, title, content],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.json({result : 'OK', session: ss});
            }
        });
});

// 상세 게시글 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리. /admin/qna/view");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('select @rownum:=@rownum+1 as num, qno, name, usr_id, email, telno, title, content,'
        + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, reply_yn as replyyn, reply_name as replynm, reply_comment as reply,'
        + ' DATE_FORMAT(reply_upd_dt, "%Y-%m-%d") as replydate from tbl_qna, (SELECT @rownum:=0) TMP where qno = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes View Result !!!');
                res.render('./admin/qna/view', {title : '1:1문의사항 관리 페이지', result : results[0], session : ss});
            }
        });
    //conn.end();
});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("수정 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('select no, title, content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, writer, count from tbl_qna where no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board Edit Result !!!');
                res.render('./admin/qna/edit', {board : results[0], session : ss});
            }
        });
    //conn.end();
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    console.log("게시글 수정 처리");

    var ss = req.session;
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';
    var writer = req.body.writer != null ? req.body.writer : '';
    var no = req.body.no != null ? req.body.no : '';

    conn.query('UPDATE qna_tbl SET title = ?, content = ?, writer = ?, ins_dt = now() WHERE no = ?',
        [title, content, writer, no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.redirect('/admin/qna');
            }
        });
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from test_qna_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            }
        });
    console.log("게시글 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from test_qna_tbl, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board View Result !!!');
                res.render('./admin/qna/list', {title: '게시글 리스트 화면', board : results, session : ss});
            }
        });
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    //var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var params = req.body['dataList[]'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from test_qna_tbl where no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            }
        );
    }

    res.json({'result' : 'OK'});
});


// 답변글 처리.
router.post('/reply', function(req, res) {
    console.log("QnA 수정 처리");

    var ss = req.session;
    var reqNo = req.body.no ? req.body.no : '';

    conn.query('UPDATE tbl_qna SET reply_yn = "Y", reply_id = ?, reply_name = ?, reply_comment = ?, reply_upd_dt= now() WHERE qno = ?;',
        [ss.usrId, ss.usrName, req.body.replyComment, reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.json({result : 'OK', no: reqNo, session : ss});
            }
        });
});


module.exports = router;