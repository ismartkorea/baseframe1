var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();
// DB Connect
var config = require('./common/dbconfig');
var conn = mysql.createConnection(config);
conn.connect();
// use set
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;
    var searchTxt = req.query.srchText != null ? req.query.srchText : '';
    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "온라인게임") AND set_best_yn = "Y" AND p_div = "M" AND p_display_yn = "Y"'
        + ' ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL2 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_type as pType, p_nm as pNm, p_price as pPrice,';
        SQL2 += ' p_disc_price as pDiscPrice, p_image as pImage, p_image_url as pImageUrl, set_best_yn as setBestYn,';
        SQL2 += ' best_no as bestNo, sort_no as sortNo FROM tbl_product WHERE p_nm LIKE CONCAT(?, "%") ORDER BY sort_no ASC;';

    conn.query(SQL1 + SQL2, [searchTxt],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {

                res.render('./searchResult', {
                    'rList1' : results[0],
                    'rList2' : results[1],
                    'srchType1' : '',
                    'srchType2' : '',
                    'srchType3' : '',
                    'srchText' : searchTxt,
                    'session' : ss
                });
            }
        }
    );

});

/**
 * 검색 처리.
 */
router.post('/', function(req, res, next) {
    var ss = req.session;
    var searchTxt = req.body.srchText != null ? req.body.srchText : '';

    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType,'
        + ' p_price as pPrice, p_disc_price as pDiscPrice,'
        + ' CASE WHEN p_type = "SVC" THEN "서비스" WHEN p_type = "PKG" THEN "패키지" ELSE "" END as pTypeNm,'
        + ' p_gubun as pGubun, p_desc as pDesc, p_smmry as pSmmry, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM tbl_product x WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s'
        + ' WHERE s.cateName = "온라인게임") AND set_best_yn = "Y" AND p_div = "M" AND p_display_yn = "Y"'
        + ' ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL2 = 'SELECT p_no as pNo, p_code as pCode, p_uniq_code as pUniqCode, p_type as pType, p_nm as pNm, p_price as pPrice,';
        SQL2 += ' p_disc_price as pDiscPrice, p_image as pImage, p_image_url as pImageUrl, set_best_yn as setBestYn,';
        SQL2 += ' best_no as bestNo, sort_no as sortNo FROM tbl_product WHERE p_nm LIKE CONCAT(?,"%") ORDER BY sort_no ASC;';

    conn.query(SQL1 + SQL2, [searchTxt],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {

                res.render('./searchResult', {
                    'rList1' : results[0],
                    'rList2' : results[1],
                    'srchType1' : '',
                    'srchType2' : '',
                    'srchType3' : '',
                    'srchText' : searchTxt,
                    'session' : ss
                });
            }
        }
    );

});

module.exports = router;
