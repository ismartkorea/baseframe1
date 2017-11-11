/*
 * 모듈명  : announce.js
 * 설명    : 사용자 화면 메뉴 '공지사항' 에 대한 모듈.
 * 작성일  : 2017년 10월 11일
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

var config = require('./common/dbconfig');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection(config);
conn.connect();

// 게시글 리스트 호출.
router.get('/', function(req, res) {
    console.log('공지사항 리스트 호출');

    var ss = req.session;
    console.log(">>> usrLevel = " + ss.usrLevel);

    var srchType = req.query.srchType != null ? req.query.srchType : "";
    var srchText = req.query.srchText != null ? req.query.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if (srchType == "title") {
        addSQL = ' WHERE title LIKE concat("%", ?, "%")';
    } else if (srchType == "writer") {
        addSQL = ' WHERE ins_id LIKE concat(?,"%")';
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
    conn.query('SELECT count(*) as cnt FROM tbl_announce' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, no as no, CONCAT(LEFT(title, "10"),"...") as title, content as content, writer as writerNm,'
        + ' cate_cd as cateCd, cate_nm as cateNm, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as insId,'
        + ' count as count FROM tbl_announce, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' ORDER BY no DESC LIMIT ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./announce/list', {
                    'rList': results[1],
                    'srchType': srchType,
                    'srchText': srchText,
                    'page': page,
                    'maxPage': maxPage,
                    'offset': offset,
                    'session': ss
                });
            }
        });

});

router.post('/search', function(req, res) {
    console.log('routes 게시글 검색 처리 호출');
    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' WHERE title LIKE concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' WHERE writer LIKE concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    conn.query('SELECT count(*) as cnt FROM tbl_announce' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, no as no, CONCAT(LEFT(title, "10"),"...") as title, content as content, writer as writer,'
        + ' cate_cd as cateCd, cate_nm as cateNm, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date,'
        + ' ins_id as insId, count as count FROM tbl_announce, (SELECT @rownum:='+skip+') TMP'+ addSQL
        + ' ORDER BY no DESC LIMIT '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./announce/list', {
                    board : results[1],
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
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./announce/new', {session : ss});
});

router.post('/save', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    var ssId = ss.usrId != null ? ss.usrId : '';
    var title = req.body.title !=null ? req.body.title : '';
    var content = req.body.content !=null ? req.body.content : '';
    var writer = req.body.writer !=null ? req.body.writer : '';
    var cateCd = req.body.cateCd !=null ? req.body.cateCd : '';
    var cateNm = req.body.cateNm !=null ? req.body.cateNm : '';

    conn.query('INSERT INTO tbl_announce(title, content, writer, cate_cd, cate_nm, ins_dt, ins_id)'
        + ' VALUES(?, ?, ?, ?, ?, now(), ?)',
        [title, content, writer, cateCd, cateNm, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                res.redirect('/announce/');
            }
        });
});

// 수정 화면 호출.
router.get('/edit/:no', function(req, res) {

    var ss = req.session;
    var no = req.params.no !=null ? req.params.no : '';

    console.log("수정 화면 호출처리.");
    conn.query('SELECT @rownum:=@rownum+1 as num, no, title, content, writer, cate_cd as cateCd, cate_nm as cateNm,'
        + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as insId, count as count'
        + ' FROM tbl_announce, (SELECT @rownum:=0) TMP WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes announce Edit View !!!');

                res.render('./announce/edit', {board : results[0], session : ss});
            }
        });
});

// 게시글 상세 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    conn.query('UPDATE tbl_announce SET count = (select * from (select count+1 from tbl_announce where no = ?) as tmp) WHERE no = ?',
        [no, no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                console.log('results : ', results.message);


                conn.query('SELECT no, title, content, writer, cate_cd as cateCd, cate_nm as cateNm,'
                    + ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as insId, count as count'
                    + ' FROM tbl_announce WHERE no = ?',
                    [no],
                    function(err, results) {
                        if(err) {
                            console.log('error : ', err.message);
                        } else {
                            console.log('routes announce View !!!');

                            res.render('./announce/view', {
                                'result' : results[0],
                                'session' : ss
                            });
                        }
                    });
            }
        }
    );
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    console.log("게시글 수정 처리");

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var title = req.body.title != null ? req.body.title : '';
    var content = req.body.content != null ? req.body.content : '';
    var writer = req.body.writer != null ? req.body.writer : '';
    var cateCd = req.body.cateCd != null ? req.body.cateCd : '';
    var cateNm = req.body.cateNm != null ? req.body.cateNm : '';
    var no = req.body.no != null ? req.body.no : '';

    conn.query('UPDATE tbl_announce SET title = ?, content = ?, writer = ?, cate_cd = ?, cate_nm = ?, ins_dt = now(), ins_id = ? WHERE no = ?',
        [title, content, writer, cateCd, cateNm, ssId, no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                res.redirect('/announce/view/'+no);
            }
        }
    );

});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {
    console.log("게시글 삭제 처리");
    var ss = req.session;
    var no = req.params.no;

    conn.query('DELETE FROM tbl_announce WHERE no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                res.redirect('/announce');
            }
        }
    );

});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {
    console.log("게시글 삭제 처리");
    var ss = req.session;

    var params = req.body['dataList[]'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('DELETE FROM tbl_announce WHERE no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});


module.exports = router;