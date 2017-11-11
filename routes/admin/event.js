/*
 * 모듈명  : event.js
 * 설명    : 관리자화면 메뉴 '이벤트 게시판 관리' 에 대한 모듈.
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

        if (srchType == "title") {
            addSQL = ' WHERE x.title like concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' WHERE x.writer like concat(?,"%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //console.log(">>> skip = " + skip);

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM tbl_event ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,'
            + ' x.no as no, concat(LEFT(x.title,15),"...") as title, x.content as content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, x.writer as writer,'
            + ' x.count as count, (select count(rno) from tbl_event_comment where bno = x.no) as rCount'
            + ' FROM tbl_event x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY x.no desc LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    //console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    //console.log(">>> count = " + count);
                    var maxPage = Math.ceil(count / limit);
                    //console.log(">>> maxPage = " + maxPage);

                    res.render('./admin/event/list', {
                        title: '게시글 화면',
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });
    } else {
        res.redirect('/admin');
    }
});

// 게시판 검색 처리.
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' WHERE x.title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' WHERE x.writer like concat(?,"%")';
    }

    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;
    //console.log(">>> skip = " + skip);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt FROM tbl_event ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,'
        + ' x.no as no, concat(LEFT(x.title,15),"...") as title, x.content as content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, x.writer as writer,'
        + ' x.count as count, (select count(rno) from tbl_event_comment where bno = x.no) as rCount'
        + ' FROM tbl_event x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' order by x.no desc limit ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                //console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                //console.log(">>> count = " + count);
                var maxPage = Math.ceil(count/limit);
                console.log(">>> maxPage = " + maxPage);

                res.render('./admin/event/list', {
                    title: '게시글 화면',
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
 * 이벤트 신규 화면 호출.
 */
router.get('/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;

    res.render('./admin/event/new', {title: '이벤트 신규 화면', session : ss});
});

/**
 * 저장 처리.
 */
router.post('/save', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';
    var writer = req.body.writer != null ? req.body.writer : '';

    conn.query('INSERT INTO tbl_event(title, content, writer, ins_dt, ins_id) VALUES(?, ?, ?, now(), ?)',
        [title, content, writer, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('result : ', results.message);

                res.redirect('/admin/event');
            }
        });
});

/**
 * 상세 화면 호출.
 */
router.get('/view/:no', function(req, res) {
    console.log("상세조회 처리");
    
    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT no, title, content, writer, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, count FROM tbl_event WHERE no = ?;'
        + ' SELECT count(*) cnt FROM tbl_event_comment WHERE bno = ?;'
        + ' SELECT rno as no, bno as bno, comment as comment, DATE_FORMAT(ins_dt,"%Y-%m-%d") as date, ins_id as id'
        + ' FROM tbl_event_comment WHERE bno = ?;',
        [no, no, no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                res.render('./admin/event/view', {
                    result : results[0][0],
                    reply : results[1][0],
                    list : results[2],
                    session : ss
                });
            }
        }
    );

});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("수정 화면 호출.");
    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('SELECT no, title, content, writer, DATE_FORMAT(date, "%Y-%m-%d") as date, count FROM tbl_event WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes event Edit Result !!!');

                res.render('./admin/event/edit', {
                    title: '수정화면',
                    result : results[0],
                    session : ss
                });
            }
        });
});

// 게시글 수정 처리.
router.post('/edit', function(req, res) {
    console.log("수정 처리");

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var no = req.body.no != null ? req.body.no : '';
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';
    var writer = req.body.writer != null ? req.body.writer : '';

    conn.query('UPDATE tbl_event SET title = ?, content = ?, writer = ?, ins_dt = now() ins_id = ? WHERE no = ?',
        [title, content, writer, ssId, no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('result : ', results.message);

                res.redirect("/admin/event/view/"+no);
            }
        });
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('DELETE FROM tbl_event WHERE no = ?', [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('result : ', results.message);

                res.redirect('/admin/event');
            }
        });
});

/**
 * 다중 삭제 처리.
 */
router.post('/delete', function(req, res) {
    console.log("삭제 처리");

    var ss = req.session;
    var params = req.body['dataList[]'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params2[" + i + "] = " + params[i]);
        conn.query('DELETE FROM tbl_event WHERE no = ?', [params[i]],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    console.log('result : ', results.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

/**
 * 코멘트 저장 처리.
 */
router.post('/comment/save', function(req, res) {

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var no = req.body.no != null ? req.body.no : '';
    var comment = req.body.comment != null ? req.body.comment : '';

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('INSERT INTO tbl_event_comment(bno, comment, ins_dt, ins_id) VALUES(?, ?, now(), ?, ?)',
        [no, comment, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('result : ', results.message);

                res.json({result : "OK", session: ss});
            }
        }
    );

});

/**
 * 코멘트 삭제 처리.
 */
router.post('/comment/delete', function(req, res) {
    console.log('코멘트 삭제 처리.');
    var ss = req.session;
    var rno = req.body.rno != null ? req.body.rno : '';
    var bno = req.body.bno != null ? req.body.bno : '';
    var uid = req.body.uid != null ? req.body.uid : '';

    // 삭제 처리.
    conn.query('DELETE FROM tbl_event_comment WHERE rno = ? AND bno = ? AND ins_id = ?',
        [rno, bno, uid],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('result : ', results.message);

                conn.commit();
                res.json({result : "OK", session: ss});
            }
        }
    );

});

module.exports = router;