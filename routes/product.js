/*
 * 모듈명  : products.js
 * 설명    : JT-LAB 화면 '상품' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
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

//var sprintf = require('sprintf-js').sprintf;
//var vsprintf = require('sprintf-js').vsprintf;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    var SQL = 'SELECT @rownum:=@rownum+1 as num, p_no as pNo, p_code as pCode, p_div as pDiv,';
        SQL += 'p_type as pType, p_nm as pNm, p_price as pPrice, p_disc_price as pDiscPrice, p_display_yn as pDisplayYn,';
        SQL += 'p_image as pImage, p_opt_cnt as pOptCnt, p_gubun_cd as pGubunCd,';
        SQL += 'p_image_url as pImageUrl, p_count as pCount, p_stock_count as pStockCount,';
        SQL += 'display_order_no as displayOrderNo,set_best_yn as setBestYn,';
        SQL += 'DATE_FORMAT(insert_dt, "%Y-%m-%d") as insDt, insert_usr as insUsr,';
        SQL += 'DATE_FORMAT(update_dt, "%Y-%m-%d") as updDt, update_usr as updUsr';
        SQL += 'FROM tbl_product, (SELECT @rownum:=0) TMP WHERE p_div = "M"';
        SQL += 'AND p_display_yn = "Y" ORDER BY CAST(display_order_no as unsigned) ASC;';
    var SQL2 = ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL + SQL2, [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.render('./product', {
                    'rList' : results[1],
                    'cList' : results[2],
                    'cList2' : '',
                    'cList3' : '',
                    'cateGubun' : '',
                    'cate2Gubun' : '',
                    'cate3Gubun' : '',
                    'order' : '',
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 기능 : 상품 디테일 팝업 호출.
 * 호출되는 파일명 : productDetailPopup.ejs
 */
router.get('/detail/:pno', function(req, res, next) {
    console.log('상품 디테일 팝업 호출.');

    var ss = req.session;
    var pCode = req.params.pno !=null ? req.params.pno : '';
    console.log('pCode : ', pCode);
    // 상품 정보 상세 조회  SQL
    var SQL = 'SELECT p_nm as pNm, p_price as pPrice, p_desc as pDesc, p_image as pImage, p_image_url as pImageUrl'
        + ' FROM product_lab_info_tbl WHERE p_code = ?';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL, [pCode],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.status(200).render('./productDetailPopup', {'result' : results[0], 'session' : ss});
            }
        });
    conn.end();
});


// 상품 정보 취득 처리.
router.get('/:pno', function(req, res, next) {
    var ss = req.session;
    var pno = req.params.pno ? req.params.pno : '';
    var srchType = req.query.srchType != null ? req.query.srchType : "";
    var srchText = req.query.srchText != null ? req.query.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' and title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' and writer like concat(?,"%")';
    }

    var reqPage = req.query.page ? parseInt(req.query.page) : 1;
    console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;
    console.log(">>> skip = " + skip);
    console.log(">>> limit = " + limit);

    if(srchType == "") {
        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
            + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
            + ' where pno = ? and displayyn = "y";'
            + ' select count(*) as cnt from product_board_inf_tbl where pno = ? '
            + '; select @rownum:=@rownum+1 as num, no, pno, title, content, count, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date,'
            + ' ins_usr as writer from product_board_inf_tbl, (SELECT @rownum:=' + skip + ') TMP where pno = ?'
            + ' order by no desc limit ' + skip + ', ' + limit + ";",
            [pno, pno, pno],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[1][0].cnt;
                    console.log(">>> count : " + count);
                    var maxPage = Math.ceil(count / limit);
                    console.log(">>> rList = " + JSON.stringify(results[2]));

                    res.render('./productPopup', {
                        product: results[0][0],
                        rList: results[2],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });
        conn.end();
    } else {
        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
            + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
            + ' where pno = ? and displayyn = "y";'
            + ' select count(*) as cnt from product_board_inf_tbl where pno = ? ' + addSQL
            + '; select @rownum:=@rownum+1 as num, no, pno, title, content, count, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date,'
            + ' ins_usr as writer from product_board_inf_tbl, (SELECT @rownum:=' + skip + ') TMP where pno = ?' + addSQL
            + ' order by no desc limit ' + skip + ', ' + limit + ";",
            [pno, pno, srchText, pno, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[1][0].cnt;
                    console.log(">>> count : " + count);
                    var maxPage = Math.ceil(count / limit);
                    console.log(">>> rList = " + JSON.stringify(results[2]));

                    res.render('./productPopup', {
                        product: results[0][0],
                        rList: results[2],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });
        conn.end();
    }
});

