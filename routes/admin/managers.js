/*
 * 모듈명  : manager.js
 * 설명    : 관리자화면 '담당자 관리' 에 대한 모듈.
 * 작성일  : 2017년 1월 10일
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
var bcrypt = require('bcrypt');
var router = express.Router();
var config = require('../common/dbconfig');

const saltRounds = 10;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);

var conn = mysql.createConnection(config);
conn.connect();

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;

    console.log(">>>>> usrLevel : " + ss.usrLevel);
    //if(ss.usrType == null || ss.usrType != "S") {
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL1 = "";
        var addSQL2 = "";

        if (srchType == "no") {
            addSQL1 = ' AND m_no = ?';
            addSQL2 = ' AND x.m_no = ?';
        } else if (srchType == "id") {
            addSQL1 = ' AND m_id like concat(?,"%")';
            addSQL2 = ' AND x.m_id like concat(?,"%")';
        } else if (srchType == "nm") {
            addSQL1 = ' AND m_name like concat(?,"%")';
            addSQL2 = ' AND x.m_name like concat(?,"%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM tbl_manager WHERE m_auth_level = "001"' + addSQL1
            + '; SELECT @rownum:=@rownum+1 as num, x.m_no as no, x.m_id as id, x.m_name as name,'
            + ' (select comm_nm from tbl_commcd where p_comm_cd = "M000" and comm_cd = x.m_auth_level) as level'
            + ' FROM tbl_manager x, (SELECT @rownum:=' + skip + ') TMP WHERE x.m_auth_level = "001"' + addSQL2
            + ' ORDER BY x.m_no DESC LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/manager/list', {
                        members: results[1],
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

    //conn.end();
});

// 게시글 리스트 호출(post).
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL1 = "";
    var addSQL2 = "";

    if(srchType=="no") {
        addSQL1 = ' AND m_no = ?';
        addSQL2 = ' AND x.m_no = ?';
    } else if(srchType=="id") {
        addSQL1 = ' AND m_id like concat(?,"%")';
        addSQL2 = ' AND x.m_id like concat(?,"%")';
    } else if(srchType=="nm") {
        addSQL1 =  ' AND m_name like concat(?,"%")';
        addSQL2 =  ' AND x.m_name like concat(?,"%")';
    }
    // 페이징 설정.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt FROM tbl_mamager WHERE m _auth_level = "001"'+ addSQL1
        + '; SELECT @rownum:=@rownum+1 as num, x.m_no as no, x.m_id as id, x.m_name as name,'
        + ' (select comm_nm from tbl_commcd where p_comm_cd = "M000" and comm_cd = x.m_auth_level) as level'
        + ' FROM tbl_mamager x, (SELECT @rownum:='+skip+') TMP WHERE x.m_auth_level = "001"' + addSQL2
        + ' ORDER BY x.m_no desc LIMIT '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/manager/list', {
                    members : results[1],
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

// 화면 호출.
router.get('/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/member/new', {session : ss});
});

// 멤버 작성처리.
router.post('/save', function(req, res) {
    console.log('routes  멤버 추가 처리');

    var ss = req.session;
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    var usrName = req.body.usrName !=null ? req.body.usrName : '';
    var usrEmail =  req.body.usrEmail !=null ? req.body.usrEmail : '';
    var usrCellNo = req.body.usrCellNo !=null ? req.body.usrCellNo : '';
    var usrCellNo1 = req.body.usrCellNo1 !=null ? req.body.usrCellNo1 : '';
    var usrCellNo2 = req.body.usrCellNo2 !=null ? req.body.usrCellNo2 : '';
    var usrCellNo3 = req.body.usrCellNo3 !=null ? req.body.usrCellNo3 : '';

    bcrypt.hash(usrPwd, saltRounds, function (err, hash) {
        if (err) throw err;

        conn.query('INSERT INTO tbl_manager(m_id, m_pwd, m_name, m_email, m_cell_no, m_cell_no1, m_cell_no2, m_cell_no3,'
            + ' m_auth_level, insert_dt, insert_usr, update_dt, update_usr)'
            + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, "001", now(), ?, now(), ?,)',
            [usrId, hash, usrName, usrEmail, usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3, ss.usrId, ss.usrId],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    console.log(">>> results : " + results);
                    console.log(">>> results.length : " + results.length);
                    res.json({'result': 'OK'});
                }
            }
        );

    });

});

// 멤버수정 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no !=null ? req.params.no : '';

    conn.query('SELECT m_no as no, m_id as id, m_name as name, m_email as email, m_auth_level as level,'
        + ' FROM tbl_manager WHERE m_no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes manager View Result !!!');
                res.render('./admin/manager/view', {result : 'OK', members : results[0], session : ss});
            }
        });
});

// 멤버 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no !=null ? req.params.no : '';
    
    conn.query('SELECT m_no as no, m_id as id, m_name as name, m_email as email,'
        + ' m_cell_no as cellno, m_cell_no1 as cellno1, m_cell_no2 as cellno2, m_cell_no3 as cellno3,'
        + ' m_auth_level as level, insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm'
        + ' FROM tbl_manager WHERE m_no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes manager Edit Result !!!');
                res.render('./admin/manager/edit', {result : 'OK', members : results[0], session : ss});
            }
        });
});

// 멤버 수정 처리.
router.post('/edit', function(req, res) {

    console.log('req.body : ', JSON.stringify(req.body));

    var ss = req.session;

    var usrNo = req.body.usrNo !=null ? req.body.usrNo : '';
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    var usrName = req.body.usrName !=null ? req.body.usrName : '';
    var usrEmail =  req.body.usrEmail !=null ? req.body.usrEmail : '';
    var usrCellNo = req.body.usrCellNo !=null ? req.body.usrCellNo : '';
    var usrCellNo1 = req.body.usrCellNo1 !=null ? req.body.usrCellNo1 : '';
    var usrCellNo2 = req.body.usrCellNo2 !=null ? req.body.usrCellNo2 : '';
    var usrCellNo3 = req.body.usrCellNo3 !=null ? req.body.usrCellNo3 : '';
    var usrLevel = req.body.usrAuthLvl !=null ? req.body.usrAuthLvl : '';

    console.log("멤버 수정 처리");
    bcrypt.hash(usrPwd, saltRounds, function (err, hash) {
        if (err) throw err;
        conn.query('UPDATE tbl_manager SET m_id = ?, m_pwd = ?, m_name = ?, m_email = ?, m_cell_no = ?, m_cell_no1 = ?,'
            + ' m_cell_no2 = ?, m_cell_no3 = ?, m_auth_level = ?, update_dt = now(), update_usr = ? WHERE m_no = ?',
            [usrId, hash, usrName, usrEmail, usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3, usrLevel, usrId, usrNo],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    console.log('result : ' + results.message);
                    //console.dir(results);

                    res.json({result: 'OK', session: ss});
                }
            }
        );
        conn.commit();

    });

});

// 멤버 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;
    var no = req.params.no !=null ? req.params.no : '';

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("멤버 삭제 처리");
    conn.query('DELETE FROM tbl_manager WHERE m_no = ?',
        [no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            }
            res.redirect('/admin/manager/view/'+no);
        }
    );
});


// 멤버 삭제.(post)
router.post('/delete', function(req, res) {

    console.log("멤버 삭제 처리");
    var params = req.body['dataList[]'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('DELETE FROM tbl_manager WHERE m_no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 멤버 작성처리.
router.post('/fast/insert', function(req, res) {
    console.log('routes  멤버 작성 처리');

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var usrId = req.body.fUsrId != null ? req.body.fUsrId : '';
    var usrPwd = req.body.fUsrPwd != null ? req.body.fUsrPwd : '';
    var usrName = req.body.fUsrName != null ? req.body.fUsrName : '';
    var usrEmail = req.body.fUsrEmail != null ? req.body.fUsrEmail : '';

    bcrypt.hash(usrPwd, saltRounds, function (err, hash) {
        if (err) throw err;

        conn.query('INSERT INTO tbl_manager(m_id, m_pwd, m_name, m_email, m_auth_level, insert_dt, insert_usr,'
            + ' update_dt, update_usr) VALUES(?, ?, ?, ?, "001", now(), ?, now(), ?)',
            [usrId, hash, usrName, usrEmail, ssId, ssId],
            function (err) {
                if (err) {
                    console.log('error : ', JSON.stringify(err));
                } else {
                    res.redirect('/admin/manager');
                }
            }
        );

    });
});

module.exports = router;