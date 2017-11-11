/*
 * 모듈명  : product4.js
 * 설명    : ADPAY 화면 '상품' 에 대한 모듈.
 * 작성일  : 2017년 10월 22일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var config = require('./common/dbconfig');
var router = express.Router();
// use set
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;

    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "구글기프트카드") AND set_best_yn = "Y" AND p_div = "M" AND p_display_yn = "Y"'
        + ' ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL2 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "구글기프트카드") AND p_div = "M" AND p_display_yn = "Y" ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL3 = ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1 + SQL2 + SQL3, [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.render('./products4/product', {
                    'rList1' : results[0],
                    'rList' : results[1],
                    'cList' : results[2],
                    'cList2' : '',
                    'cList3' : '',
                    'cateGubun' : '',
                    'cate2Gubun' : '',
                    'cate3Gubun' : '',
                    'order' : '',
                    'srchType1' : '',
                    'srchType2' : '',
                    'srchType3' : '',
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 검색 처리.
 */
router.post('/search', function(req, res, next) {
    console.log('검색 처리');

    var ss = req.session;
    console.log('req.body : ', JSON.stringify(req.body));

    var srchType1 = req.body.srchType1 != null ? req.body.srchType1 : '';
    var srchType2 = req.body.srchType2 != null ? req.body.srchType2 : '';
    var srchType3 = req.body.srchType3 != null ? req.body.srchType3 : '';
    var orderSQL = ' ORDER BY CAST(display_order_no as unsigned) ASC;';
    var addSQL1 = '';     var addSQL2 = '';

    if(srchType1 == 'POP') {
        addSQL1 = ' AND set_best_yn = "Y" ';
    } else if(srchType1 == 'LOW') {
        orderSQL = ' ORDER BY CAST(p_price as unsigned) ASC;';
    } else if(srchType1 == 'HIGH') {
        orderSQL = ' ORDER BY CAST(p_price as unsigned) DESC;';
    } else if(srchType1 == 'NEW') {
        orderSQL = ' ORDER BY insert_dt DESC;';
    }
    // 가격 순위 처리.
    if(srchType2 == '1') {
        addSQL2 = ' AND p_price BETWEEN 1000 AND 10000';
    } else if(srchType2 == '3') {
        addSQL2 = ' AND p_price BETWEEN 1000 AND 30000';
    } else if(srchType2 == '5') {
        addSQL2 = ' AND p_price BETWEEN 3000 AND 50000';
    } else if(srchType2 == '10') {
        addSQL2 = ' AND p_price BETWEEN 5000 AND 100000';
    } else if(srchType2 == '30') {
        addSQL2 = ' AND p_price BETWEEN 100000 AND 300000';
    } else if(srchType2 == '50') {
        addSQL2 = ' AND p_price BETWEEN 300000 AND 500000';
    }
    //
    if(srchType3 == 'pLOW') {
        orderSQL = ' ORDER BY CAST(p_price as unsigned) ASC;';
    } else if(srchType3 == 'pHIGH') {
        orderSQL = ' ORDER BY CAST(p_price as unsigned) DESC;';
    }

    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "구글기프트카드") AND set_best_yn = "Y" AND p_div = "M" AND p_display_yn = "Y"'
        + ' ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL2 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "구글기프트카드") AND p_div = "M" AND p_display_yn = "Y"' + addSQL1 + addSQL2 + orderSQL;
    var SQL3 = ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1 + SQL2 + SQL3, [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.render('./products4/product', {
                    'rList1' : results[0],
                    'rList' : results[1],
                    'cList' : results[2],
                    'cList2' : '',
                    'cList3' : '',
                    'cateGubun' : '',
                    'cate2Gubun' : '',
                    'cate3Gubun' : '',
                    'order' : '',
                    'srchType1' : srchType1,
                    'srchType2' : srchType2,
                    'srchType3' : srchType3,
                    'session' : ss
                });
            }
        });
    conn.end();
});

module.exports = router;