// 검색 처리.
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    var pNo = req.body.pNo != null ? req.body.pNo : "";
    console.log(">>> srchType : " + srchType);
    console.log(">>> pNo : " + pNo);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' and title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' and writer like concat(?,"%")';
    }

    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;
    //console.log(">>> skip = " + skip);

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
        + ' from product_inf_tbl where pno = ? and displayyn = "y";'
        + ' select count(*) as cnt from product_board_inf_tbl where pno = ?' + addSQL
        + '; select @rownum:=@rownum+1 as num, no, pno, title, content, count, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date,'
        + ' ins_usr as writer from product_board_inf_tbl, (SELECT @rownum:=' + skip + ') TMP where pno = ?' + addSQL
        + ' order by no desc limit ' + skip + ', ' + limit + ";",
        [pNo, pNo, srchText, pNo, srchText],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                var count = results[1][0].cnt;
                console.log(">>> count : " + count);
                var maxPage = Math.ceil(count / limit);
                console.log(">>> rList = " + JSON.stringify(results[2]));

                res.render('./productPopup', {
                    product: results[0][0],
                    rList: results[2],
                    srchType: srchType,
                    srchText: srchText,
                    page: page,
                    maxPage: maxPage,
                    offset: offset,
                    session: ss
                });
            }
        });
    conn.end();
});


// 게시글 신규 화면
router.get('/:pno/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
        + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
        + ' where pno = ? and displayyn = "y";',
        [req.params.pno],
        function(err, results) {
            if(err) {

                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                res.render('./productPopupNew', {title: '게시글 작성 화면', product: results[0], session : ss});
            }
        }
    );
    conn.end();

});

// 게시글 신규 저장.
router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;
    var pno = req.body.pNo ? req.body.pNo : '';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('insert into product_board_inf_tbl(pno, title, content, ins_dt, ins_usr, ins_usrid, upd_dt, upd_usr,'
        + ' upd_usrid) values(?, ?, ?, now(), ?, ?, now(), ?, ?)',
        [pno, req.body.title, req.body.content, ss.usrName, ss.usrId, ss.usrName, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/products/'+pno);
            }
        });
    conn.commit();
    conn.end();

});

// 상세 게시글 화면 호출.
router.get('/:pno/view/:no', function(req, res) {

    var ss = req.session;
    var pNo = req.params.pno != null ? req.params.pno : "";
    var no = req.params.no != null ? req.params.no : "";

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('update product_board_inf_tbl set count = (select * from (select count+1 from product_board_inf_tbl'
        + ' where pno = ? and no = ?) as tmp) where pno = ? and no = ?',
        [pNo, no, pNo, no],
        function(err) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            }
        }
    );
    conn.commit();
    conn.end();

    console.log("뷰 조회.");
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    // 조회.
    conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
        + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
        + ' where pno = ? and displayyn = "y";'
        + ' select no, title, content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_usr as writer, count from product_board_inf_tbl where pno = ? and no = ?;'
        + ' select count(*) cnt from product_comment_inf_tbl where bno = ?;'
        + ' select rno as no, bno as bno, comment as comment, DATE_FORMAT(ins_dt,"%Y-%m-%d") as date, ins_id as id,'
        + ' ins_nm as name from product_comment_inf_tbl where bno = ?;',
        [pNo, pNo, no, no, no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board View !!!');
                console.log(">>> boards = " + JSON.stringify(results[0]));
                console.log(">>> boards = " + JSON.stringify(results[0][0].title));
                console.log(">>> reply = " + JSON.stringify(results[1]));
                console.log(">>> list = " + JSON.stringify(results[2]));
                res.render('./productPopupView', {product: results[0][0], board : results[1][0], reply : results[2][0], list : results[3], session : ss});
            }
        }
    );
    conn.end();

});

