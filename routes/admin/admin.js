/*
 * 모듈명  : admin.js
 * 설명    : 관리자화면 에 대한 모듈.
 * 작성일  : 2017년 09월 30일
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
var config = require('../common/dbconfig');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);

// db connect 초기화.
var conn = mysql.createConnection(config);

/**
 * 메인(index) 화면 호출.
 */
router.get('/', function(req, res) {
    var ss = req.session;

    if(ss.usrId) {

        // 조회
        conn.query('SELECT count(qno) as qnaCnt FROM tbl_qna WHERE DATE_FORMAT(ins_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(no) as reviewCnt FROM tbl_review WHERE DATE_FORMAT(ins_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(pay_code) as payCnt FROM tbl_pay WHERE DATE_FORMAT(insert_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(c_no) as userCnt FROM tbl_user WHERE DATE_FORMAT(insert_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");',
            [],
            function(err, results) {
                if(err) {
                    console.log("err : " + err.message);
                } else {
                    res.render('./admin/index', {
                        title : 'ADPAY 관리자 화면',
                        result0 : results[0][0],
                        result1: results[1][0],
                        result2: results[2][0],
                        result3: results[3][0],
                        session : ss
                    });
                }
            });

    } else {
        res.redirect('/admin/login');
    }

});

/**
 * 관리자 관리 리스트 호출.
 */
router.get('/users', function(req, res) {
    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/user');

    } else {

        res.redirect('/admin/login');

    }

});

/**
 * 관리자 관리 리스트 호출.
 */
router.get('/members', function(req, res) {
    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/member');

    } else {

        res.redirect('/admin/login');

    }

});

/**
 * 결제 관리 화면 호출.
 */
router.get('/pays', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        res.redirect('/admin/pay');
    } else {
        res.redirect('/admin/login');
    }

});

/**
 * 공통코드 관리 화면 호출.
 */
router.get('/commoncds', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/commoncd');

    } else {

        res.redirect('/admin/login');
    }
});

/**
 * 쿠폰 관리 화면 호출.
 */
router.get('/coupons', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/coupon');

    } else {

        res.redirect('/admin/login');
    }
});


// 접속 관리 화면 호출.
router.get('/visits', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        res.redirect('/admin/visit');
    } else {
        res.redirect('/admin/login');
    }
});

/**
 * 공지사항 리스트 호출.
 */
router.get('/announces', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/announce');

    } else {

        res.redirect('/admin/login');
    }


});


/**
 * 대쉬보드 화면 호출.
 */
router.get('/dashboard', function(req, res) {
    var ss = req.session;

    if(ss.usrId) {

        // 조회
        conn.query('SELECT count(qno) as qnaCnt FROM tbl_qna WHERE DATE_FORMAT(ins_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(no) as reviewCnt FROM tbl_review WHERE DATE_FORMAT(ins_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(pay_code) as payCnt FROM tbl_pay WHERE DATE_FORMAT(insert_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");'
            + ' SELECT count(c_no) as userCnt FROM tbl_user WHERE DATE_FORMAT(insert_dt, "%Y-%m-%d") >= DATE_FORMAT(now(), "%Y-%m-%d");',
            [],
            function(err, results) {
                if(err) {
                    console.log("err : " + err.message);
                } else {
                    res.render('./admin/dashboard', {
                        title : 'ADPAY 관리자 화면',
                        result0 : results[0][0],
                        result1: results[1][0],
                        result2: results[2][0],
                        result3: results[3][0],
                        session : ss
                    });
                }
            });

    } else {
        res.redirect('/admin/login');
    }

});


module.exports = router;