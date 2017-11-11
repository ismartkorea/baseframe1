/*
 * 모듈명  : cart.js
 * 설명    : '장바구니(카트)' 에 대한 모듈.
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
var async = require('async');
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

    var ssId = ss.usrId != null ? ss.usrId : '';
    var SQL1 = 'SELECT @rownum:=@rownum+1 as num, p_code as pCode, p_div as pDiv, p_type as pType, p_nm as pNm,';
        SQL1 += ' p_price as pPrice, p_disc_price as pDiscPrice, p_disc_percent as pDiscPercent, p_image as pImage,';
        SQL1 += ' p_image_url as pImageUrl, sort_no as sortNo, DATE_FORMAT(insert_dt, "%Y-%m-%d") as date';
        SQL1 += ' FROM tbl_cart WHERE usr_id = ?';

    conn.query(SQL1, [ssId], function(err, results) {
        if(err) {
            console.log('err : ', err);
        } else {

            res.render('./cart', {
                'rList' : results,
                'session' : ss
            });
        }
    });
});

/**
 * 저장 처리.
 */
router.post('/save', function(req, res, next) {
console.log('카트 저장 처리');
    var ss = req.session;
    var ssId = ss.usrId != null ? ss.usrId : '';
    var pNo = req.body.pNo != null ? req.body.pNo : '';
    var pCode = req.body.pCode != null ? req.body.pCode : '';
    var pCount = req.body.pCount != null ? req.body.pCount : '';
    var pSumPrice = req.body.pSumPrice != null ? req.body.pSumPrice : '';

    var DEL_SQL = 'DELETE FROM tbl_cart WHERE p_code = ?;';

    var SQL1 = 'INSERT INTO tbl_cart(`usr_id`, `p_code`, `p_div`, `p_type`, `p_nm`, `p_price`,';
        SQL1 += ' `p_disc_price`, `p_disc_percent`, `p_opt_cnt`, `p_count`, `p_sum_price`, `p_image`, `p_image_url`, `insert_dt`, `insert_usr`)';
        SQL1 += ' SELECT "'+ ssId + '", `p_code`, `p_div`, `p_type`, `p_nm`, `p_price`, `p_disc_price`, `p_disc_percent`,';
        SQL1 += ' `p_opt_cnt`, "' + pCount + '", "'+ pSumPrice + '", `p_image`, `p_image_url`, now(), "' + ssId + '"';
        SQL1 += ' FROM tbl_product WHERE p_no = ?';

    async.waterfall([
        function(callback) {
            // 기존 삭제 처리.
            conn.query(DEL_SQL, [pCode], function (err, results) {
                if (err) {
                    console.log('err : ', err.message);
                    res.status(401).json({'result' : 'error', 'session' : ss});
                } else {
                    console.log('result : ', results.message);
                    callback(null);
                }
            });
        },
        function(callback) {
            // 카트 저장 처리.
            conn.query(SQL1, [pNo], function (err, results) {
                if (err) {
                    console.log('err : ', err.message);
                    res.status(401).json({'result' : 'error', 'session' : ss});
                } else {
                    console.log('result : ', results.message);

                    res.status(200).json({'result': 'OK', 'session': ss})
                }
                callback(null);
            });
        }
    ], function (err) {
        if(err) {
            console.log('err : ', err);
            conn.rollback();
        } else {
            conn.commit();
        }
    });

});

module.exports = router;