// 게시글 수정 화면 호출.
router.get('/:pno/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;
    var pNo = req.params.pno !=null ? req.params.pno : "";
    var no = req.params.no !=null ? req.params.no : "";

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
        + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
        + ' where pno = ? and displayyn = "y";'
        + ' select no, title, content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_usr as writer, count'
        + ' from product_board_inf_tbl where pno = ? and no = ?;',
        [pNo, pNo, no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board Edit Result !!!');
                res.render('./productPopupEdit', {title: '수정화면', product: results[0][0], board : results[1][0], session : ss});
            }
        });
    conn.end();
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;
    var pNo = req.body.pNo !=null ? req.body.pNo : "";
    var no = req.body.no !=null ? req.body.no : "";
    var title = req.body.title !=null ? req.body.title : "";
    var content = req.body.content !=null ? req.body.content : "";
    //var writer = req.body.writer !=null ? req.body.writer : "";

    console.log("게시글 수정 처리");

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('update product_board_inf_tbl set title = ?, content = ?, ins_dt = now(), ins_usr = ?, ins_usrid = ?,'
        + ' upd_dt = now(), upd_usr = ?, upd_usrid = ? where pno = ? and no = ?',
        [title, content, ss.usrName, ss.usrId, ss.usrName, ss.usrId, pNo, no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {
                res.redirect("/products/"+pNo+"/view/"+no);
            }
        });
    conn.commit();
    conn.end();
    /*
     console.log("수정후 상세 화면 호출처리.");
     conn.query('select @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from board_inf_tbl, (SELECT @rownum:=0) TMP where no = ?',
     [req.body.no],
     function(err, results) {
     if(err) {
     console.log('error : ', err.message);
     res.render('error', {message: err.message, error : err, session: ss});
     } else {
     console.log('routes board View Result !!!');
     res.render('./boards/view', {title: '게시글 상세 화면', board : results[0], session : ss});
     }
     });
     */
    // conn.end();
});

// 게시글 삭제.(get)
router.get('/:pno/delete/:no', function(req, res) {

    var ss = req.session;
    var pNo = req.params.pno !=null ? req.params.pno : "";
    var no = req.params.no !=null ? req.params.no : "";

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('delete from product_board_inf_tbl where pno = ? and no = ?',
        [pNo, no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {

                res.redirect("/products/"+pNo);
            }
        });
    conn.commit();
    conn.end();

    /*
     console.log("게시글 화면 호출처리.");
     conn.query('select @rownum:=@rownum+1 as num, pno, pname, ptype, psmmr, pdesc, pimage, pimage1, pimage2, pimage3'
     + ' from product_inf_tbl, (SELECT @rownum:=0) TMP'
     + ' where pno = ? and displayyn = "y";'
     + ' select no, title, content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as date, ins_usr as writer,'
     + ' count from product_board_inf_tbl where pno = ? and no = ?;'
     + ' select count(*) cnt from product_comment_inf_tbl where pno = ? and bno = ?;'
     + ' select rno as no, bno as bno, comment as comment, DATE_FORMAT(ins_dt,"%Y-%m-%d") as date, ins_id as id,'
     + ' ins_nm as name from product_comment_inf_tbl where pno = ? and bno = ?;',
     [pNo, pNo, no, pNo, no, pNo, no],
     function(err, results) {
     if(err) {
     console.log('error : ', err.message);
     res.render('error', {message: err.message, error : err, session: ss});
     } else {
     console.log('routes board View Result !!!');
     res.render('./productPopup', {title: '게시글 리스트 화면', product : results[0][0], board : results[1], reply : results[2][0], list : results[3], session : ss});
     }
     });
     */
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var ss = req.session;

    //var params = JSON.stringify(req.body['dataList[]']).split(','); // length 체크용.
    //var params2 = req.body['dataList[]'];
    //console.log(">>> get params = " + params);
    //console.log(">>> get params length = " + params.length);
    var params = req.body['dataList'];

    /*
     if(params.length==1) {
     conn.query('delete from product_board_inf_tbl where pno = ? and no = ?',
     [params2],
     function (err) {
     if (err) {
     console.log('error : ', err.message);
     //res.send(err);
     }
     }
     );
     } else if(params.length > 1) {
     */
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from board_inf_tbl where pno = ? and no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    conn.commit();
    conn.end();
    /*}*/

    res.json({'result' : 'OK'});
});

