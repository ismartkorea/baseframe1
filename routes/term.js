/*
 * 모듈명  : term.js
 * 설명    : '이용약관/쇼핑몰이용안내개인정보취급방침' 에 대한 모듈.
 * 작성일  : 2017년 10월 17일
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
// db confing import
var config = require('./common/dbconfig');
// routes use set
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

// DB Connect
var conn = mysql.createConnection(config);
conn.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;

    res.render('./terms', {
        'session' : ss
    });
});

/**
 * 이용안내 페이지 호출.
 */
router.get('/guide', function(req, res, next) {
    var ss = req.session;

    res.render('./guide', {
        'session' : ss
    });
});

module.exports = router;
