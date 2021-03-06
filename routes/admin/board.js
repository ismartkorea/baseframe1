/*
 * 모듈명  : board.js
 * 설명    : 관리자화면 메뉴 '프로그램 버그 신고' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
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

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

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
        conn.query('SELECT count(*) as cnt FROM dev_board_inf_tbl ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,'
            + ' x.no as no, concat(LEFT(x.title,15),"...") as title, x.content as content, DATE_FORMAT(date, "%Y-%m-%d") as date, x.writer as writer,'
            + ' x.count as count, (select count(rno) from dev_comment_inf_tbl where bno = x.no) as rCount'
            + ' FROM dev_board_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by x.no desc limit ' + skip + ', ' + limit + ";",
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

                    res.render('./admin/board/list', {
                        title: '게시글 화면',
                        board: results[1],
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
    conn.query('SELECT count(*) as cnt FROM dev_board_inf_tbl ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,'
        + ' x.no as no, concat(LEFT(x.title,15),"...") as title, x.content as content, DATE_FORMAT(date, "%Y-%m-%d") as date, x.writer as writer,'
        + ' x.count as count, (select count(rno) from dev_comment_inf_tbl where bno = x.no) as rCount'
        + ' FROM dev_board_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
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

                res.render('./admin/board/list', {title: '게시글 화면', board : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});


router.get('/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/board/new', {title: '게시글 작성 화면', session : ss});
});

router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    conn.query('insert into dev_board_inf_tbl(title, content, date, writer) values(?, ?, now(), ?)',
        [req.body.title, req.body.content, req.body.writer],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/board');
            }
        });
});

// 상세 게시글 화면 호출.
router.get('/view/:no', function(req, res) {

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    conn.query('update dev_board_inf_tbl set count = (select * from (select count+1 from dev_board_inf_tbl where no = ?) as tmp) where no = ?',
        [req.params.no,req.params.no],
        function(err) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            }
        }
    );

    console.log("뷰 조회.");
    // 조회.
    conn.query('select no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from dev_board_inf_tbl where no = ?;'
        + ' select count(*) cnt from dev_comment_inf_tbl where bno = ?;'
        + ' select rno as no, bno as bno, comment as comment, DATE_FORMAT(ins_dt,"%Y-%m-%d") as date, ins_id as id,'
        + ' ins_nm as name from dev_comment_inf_tbl where bno = ?;',
        [req.params.no, req.params.no, req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board View !!!');
                //console.log(">>> boards = " + JSON.stringify(results[0]));
                //console.log(">>> boards = " + JSON.stringify(results[0][0].title));
                //console.log(">>> reply = " + JSON.stringify(results[1]));
                //console.log(">>> list = " + JSON.stringify(results[2]));
                res.render('admin/board/view', {board : results[0][0], reply : results[1][0], list : results[2], session : ss});
            }
        }
    );

});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;

    conn.query('select no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from dev_board_inf_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board Edit Result !!!');
                res.render('./admin/board/edit', {title: '수정화면', board : results[0], session : ss});
            }
        });
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update dev_board_inf_tbl set title = ?, content = ?, writer = ?, date = now() where no = ?',
        [req.body.title, req.body.content, req.body.writer, req.body.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect("/admin/board/view/"+req.body.no);
            }
        });
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    //var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from dev_board_inf_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/board');
            }
        });
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var ss = req.session;

    //var params = JSON.stringify(req.body['dataList']).split(','); // length 체크용.
    var params = req.body['dataList'];
    //console.log(">>> get params = " + params);
    //console.log(">>> get params length = " + params.length);

        for (var i = 0; i < params.length; i++) {
            console.log(">>>> params2[" + i + "] = " + params[i]);
            conn.query('delete from dev_board_inf_tbl where no = ?',
                [params[i]],
                function (err) {
                    if (err) {
                        console.log('error : ', err.message);
                        res.render('error', {message: err.message, error : err, session: ss});
                    }
                });
        }

    res.json({'result' : 'OK'});
});

// 서브 코멘트 신규 저장.
router.post('/comment/new', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('insert into dev_comment_inf_tbl(bno, comment, ins_dt, ins_id, ins_nm) values(?, ?, now(), ?, ?)',
        [req.body.no, req.body.comment, ss.usrId, ss.usrName],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : "OK", session: ss});
            }
        }
    );

});

// 서브 코멘트 삭제.
router.post('/comment/del', function(req, res) {

    var ss = req.session;
    //console.log(">>> rno = " + req.body.rno);
    //console.log(">>> bno = " + req.body.bno);
    //console.log(">>> uid = " + req.body.uid);

    // 삭제 처리.
    conn.query('delete from dev_comment_inf_tbl where rno = ? and bno = ? and ins_id = ?',
        [req.body.rno, req.body.bno, req.body.uid],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                conn.commit();
                res.json({result : "OK", session: ss});
            }
        }
    );

});

module.exports = router;