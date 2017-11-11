/*
 * 모듈명  : commoncd.js
 * 설명    : 관리자화면 메뉴 '공통코드 관리' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var engine = require('ejs-locals');
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

router.use('ejs', engine);

var conn = mysql.createConnection(config);
conn.connect();

/**
 * 공통코드 리스트 호출.
 */
router.get('/', function(req, res) {

    var ss = req.session;
    //console.log(">>> userId = " + ss.usrId);
    //console.log(">>> userName = " + ss.usrName);
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "cd") {
            addSQL = ' WHERE `comm_cd` = ?';
        } else if (srchType == "ucd") {
            addSQL = ' WHERE `p_comm_cd` LIKE concat(?,"%")';
        } else if (srchType == "nm") {
            addSQL = ' WHERE `comm_nm` LIKE concat("%", ?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //conn.connect();

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM `tbl_commcd`' + addSQL
            + '; SELECT @rownum:=@rownum+1 as `num`, `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`,'
            + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as `w_dt`, `insert_usr` as `w_nm`, DATE_FORMAT(update_dt,"%Y-%m-%d") as `u_dt`,'
            + ' `update_usr` as `u_nm` FROM `tbl_commcd`, (SELECT @rownum:=' + skip + ') `TMP`' + addSQL
            + ' ORDER BY `comm_cd` ASC LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/commcd/list', {
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

    //conn.end();
});

/**
 * 게시글 리스트 호출(post).
 */
router.post('/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if(srchType=="cd") {
        addSQL =  ' WHERE `comm_cd` = ?';
    } else if(srchType=="ucd") {
        addSQL =  ' WHERE `p_comm_cd` LIKE concat(?,"%")';
    } else if(srchType=="nm") {
        addSQL =  ' WHERE `comm_nm` LIKE concat("%", ?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt from `tbl_commcd`' + addSQL
        + '; SELECT @rownum:=@rownum+1 as `num`, `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`,'
        + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as `w_dt`, `insert_usr` as `w_nm`, DATE_FORMAT(update_dt,"%Y-%m-%d") as `u_dt`,'
        + ' `update_usr` as `u_nm` FROM `tbl_commcd`, (SELECT @rownum:='+skip+') `TMP`'+ addSQL,
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/commcd/list', {
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

    //conn.end();
});

/**
 * 공통코드 작성 화면 호출.
 */
router.get('/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/commcd/new', {session : ss});
});

/**
 * 공통코드 작성처리.
 */
router.post('/save', function(req, res) {
    console.log('routes  공통코드 작성 처리');

    var ss = req.session;
    var ssId = ss.usrId !=null ? ss.usrId : '';
    var commCd = req.body.commCd !=null ? req.body.commCd : '';
    var pCommCd = req.body.pCommCd !=null ? req.body.pCommCd : '';
    var commNm = req.body.commNm !=null ? req.body.commNm : '';
    var desc = req.body.desc !=null ? req.body.desc : '';
    var SQL = 'insert into `tbl_commcd`(`comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`,';
        SQL += ' `update_dt`, `update_usr`) values(?, ?, ?, ?, now(), ?, now(), ?)';

    conn.query(SQL, [commCd, pCommCd, commNm, desc, ssId, ssId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ', results.message);

                res.json({'result' : 'OK'});
            }
        }
    );
});

/**
 * 공통코드 수정 화면 호출.
 */
router.get('/view/:cd', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var pCd = req.params.cd !=null ? req.params.cd : '';
    var SQL = 'SELECT `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr`';
        SQL += ' FROM `tbl_commcd` WHERE `comm_cd` = ?';

    conn.query(SQL, [pCd],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes common code View Result !!!');

                res.render('./admin/commcd/view', {
                    'retval' : results[0],
                    'session' : ss
                });
            }
        });
});

/**
 * 공통코드 수정 화면 호출.
 */
router.get('/edit/:cd', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;
    var pCd = req.params.cd !=null ? req.params.cd : '';
    var SQL = 'SELECT `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr`';
        SQL += ' FROM `tbl_commcd` WHERE `comm_cd` = ?';

    conn.query(SQL, [pCd],
        function(err, results) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                console.log('routes common code Edit Result !!!');

                res.render('./admin/commcd/edit', {
                    'retval' : results[0],
                    'session' : ss
                });
            }
        });
});

/**
 * 공통코드 수정 처리.
 */
router.post('/edit/do', function(req, res) {
    console.log("공통코드 수정 처리");

    var ss = req.session;
    var ssId = ss.usrId !=null ? ss.usrId : '';
    var newCommCd = req.body.newCommCd !=null ? req.body.newCommCd : '';
    var newPcommCd = req.body.newPcommCd !=null ? req.body.newPcommCd : '';
    var newCommNm = req.body.newCommNm !=null ? req.body.newCommNm : '';
    var newDesc = req.body.newDesc !=null ? req.body.newDesc : '';
    var commCd = req.body.commCd !=null ? req.body.commCd : '';
    var pCommCd = req.body.pCommCd !=null ? req.body.pCommCd : '';
    var SQL = 'UPDATE `tbl_commcd` SET `comm_cd` = ?, `p_comm_cd` = ?, `comm_nm` = ?, `desc` = ?,';
        SQL += ' `insert_dt` = now(), `insert_usr` = ?, `update_dt` = now(), `update_usr` = ? where `comm_cd` = ? and `p_comm_cd` = ?';

    conn.query(SQL, [newCommCd, newPcommCd, newCommNm, newDesc, ssId, ssId, commCd, pCommCd],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ' + results.message);

                res.json({result : "OK", session : ss});
            }
        });
});

/**
 * 공통코드 삭제.(get)
 */
router.get('/delete/:cd', function(req, res) {
    console.log("게시글 삭제 처리");

    var ss = req.session;
    var pCd = req.params.cd != null ? req.params.cd : '';
    var SQL = 'DELETE FROM `tbl_commcd` WHERE `comm_cd` = ?';

    conn.query(SQL, [pCd],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ' + results.message);

                res.redirect('/admin/commoncd');
            }
        });
});

/**
 * 공통 코드 삭제 처리.
 */
router.post('/delete', function(req, res) {

    console.log("공통코드 삭제 처리");
    console.log('req.body : ', JSON.stringify(req.body));

    var params = [];
    var chkBoxCnt = req.body.chkBoxCnt !=null ? req.body.chkBoxCnt : 0;
    var SQL = 'DELETE FROM `tbl_commcd` WHERE comm_cd = ?';

    for (var i = 0; i < chkBoxCnt; i++) {
        params[i] = req.body['dataList[]'];
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query(SQL, [params[i]],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    console.log('result : ' + results.message);
                }
            });
        conn.commit();
    }

    res.json({'result' : 'OK'});
});


module.exports = router;