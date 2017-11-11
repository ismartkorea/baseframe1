/*
 * 모듈명  : menu.js
 * 설명    : 관리자화면 메뉴 '메뉴 관리' 에 대한 모듈.
 * 작성일  : 2017년 10월 13일
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

// 메뉴 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";

        if (srchType == "name") {
            addSQL = ' WHERE x.menu_nm like concat("%", ?, "%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //console.log(">>> skip = " + skip);
        var SQL = 'SELECT count(*) as cnt FROM tbl_menu ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,';
        SQL += 'x.menu_no as menuNo, x.menu_nm as menuNm, x.menu_link as menuLink, x.menu_sort_no as menuSortNo,';
        SQL += 'DATE_FORMAT(x.ins_dt, "%Y-%m-%d") as date, x.ins_Id as writer';
        SQL += ' FROM tbl_menu x, (SELECT @rownum:=' + skip + ') TMP' + addSQL;
        SQL += ' ORDER BY x.ins_dt DESC LIMIT ' + skip + ', ' + limit + ";";

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query(SQL, [srchText, srchText],
            function (err, results) {
                if (err) {
                    //console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    //console.log(">>> count = " + count);
                    var maxPage = Math.ceil(count / limit);
                    //console.log(">>> maxPage = " + maxPage);

                    res.render('./admin/menu/list', {
                        'title': '메뉴 관리 화면',
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
    }

    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;
    //console.log(">>> skip = " + skip);

    var SQL = 'SELECT count(*) as cnt FROM tbl_menu ' + addSQL + '; SELECT @rownum:=@rownum+1 as num,';
    SQL += 'x.menu_no as menuNo, x.menu_nm as menuNm, x.menu_link as menuLink, x.menu_sort_no as menuSortNo,';
    SQL += 'DATE_FORMAT(x.ins_dt, "%Y-%m-%d") as date, x.ins_Id as writer';
    SQL += ' FROM tbl_menu x, (SELECT @rownum:=' + skip + ') TMP' + addSQL;
    SQL += ' ORDER BY x.ins_dt DESC LIMIT ' + skip + ', ' + limit + ";";

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query(SQL, [srchText, srchText],
        function(err, results) {
            if(err) {
                //console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                //console.log(">>> count = " + count);
                var maxPage = Math.ceil(count/limit);
                console.log(">>> maxPage = " + maxPage);

                res.render('./admin/board/list', {
                    'title': '메뉴 관리 화면',
                    'rList' : results[1],
                    'srchType': srchType,
                    'srchText' : srchText,
                    'page' : page,
                    'maxPage': maxPage,
                    'offset': offset,
                    'session' : ss
                });
            }
        });
});

/**
 *  메뉴 신규 화면 호출.
 */
router.get('/new', function(req, res) {
    console.log('routes 메뉴 신규 화면 호출');
    var ss = req.session;
    
    res.render('./admin/menu/new', {title: '메뉴 작성 화면', session : ss});
});

/**
 * 메뉴 신규 생성 처리.
 */
router.post('/save', function(req, res) {
    console.log('routes 생성 처리');
    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var menuNm = req.body.menuNm != null ? req.body.menuNm : '';
    var menuLink = req.body.menuLink != null ? req.body.menuLink : '';

    // SQL 문.
    var SQL = 'INSERT INTO tbl_menu(`menu_nm`, `menu_link`, ins_dt, ins_id) VALUES(?, ?, now(), ?)';

    conn.query(SQL, [menuNm, menuLink, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                console.log('results : ', results.message);
                //res.render('./admin/menu', {'session' : ss})
                res.redirect('/admin/menu');
            }
        });
});

/**
 * 수정 화면 호출.
 */
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;
    var menuNo = req.params.no != null ? req.params.no : '';
    var SQL = 'SELECT menu_no as menuNo, menu_nm as menuNm, menu_link as menuLink, menu_sort_no as menuSortNo,';
    SQL += ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as writer';
    SQL += ' FROM tbl_menu WHERE menu_no = ?';

    conn.query(SQL, [menuNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('results : ', results.message);

                res.render('./admin/menu/view', {
                    'title': '상세화면',
                    'result' : results[0],
                    'session' : ss
                });
            }
        });
});

/**
 * 수정 화면 호출.
 */
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;
    var menuNo = req.params.no != null ? req.params.no : '';
    var SQL = 'SELECT menu_no as menuNo, menu_nm as menuNm, menu_link as menuLink, menu_sort_no as menuSortNo,';
        SQL += ' DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_id as writer';
        SQL += ' FROM tbl_menu WHERE menu_no = ?';

    conn.query(SQL, [menuNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('results : ', results.message);

                res.render('./admin/menu/edit', {
                    'title': '수정화면',
                    'result' : results[0],
                    'session' : ss
                });
            }
        });
});

/**
 * 수정 처리.
 */
router.post('/edit', function(req, res) {
    console.log("수정 처리");

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var menuNo = req.body.menuNo != null ? req.body.menuNo : '';
    var menuNm = req.body.menuNm != null ? req.body.menuNm : '';
    var menuLink = req.body.menuLink != null ? req.body.menuLink : '';
    var SQL = 'UPDATE tbl_menu SET menu_nm = ?, menu_link = ?, upd_dt = now(), upd_id = ? WHERE menu_no = ?';
    // SQL 처리.
    conn.query(SQL, [menuNm, menuLink, ssId, menuNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('results : ', results.message);

                res.redirect('/admin/menu/view/'+menuNo);
            }
        });
});

/**
 * 메뉴 삭제 처리.
 */
router.get('/delete/:no', function(req, res) {
    console.log("게시글 삭제 처리");
    var menuNo = req.params.no != null ? req.params.no : '';
    var SQL = 'DELETE FROM tbl_menu WHERE menu_no = ?';
    // SQL
    conn.query(SQL, [menuNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('results : ', results.message);

                res.redirect('/admin/menu');
            }
        });
});

/**
 * 메뉴 다건 삭제 처리.
 */
router.post('/delete', function(req, res) {
    console.log("삭제 처리");

    var ss = req.session;
    var params = req.body['dataList[]'];
    var SQL = 'DELETE FROM tbl_menu WHERE menu_no = ?';

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params2[" + i + "] = " + params[i]);
        conn.query(SQL, [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

/**
 * 메뉴 정렬 처리.
 */
router.post('/sort', function(req, res) {
    console.log('메뉴 정렬 처리');
//console.log('req.body : ', JSON.stringify(req.body));
    var ss = req.session;
    var params = req.body['dataList[]'];
    var sortNoList = req.body['sortNoList[]'];
    var SQL = 'UPDATE tbl_menu SET menu_sort_no = ? WHERE menu_no = ?';

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params2[" + i + "] = " + params[i]);
        conn.query(SQL, [sortNoList[i], params[i]],
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

module.exports = router;