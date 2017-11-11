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


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/* GET home page. */
router.get('/', function(req, res, next) {
  var ss = req.session;

  var SQL1 = ' SELECT p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_image as pImage, p_image_url as pImageUrl, p_price as pPrice,';
      SQL1 += ' p_disc_price as pDiscPrice FROM tbl_product WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,';
      SQL1 += ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s';
      SQL1 += ' WHERE s.cateName = "온라인게임") AND set_best_yn = "Y" ORDER BY insert_dt DESC;';
  var SQL2 = ' SELECT p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_image as pImage, p_image_url as pImageUrl, p_price as pPrice,';
      SQL2 += ' p_disc_price as pDiscPrice FROM tbl_product WHERE category1 = (SELECT s.cateNo as cateNo FROM (SELECT t1.category_no as cateNo,';
      SQL2 += ' t1.name as cateName FROM tbl_product_category AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s';
      SQL2 += ' WHERE s.cateName = "구글/카카오게임") AND set_best_yn = "Y" ORDER BY insert_dt DESC;';
  var SQL3 = ' SELECT menu_no as menuNo, menu_nm as menuNm, menu_link as menuLink FROM tbl_menu ORDER BY menu_sort_no ASC;';
  var SQL4 = 'SELECT no, CONCAT(LEFT(title, "10"), "...") title, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date FROM tbl_announce ORDER BY ins_dt DESC LIMIT 5;';
  var SQL5 = ' SELECT no, CONCAT(LEFT(title, "10"), "...") title, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date FROM tbl_event ORDER BY ins_dt DESC LIMIT 5;';
  var SQL6 = ' SELECT no, CONCAT(LEFT(title, "10"), "...") title, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date FROM tbl_review ORDER BY ins_dt DESC LIMIT 5;';

  conn.query(SQL1 + SQL2 + SQL3 + SQL4 + SQL5 + SQL6, [],
      function(err, results) {
        if(err) {
          console.log('err : ', err);
        } else {

          res.render('./index', {
            'title': 'adpay.co.kr',
            'item' : '',
            'rList1' : results[0],
            'rList2' : results[1],
            'mList' : results[2],
            'rList3' : results[3],
            'rList4' : results[4],
            'rList5' : results[5],
            'session' : ss
          });
        }
      }
  );

});

module.exports = router;