// 서브 코멘트 신규 저장.
router.post('/comment/new', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('insert into product_comment_inf_tbl(bno, pno, comment, ins_dt, ins_id, ins_nm) values(?, ?, ?, now(), ?, ?)',
        [req.body.no, req.body.pNo, req.body.comment, ss.usrId, ss.usrName],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : "OK", session: ss});
            }
        }
    );
    conn.commit();
    conn.end();

});

// 서브 코멘트 삭제.
router.post('/comment/del', function(req, res) {

    var ss = req.session;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    // 삭제 처리.
    conn.query('delete from product_comment_inf_tbl where rno = ? and bno = ? and pno = ? and ins_id = ?',
        [req.body.rno, req.body.bno, req.body.pNo, req.body.uid],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                conn.commit();
                res.json({result : "OK", session: ss});
            }
        }
    );
    conn.commit();
    conn.end();

});

/**
 * 분류별 상품 검색하여 처리함.
 */
router.post('/category/search', function(req, res) {
    console.log('category 검색 화면 호출');

    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var cateGubun = req.body.categoryGubun !=null ? req.body.categoryGubun : '';
    var cate2Gubun = req.body.category2Gubun !=null ? req.body.category2Gubun : '';
    var cate3Gubun = req.body.category3Gubun !=null ? req.body.category3Gubun : '';
    var addSQL1 = ''; var addSQL2 = '';  var addSQL3 = ''; var addSQL4 = '';
    console.log('cateGubun : ', cateGubun);
    console.log('cate2Gubun : ', cate2Gubun);
    console.log('cate3Gubun : ', cate3Gubun);
    if(cate2Gubun != '') {
        addSQL1 = ' AND category2 = ' + cate2Gubun;
    }

    if(cate3Gubun != '') {
        addSQL2 = ' AND category3 = ' + cate3Gubun;
    }


    var SQL0 = 'SELECT banner_img_url as imgUrl, banner_img_width as imgWidth, banner_img_height as imgHeight,'
        + ' banner_btn1_link_url as btn1LinkUrl, banner_btn1_link_nm as btn1LinkNm, banner_btn2_link_url as btn2LinkUrl,'
        + ' banner_btn2_link_nm as btn2LinkNm, banner_btn3_link_url as btn3LinkUrl, banner_btn3_link_nm as btn3LinkNm,'
        + ' banner_btn4_link_url as btn4LinkUrl, banner_btn4_link_nm as btn4LinkNm, banner_btn5_link_url as btn5LinkUrl,'
        + ' banner_btn5_link_nm as btn5LinkNm, banner_img_file_url as imgFileUrl, banner_img_file_nm as imgFileNm'
        + ' FROM product_banner_inf_tbl;';
    var SQL1 = "SELECT p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType, p_gubun_cd as pGubunCd, p_smmry as pSmmry, p_desc as pDesc,"
        + " category1 as cate1, category2 as cate2, category3 as cate3, p_image_url pImageUrl, p_image as pImage, insert_dt as insDate"
        + " FROM product_lab_info_tbl WHERE p_div = 'M' AND p_display_yn = 'Y' AND p_gubun_cd = 'L00' AND category1 = ?";
    var SQL2 = ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;';
    addSQL3 = 'SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM product_category_inf_tbl AS t1'
        + ' LEFT JOIN product_category_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = "' + cateGubun + '";';
    addSQL4 = 'SELECT t3.name as cateName3, t3.category_no as cateNo3 FROM product_category_inf_tbl AS t2'
        + ' LEFT JOIN product_category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t2.category_no = "' + cate2Gubun + '";';


    // 왼쪽메뉴 상품 리스트 조회
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL0 + SQL1 + addSQL1 + addSQL2 + ';' + SQL2 + addSQL3 + addSQL4,
        [cateGubun],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {

                res.render('./products', {
                    'result' : results[0][0],
                    'rCnt' : results[1].length,
                    'rList' : results[1],
                    'cList' : results[2],
                    'cList2' : results[3] != null ? results[3] : '',
                    'cList3' : results[4] != null ? results[4] : '',
                    'cateGubun' : cateGubun,
                    'cate2Gubun' : cate2Gubun,
                    'cate3Gubun' : cate3Gubun,
                    'order' : '',
                    'session' : ss
                });
            }
        });
    conn.end();

});

