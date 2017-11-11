/*
 * 모듈명  : members.js
 * 설명    : 관리자화면 '회원 관리' 에 대한 모듈.
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
var bcrypt = require('bcrypt');
var router = express.Router();
var config = require('../common/dbconfig');

const saltRounds = 10;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);

// db connect init
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
            addSQL1 = ' WHERE c_no = ?';
            addSQL2 = ' WHERE x.c_no = ?';
        } else if (srchType == "id") {
            addSQL1 = ' WHERE c_id LIKE concat(?,"%")';
            addSQL2 = ' WHERE x.c_id LIKE concat(?,"%")';
        } else if (srchType == "nm") {
            addSQL1 = ' WHERE c_name LIKE concat(?,"%")';
            addSQL2 = ' WHERE x.c_name LIKE concat(?,"%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM tbl_user ' + addSQL1
            + '; SELECT @rownum:=@rownum+1 as num, x.c_no as no, x.c_id as id, x.c_name as name,'
            + ' x.c_addr1 as address1, x.c_addr2 as address2, x.c_postno as postno,'
            + ' x.c_email as email, x.c_sex as sex, x.c_birth as birth, x.c_tel_no as telno,'
            + ' x.c_tel_no1 as telno1, x.c_tel_no2 as telno2, x.c_tel_no3 as telno3, x.c_cell_no as cellno,'
            + ' x.c_cell_no1 as cellno1, x.c_cell_no2 as cellno2, x.c_cell_no3 as cellno3, x.c_email_yn as emailyn,'
            + ' (select comm_nm from tbl_commcd where p_comm_cd = "U000" and comm_cd = x.c_user_tp) as usertype, x.c_inf_use_yn as infoyn,'
            + ' (select comm_nm from tbl_commcd where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as level, x.c_auth_cd as authcd'
            + ' FROM tbl_user x, (SELECT @rownum:=' + skip + ') TMP' + addSQL2
            + ' ORDER BY x.c_no desc LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/member/list', {
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
        addSQL1 = ' WHERE c_no = ?';
        addSQL2 = ' WHERE x.c_no = ?';
    } else if(srchType=="id") {
        addSQL1 = ' WHERE c_id LIKE concat(?,"%")';
        addSQL2 = ' WHERE x.c_id LIKE concat(?,"%")';
    } else if(srchType=="nm") {
        addSQL1 =  ' WHERE c_name LIKE concat(?,"%")';
        addSQL2 =  ' WHERE x.c_name LIKE concat(?,"%")';
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
    conn.query('SELECT count(*) as cnt FROM tbl_user '+ addSQL1
        + '; SELECT @rownum:=@rownum+1 as num, x.c_no as no, x.c_id as id, x.c_name as name,'
        + ' x.c_addr1 as address1, x.c_addr2 as address2, x.c_postno as postno,'
        + ' x.c_email as email, x.c_sex as sex, x.c_birth as birth, x.c_tel_no as telno,'
        + ' x.c_cell_no as cellno, x.c_email_yn as emailyn,'
        + ' (select comm_nm from tbl_commcd where p_comm_cd = "U000" and comm_cd = x.c_user_tp) as usertype, x.c_inf_use_yn as infoyn,'
        + ' (select comm_nm from tbl_commcd where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as level, x.c_auth_cd as authcd'
        + ' FROM tbl_user x, (SELECT @rownum:='+skip+') TMP' + addSQL2
        + ' ORDER BY x.c_no desc LIMIT '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/member/list', {
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
    console.log('routes  멤버 작성 처리');

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var usrId = req.body.usrId != null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd != null ? req.body.usrPwd : '';
    var usrName = req.body.usrName != null ? req.body.usrName : '';
    var usrAddr1 = req.body.usrAddr1 != null ? req.body.usrAddr1 : '';
    var usrAddr2 = req.body.usrAddr2 != null ? req.body.usrAddr2 : '';
    var usrPostNo = req.body.usrPostNo != null ? req.body.usrPostNo : '';
    var usrEmail = req.body.usrEmail != null ? req.body.usrEmail : '';
    var usrSex = req.body.usrSex != null ? req.body.usrSex : '';
    var usrBirth = req.body.usrBirth != null ? req.body.usrBirth : '';
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
        if (err) throw err;

        conn.query('INSERT INTO tbl_user(c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,'
            + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3,'
            + ' c_email_yn, c_inf_use_yn, c_user_tp, c_auth_level, c_auth_cd, insert_dt, insert_usr, update_dt, update_usr)'
            + ' values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "", now(), ?, now(), ?)',
            [
             usrId, hash, usrName, usrAddr1, usrAddr2, usrPostNo, usrEmail, usrSex, usrBirth, usrTelNo, usrTelNo1, usrTelNo2,
             usrTelNo3, usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3, usrEmailYn, usrInfoYn, usrType, usrAuthLvl, ssId, ssId
            ],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
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
    var no = req.params.no != null ? req.params.no : '';

    conn.query('SELECT c_no as no, c_id as id, c_name as name, c_addr1 as address1, c_addr2 as address2,'
        + ' c_postno as postno, c_email as email, c_sex as sex, c_saup_no as saupno, c_user_tp as usertype,'
        + ' c_auth_level as level, c_birth as birth, c_auth_cd as authcd, c_inf_use_yn as infoyn'
        + ' FROM tbl_user WHERE c_no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes member View Result !!!');
                res.render('./admin/member/view', {
                    result : 'OK',
                    members : results[0],
                    session : ss
                });
            }
        });
});

// 멤버 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';
    
    conn.query('SELECT c_no as no, c_id as id, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email, c_sex as sex,'
        + ' SUBSTRING(c_birth,1,4) as year,SUBSTRING(c_birth,5,2) as month, SUBSTRING(c_birth,7,2) as day,'
        + ' c_tel_no as telno, c_tel_no1 as telno1, c_tel_no2 as telno2, c_tel_no3 as telno3,'
        + ' c_cell_no as cellno, c_cell_no1 as cellno1, c_cell_no2 as cellno2, c_cell_no3 as cellno3,'
        + ' c_email_yn as emailyn, c_inf_use_yn as infoyn, c_user_tp as usertype, c_auth_level as level, c_auth_cd as authcd,'
        + ' insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm FROM tbl_user WHERE c_no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes member Edit Result !!!');
                res.render('./admin/member/edit', {
                    result : 'OK',
                    members : results[0],
                    session : ss
                });
            }
        });
});

// 멤버 수정 처리.
router.post('/edit', function(req, res) {
    console.log("멤버 수정 처리");

    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var usrNo = req.body.usrNo != null ? req.body.usrNo : '';
    var usrId = req.body.usrId != null ? req.body.usrId : '';
    var usrName = req.body.usrName != null ? req.body.usrName : '';
    var usrAddr1 = req.body.usrAddr1 != null ? req.body.usrAddr1 : '';
    var usrAddr2 = req.body.usrAddr2 != null ? req.body.usrAddr2 : '';
    var usrPostNo = req.body.usrPostNo != null ? req.body.usrPostNo : '';
    var usrEmail = req.body.usrEmail != null ? req.body.usrEmail : '';
    var usrSex = req.body.usrSex != null ? req.body.usrSex : '';
    var usrBirth = req.body.usrBirth != null ? req.body.usrBirth : '';
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

    conn.query('UPDATE tbl_user SET c_id = ?, c_name = ?,'
        + ' c_addr1 = ?, c_addr2 = ?, c_postno = ?, c_email = ?, c_sex = ?, c_birth = ?, c_tel_no = ?,'
        + ' c_tel_no1 = ?, c_tel_no2 = ?, c_tel_no3 = ?, c_cell_no = ?, c_cell_no1 = ?, c_cell_no2 = ?, c_cell_no3 = ?,'
        + ' c_email_yn = ?, c_inf_use_yn = ?, c_user_tp = ?, c_auth_level = ?, update_dt = now(), update_usr = ? '
        + ' WHERE c_no = ?',
        [
            usrId, usrName, usrAddr1, usrAddr2, usrPostNo, usrEmail, usrSex, usrBirth, usrTelNo, usrTelNo1,
            usrTelNo2, usrTelNo3, usrCellNo, usrCellNo1, usrCellNo2, usrCellNo3,
            usrEmailYn, usrInfoYn, usrType, usrAuthLvl, ssId, usrNo
        ],
        function (err, result) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ' + result.message);
                res.json({result: 'OK', session: ss});
            }
        }
    );

    conn.commit();
});

// 멤버 삭제.(get)
router.get('/delete/:no', function(req, res) {
    console.log("멤버 삭제 처리");

    var ss = req.session;
    var no = req.params.no != null ? req.params.no : '';

    conn.query('DELETE FROM tbl_user WHERE c_no = ?',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log(results.message);

                res.redirect('/admin/member');
            }
        });
});


// 멤버 삭제.(post)
router.post('/delete', function(req, res) {

    console.log("멤버 삭제 처리");

    var params = req.body['dataList[]'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('DELETE FROM tbl_user WHERE c_no = ?',
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