/**
 * 추천순 최신순별 상품 검색하여 처리함.
 */
router.post('/order/search', function(req, res) {
    console.log('order 검색 화면 호출');

    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var cateGubun = req.body.categoryGubun !=null ? req.body.categoryGubun : '';
    var cate2Gubun = req.body.category2Gubun !=null ? req.body.category2Gubun : '';
    var cate3Gubun = req.body.category3Gubun !=null ? req.body.category3Gubun : '';
    var order = req.body.order !=null ? req.body.order : '';
    var addSQL0 = ''; var addSQL1 = ''; var addSQL2 = '';  var addSQL3 = ''; var addSQL4 = ''; var addSQL5 = '';
    console.log('cateGubun : ', cateGubun);
    console.log('cate2Gubun : ', cate2Gubun);
    console.log('cate3Gubun : ', cate3Gubun);
    console.log('order : ', order);

    if(cateGubun != '') {
        addSQL0 = ' AND category1 = ' + cateGubun;
    }

    if(cate2Gubun != '') {
        addSQL1 = ' AND category2 = ' + cate2Gubun;
    }

    if(cate3Gubun != '') {
        addSQL2 = ' AND category3 = ' + cate3Gubun;
    }

    if(order != '') {
        if(order == 'best') {
            addSQL3 = ' ORDER BY set_best_yn ';
        } else {
            addSQL3 = ' ORDER BY insert_dt DESC';
        }
    }

    var SQL0 = 'SELECT banner_img_url as imgUrl, banner_img_width as imgWidth, banner_img_height as imgHeight,'
        + ' banner_btn1_link_url as btn1LinkUrl, banner_btn1_link_nm as btn1LinkNm, banner_btn2_link_url as btn2LinkUrl,'
        + ' banner_btn2_link_nm as btn2LinkNm, banner_btn3_link_url as btn3LinkUrl, banner_btn3_link_nm as btn3LinkNm,'
        + ' banner_btn4_link_url as btn4LinkUrl, banner_btn4_link_nm as btn4LinkNm, banner_btn5_link_url as btn5LinkUrl,'
        + ' banner_btn5_link_nm as btn5LinkNm, banner_img_file_url as imgFileUrl, banner_img_file_nm as imgFileNm'
        + ' FROM product_banner_inf_tbl;';
    var SQL1 = " SELECT p_code as pCode, p_uniq_code as pUniqCode, p_nm as pNm, p_type as pType, p_gubun_cd as pGubunCd, p_smmry as pSmmry, p_desc as pDesc,"
        + " category1 as cate1, category2 as cate2, category3 as cate3, p_image_url pImageUrl, p_image as pImage, set_best_yn as setBestYn, insert_dt as insDate"
        + " FROM product_lab_info_tbl WHERE p_div = 'M' AND p_display_yn = 'Y' AND p_gubun_cd = 'L00'";
    var SQL2 = ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;';
    addSQL4 = 'SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM product_category_inf_tbl AS t1'
        + ' LEFT JOIN product_category_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = "' + cateGubun + '";';
    addSQL5 = 'SELECT t3.name as cateName3, t3.category_no as cateNo3 FROM product_category_inf_tbl AS t2'
        + ' LEFT JOIN product_category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t2.category_no = "' + cate2Gubun + '";';

    // 왼쪽메뉴 상품 리스트 조회
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL0 + SQL1 + addSQL0 + addSQL1 + addSQL2 + addSQL3 + ';' + SQL2 + addSQL4 + addSQL5,
        [],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {

                res.render('./products', {
                    'result' : results[0][0],
                    'rCnt' : results[1].length,
                    'rList' : results[1],
                    'cList' : results[2],
                    'cList2' : results[3] != null ? results[3] : '',
                    'cList3' : results[4] != null ? results[4] : '',
                    'cateGubun' : cateGubun,
                    'cate2Gubun' : cate2Gubun,
                    'cate3Gubun' : cate3Gubun,
                    'order' : order,
                    'session' : ss
                });
            }
        });
    conn.end();

});

module.exports = router;
