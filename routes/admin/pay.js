/*
 * 모듈명  : pay.js
 * 설명    : 관리자화면 '결제 관리' 에 대한 모듈.
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
var request = require('request');
var Iamport = require('iamport');
var iamport = new Iamport({
    //impKey : '6727859979366252',
    //impSecret : 'npEtTRfzAuks0hrLfQpR5V3d4kqJXkZlJEPDv4c6zxzAO1l4RKVWFZaKkBtiVtDF8siExvK72kHRl3Vc'
    // 테스트용
    impKey : 'imp_apikey',
    impSecret : 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f'
});
var async = require('async');
var router = express.Router();

var config = require('../common/dbconfig');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection(config);
conn.connect();

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

            var srchType = req.query.srchType != null ? req.query.srchType : "";
            var srchText = req.query.srchText != null ? req.query.srchText : "";
console.log(">>> srchType : " + srchType + ' <<< \n');
            var addSQL = "";
            if (srchType == "orderNo") {
                addSQL = ' WHERE order_no = ?';
            } else if (srchType == "usrId") {
                addSQL = ' WHERE usr_id = ?';
            }
            // 페이징 처리.
            var reqPage = req.query.page ? parseInt(req.query.page) : 0;
            //console.log(">>> reqPage = " + reqPage);
            var offset = 3;
            var page = Math.max(1, reqPage);
            //console.log(">>> page = " + page);
            var limit = 10;
            var skip = (page - 1) * limit;

            // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
            conn.query('SELECT count(*) as cnt FROM tbl_pay' + addSQL
                + '; SELECT @rownum:=@rownum+1 as num, pay_code as payCode, order_no as orderNo, usr_id as usrId, FORMAT(p_total_price,0) as payPrice,'
                + ' case when pay_method = "card" then "카드" when pay_method = "trans" then "계좌이체"'
                + ' when pay_method = "phone" then "휴대폰소액결제" when pay_method = "bank" then "무통장입금"'
                + ' when pay_method = "escro" then "농협에스크로" when pay_method = "paypal" then "페이팔" else "" end as payMethod,'
                + ' DATE_FORMAT(pay_date, "%Y-%m-%d %H:%m") as payDate, pay_result as payStatus,'
                + ' case when tax_invoice_req_yn = "Y" then "있음" when tax_invoice_req_yn = "N" then "없음" else "" end as taxInvoiceReqYn,'
                + ' tax_invoice_yn as taxInvoiceYn, refund_req_yn as refundReqYn,'
                + ' case when refund_req_yn = "Y" then "있음" when refund_req_yn = "N" then "없음" else "" end as refundReqYnNm,'
                + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as insDate, insert_usr as insUsr FROM tbl_pay, (SELECT @rownum:=' + skip + ') TMP' + addSQL
                + ' GROUP BY pay_code'
                + ' ORDER BY pay_date DESC LIMIT ' + skip + ', ' + limit + ";"
                + ' SELECT comm_cd as commCd, comm_nm as commNm FROM tbl_commcd WHERE p_comm_cd = "P002" ORDER BY comm_cd ASC;',
                [srchText, srchText],
                function (err, results) {
                    if (err) {
                        console.log('error : ', err.message);
                    } else {
                        var count = results[0][0].cnt;
                        var maxPage = Math.ceil(count / limit);

                        res.render('./admin/pay/list', {
                            rList: results[1],
                            rList2 : results[2],
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
            res.redirect('admin');
        }
});

// 게시글 리스트 호출.
router.post('/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if(srchType=="orderNo") {
        addSQL =  ' WHERE order_no = ?';
    } else if(srchType=="usrId") {
        addSQL =  ' WHERE usr_id = ?';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt FROM tbl_pay' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, pay_code as payCode, order_no as orderNo, usr_id as usrId, FORMAT(p_total_price,0) as payPrice,'
        + ' case when pay_method = "card" then "카드" when pay_method = "trans" then "계좌이체"'
        + ' when pay_method = "phone" then "휴대폰소액결제" when pay_method = "bank" then "무통장입금"'
        + ' when pay_method = "escro" then "농협에스크로" when pay_method = "paypal" then "페이팔" else "" end as payMethod,'
        + ' DATE_FORMAT(pay_date, "%Y-%m-%d %H:%m") as payDate, pay_result as payStatus,'
        + ' case when tax_invoice_req_yn = "Y" then "있음" when tax_invoice_req_yn = "N" then "없음" else "" end as taxInvoiceReqYn,'
        + ' tax_invoice_yn as taxInvoiceYn, refund_req_yn as refundReqYn,'
        + ' case when refund_req_yn = "Y" then "있음" when refund_req_yn = "N" then "없음" else "" end as refundReqYnNm,'
        + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as insDate, insert_usr as insUsr FROM tbl_pay, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' GROUP BY pay_code'
        + ' ORDER BY pay_date DESC LIMIT ' + skip + ', ' + limit + ";"
        + ' SELECT comm_cd as commCd, comm_nm as commNm FROM tbl_commcd WHERE p_comm_cd = "P002" ORDER BY comm_cd ASC;',
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/pay/list', {
                    rList : results[1],
                    rList2 : results[2],
                    srchType: srchType,
                    srchText : srchText,
                    page : page,
                    maxPage: maxPage,
                    offset: offset,
                    session : ss
                });
            }
        });
});

// 사용안함.
router.get('/new', function(req, res) {
    console.log('routes  추가 결제화면 화면 호출');
    var ss = req.session;
    res.render('./admin/pay/new', {session : ss});
});

/**
 * 결제 업데이트 처리 (승인대기/결제완료/ 결제상태 변경 처리)
 */
router.post('/save', function(req, res) {
    console.log('routes 결제화면 업데이트 처리');
    console.log('req.body : ', JSON.stringify(req.body));
    var ss = req.session;
    // 배열 변수 초기화.
    var paramPayCode = [];
    var paramOrderNo = [];
    var paramPayStatus = [];
    var paramUsrId = [];
    var paramTaxInvoiceYn = [];

    // 요청 파라미터 취득.
    var checkBoxCnt = req.body.checkBoxCnt !=null ? req.body.checkBoxCnt : 0;
    var sPayCode = req.body['payCode[]'] !=null ? req.body['payCode[]'] : '';
    var sOrderNo = req.body['orderNo[]'] !=null ? req.body['orderNo[]'] : '';
    var sPayStatus = req.body['payStatus[]'] !=null ? req.body['payStatus[]'] : '';
    var sUsrId = req.body['usrId[]'] !=null ? req.body['usrId[]'] : '';
    var sTaxInvoiceYn = req.body['taxInvoiceYn[]'] !=null ? req.body['taxInvoiceYn[]'] : 'N';

    if(checkBoxCnt > 1) {

        // 체크 갯수만큼 반복처리.
        for (var x = 0; x < checkBoxCnt; x++) {

            // LOOP 처리.
            (function () {
                var idx = x;


                paramPayCode[idx] = sPayCode[idx] != null ? sPayCode[idx] : '';
                paramOrderNo[idx] = sOrderNo[idx] != null ? sOrderNo[idx] : '';
                paramPayStatus[idx] = sPayStatus[idx] != null ? sPayStatus[idx] : '';
                paramUsrId[idx] = sUsrId[idx] != null ? sUsrId[idx] : '';
                paramTaxInvoiceYn[idx] = sTaxInvoiceYn[idx] != null ? sTaxInvoiceYn[idx] : '';

                /*
                 console.log('paramPayCode['+idx+'] : ', paramPayCode[idx]);
                 console.log('paramOrderNo['+idx+'] : ', paramOrderNo[idx]);
                 console.log('paramPayStatus['+idx+'] : ', paramPayStatus[idx]);
                 console.log('paramUsrId['+idx+'] : ', paramUsrId[idx]);
                 console.log('paramTaxInvoiceYn['+idx+'] : ', paramTaxInvoiceYn[idx]);
                 */

                var addSQL = 'expire_yn = "N"';
                if (paramPayStatus[x] == "paid") {
                    addSQL = 'expire_yn = "N"';
                } else {
                    addSQL = 'expire_yn = "Y"';
                }

                async.waterfall([
                    function (callback) {

                        // 결제 테이블 수정처리.
                        conn.query('UPDATE tbl_pay SET pay_result = ?,' + addSQL + ', tax_invoice_yn = ? WHERE pay_code = ? AND usr_id = ?',
                            [paramPayStatus[idx], paramTaxInvoiceYn[idx], paramPayCode[idx], paramUsrId[idx]],
                            function (err, results) {
                                if (err) {
                                    console.log('err : ', err);
                                } else {
                                    console.log('결제 테이블 수정 처리 완료.');
                                    console.dir(results);
                                }
                            });
                        callback(null);
                    },
                    function (callback) {

                        // 주문 테이블 수정처리.
                        conn.query('UPDATE tbl_order x INNER JOIN tbl_pay y ON x.order_no = y.order_no SET x.pay_result = ? WHERE y.pay_code = ? AND y.usr_id = ?',
                            [paramPayStatus[idx], paramPayCode[idx], paramUsrId[idx]],
                            function (err, results) {
                                if (err) {
                                    console.log('err : ', err);
                                } else {
                                    console.log('주문 테이블 수정 처리 완료.');
                                    console.dir(results);
                                }
                            });
                        callback(null);
                    }
                ], function (err, result) {
                    // result에는 '끝'이 담겨 온다.
                    //console.log(' async result : ', result);
                });

            })();

        } // end for

    } else {
        var addSQL = 'expire_yn = "N"';
        if (sPayStatus == "paid") {
            addSQL = 'expire_yn = "N"';
        } else {
            addSQL = 'expire_yn = "Y"';
        }

        async.waterfall([
            function (callback) {

                // 결제 테이블 수정처리.
                conn.query('UPDATE tbl_pay SET pay_result = ?,' + addSQL + ', tax_invoice_yn = ? WHERE pay_code = ? AND usr_id = ?',
                    [sPayStatus, sTaxInvoiceYn, sPayCode, sUsrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.log('결제 테이블 수정 처리 완료.');
                            console.dir(results);
                        }
                    });
                callback(null);
            },
            function (callback) {

                // 주문 테이블 수정처리.
                conn.query('UPDATE tbl_order x INNER JOIN tbl_pay y ON x.order_no = y.order_no SET x.pay_result = ? WHERE y.pay_code = ? AND y.usr_id = ?',
                    [sPayStatus, sPayCode, sUsrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.log('주문 테이블 수정 처리 완료.');
                            console.dir(results);
                        }
                    });
                callback(null);
            }
        ], function (err, result) {
            // result에는 '끝'이 담겨 온다.
            //console.log(' async result : ', result);
        });
    }

    // 결제화면 리로딩.
    res.redirect('/admin/pay');

});

/**
 * 결제 업데이트 처리 (세금계산서 / 코드전송여부 변경 처리)
 */
router.post('/update', function(req, res) {
    console.log('routes 결제화면 업데이트 처리');
    console.log('req.body : ', JSON.stringify(req.body));
    var ss = req.session;

    var sOrderNo = req.body.orderNo !=null ? req.body.orderNo : '';
    var sUsrId = req.body.usrId !=null ? req.body.usrId : '';
    var sTaxInvoiceYn = req.body.taxInvoiceYn !=null ? req.body.taxInvoiceYn : 'N';
    var sCodeSendYn = req.body.codeSendYn !=null ? req.body.codeSendYn : 'N';
console.log('sOrderNo : ', sOrderNo);
console.log('sUsrId : ', sUsrId);
console.log('sTaxInvoiceYn : ', sTaxInvoiceYn);
console.log('sCodeSendYn : ', sCodeSendYn);

    // 결제 테이블 수정처리.
    conn.query('UPDATE tbl_pay SET tax_invoice_yn = ?, code_send_yn = ? WHERE order_no = ? AND usr_id = ?',
        [sTaxInvoiceYn, sOrderNo, sCodeSendYn, sUsrId],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                console.log('세금계산서 수정 처리 완료.');
                console.dir(results);
                res.status(200).json({'result' : 'OK', 'session' : ss});
            }
        }
    );

});

// 상세 게시글 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 팝업화면 호출처리.");
    var ss = req.session;
    var payCode = req.params.no !=null ? req.params.no : '';
    console.log('payCode : ', payCode);

    conn.query('SELECT @rownum:=@rownum+1 as num, z.* FROM ('
        + 'SELECT y.pay_code as payCode, x.order_no as orderNo, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
        + ' CASE WHEN x.p_type = "SVC" THEN "서비스" WHEN x.p_type = "HDW" THEN "하드웨어" ELSE "" END as pTypeNm,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' x.p_nm as pNm, x.p_uniq_code as pUniqCode, FORMAT(x.p_price,0) as pPrice, x.sort_no as sortNo'
        + ' FROM tbl_order_detail x, tbl_pay y'
        + ' WHERE x.order_no = y.order_no AND y.pay_code = ? ORDER BY sort_no ASC'
        + ' ) z, (SELECT @rownum:=0) TMP',
        [payCode],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);
                console.log('results.length : ', results.length);
                res.render('./admin/pay/view', {'rList' : results, 'session' : ss});
            }
        });
});


// 고객번호로 정보 조회.
router.get('/user/view/:usrId', function(req, res) {

    var ss = req.session;
    var usrId = req.params.usrId != null ? req.params.usrId : "";
    //console.log(">>>> usrNo : " + usrNo);

    conn.query('select x.c_no as cNo, x.c_id as cId, x.c_name as cName, x.c_email as cEmail,'
    + ' x.c_sex as cSex, x.c_tel_no as cTelNo, x.c_cell_no as cCellNo,'
    + ' (select comm_nm from tbl_commcd WHERE p_comm_cd = "U000" and comm_cd = x.c_user_tp) as cUserTp,'
    + ' (select comm_nm from tbl_commcd WHERE p_comm_cd = "M000" and comm_cd = x.c_auth_level) as cAuthLevel'
    + ' from tbl_user x WHERE c_id = ?',
        [usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                //console.log('routes pay View Result !!!');

                //console.log(">>> render !!!");
                res.render('./admin/pay/userView', {result : results[0], session : ss});
            }
        });
});

// 환불 요청 상세 조회.
router.get('/refund/req/view/:no', function(req, res) {

    var ss = req.session;
    var orderNo = req.params.no != null ? req.params.no : "";
    //console.log(">>>> usrNo : " + usrNo);

    conn.query('SELECT order_no as orderNo, usr_id as usrId, FORMAT(p_total_price,0) as totalPayPrice,'
        + ' DATE_FORMAT(refund_req_date, "%Y-%m-%d %H:%m") as refundReqDate,'
        + ' DATE_FORMAT(pay_date,"%Y-%m-%d %H:%m") as payDate, refund_req_memo as memo,'
        + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays'
        + ' FROM tbl_pay WHERE order_no = ? AND refund_req_yn = "Y"',
        [orderNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                //console.log('routes pay View Result !!!');

                //console.log(">>> render !!!");
                res.render('./admin/pay/refundView', {result : results[0], session : ss});
            }
        });
});

// 환불 처리
router.post('/refund/process', function(req, res, next) {
    var ss = req.session;

    console.log('환불 처리 시작');
// 환불공식
// 남은 금액 : 결제금액 / 개월수 * 남은 달수
// 사용 금액 : 월이용료 * (개월수 - 남은 달수)
// 환불 예상 금액 : 결제금액 - 사용금액 - 할인 금액
    var ss = req.session;
    var payNo = req.body.payNo !=null ? req.body.payNo : '';
console.log('payNo = ', payNo);
    var basicPrice = 50000;
    var opt1Price = 50000;
    var opt2Price = 90000;
    var opt3Price = 35000;
    var basicMonthPrice = parseInt(basicPrice * 30 / 30);
    var opt1MonthPrice = parseInt(opt1Price * 30 / 30);
    var opt2MonthPrice = parseInt(opt2Price * 30 / 30);
    var opt3MonthPrice = parseInt(opt3Price * 30 / 30);
    var monthPayPrice = parseInt(basicMonthPrice + opt1MonthPrice + opt2MonthPrice + opt3MonthPrice);
    var giganUsePrice = 0;

    conn.query('SELECT pay_no as payNo, pno as pNo, pname as pName, pprice as pprice, pdc_price as pDcPrice, pay_price as payPrice,'
        + ' pay_method as payMethod, pay_date as payDate, use_month_cnt as useMonthCnt, from_dt as fromDt, DATE_FORMAT(to_dt, "%Y%m%d") as toDt,'
        + ' opt1_use_yn as opt1UseYn, opt2_use_yn as opt2UseYn, opt3_use_yn as opt3UseYn,'
        + ' total_pay_price as totalPayPrice FROM tbl_pay WHERE refund_req_yn = "Y" AND refund_yn = "N" AND pay_no = ?',
        [payNo],
        function(err, results) {
            if (err) {
                console.log('err : ', err);
            } else {
                var cnt = results.length;
console.log('results.length : ', cnt);
                var resultVals;
                // 기존 서비스 가 있는 지 체크.
                if (cnt > 0) {
                    // 결제 금액
                    var pPrice = results[0].pprice !=null ? parseInt(results[0].pprice) : 0; // 월이용료
                    var paidPrice = results[0].totalPayPrice !=null ? parseInt(results[0].totalPayPrice) : 0;
                    var month = results[0].useMonthCnt !=null ? parseInt(results[0].useMonthCnt) : 0;
                    //var dc = results[0].pDcPrice !=null ? parseInt(results[0].pDcPrice) : 0;
                    var dc = 0;
                    giganUsePrice = parseInt(monthPayPrice * month);
                    if(month=='12') {
                        if(results[0].opt1UseYn=='Y' && results[0].opt2UseYn=='Y' && results[0].opt3UseYn=='Y') {
                            dc = 15;
                        } else {
                            dc = 10;
                        }
                        var dcPrice = parseInt(giganUsePrice * (dc / 100));
                    } else {
                        var dcPrice = results[0].pDcPrice != null ? parseInt(results[0].pDcPrice) : 0;
                    }
console.log('pPrice : ', pPrice);
console.log('paidPrice : ', paidPrice);
console.log('month : ', month);
console.log('dcPrice : ', dcPrice);
                    // 남은 월수 조회.
                    var remainMonth = fncRemainMonth(results[0].toDt);
                    // 남은 금액
                    var remainPaidPrice = parseInt(paidPrice / month * remainMonth);
                    // 사용 금액 (월이용료 * (개월수-남은달수))
                    var usedPrice = parseInt(pPrice * (month-remainMonth));
                    // 환불예상금액 (결제금액 - 사용금액 - 할인금액)
                    var refundPrice = parseInt(paidPrice - usedPrice - dcPrice);
console.log('remainMonth : ', remainMonth);
console.log('remainPaidPrice : ', remainPaidPrice);
console.log('usedPrice : ', usedPrice);
console.log('refundPrice : ', refundPrice);
                    // 기본/옵션 수정 처리.
                    conn.query('UPDATE tbl_pay SET pay_result = "refunded", expire_yn = "Y", refund_price = ?,'
                        + ' refund_req_yn = "N", refund_yn = "Y", refund_date = now(), upd_dt = now(), upd_id = ? WHERE pay_no = ?;'
                        + ' UPDATE pay_opt_inf_tbl SET opt_pay_result = "refunded", opt_refund_req_yn = "N", opt_refund_yn = "Y",'
                        + ' opt_refund_date = now(), upd_dt = now(), upd_id = ? WHERE pay_no = ?',
                        [refundPrice, ss.usrId, payNo, ss.usrId, payNo],
                        function(err, results) {
                            if(err) {
                                console.log('err : ', err);
                            } else {
                                console.dir(results);
                            }
                        }
                    );

                    resultVals = {
                        'remainMonth' : remainMonth,
                        'remainPaidPrice' : remainPaidPrice,
                        'usedPrice' : usedPrice,
                        'refundPrice' : refundPrice
                    };
                    res.status(200).json({'result' : 'OK', 'resultVals' : resultVals, 'session' : ss});
                } else {
                    res.status(200).json({'result' : 'fail', 'resultVals' : '', 'session' : ss});
                }
            }
        });
});

// PG 대행사 처리 조회.
router.get('/getPayList', function(req, res) {
    console.log(">>> req.query.imp_uid : " + req.query.imp_uid);
    //아임포트 고유 아이디로 결제 정보를 조회
    iamport.payment.getByImpUid({
       //imp_uid: 'imp11226682'
        imp_uid: req.query.imp_uid
    }).then(function(result){
        console.log(">>> result : " + result);
        res.json({result : result});
    }).catch(function(error){
        console.log(">>> error result : " + error);
        res.json({result : error});
    });
});

// PG 대행사 처리 조회.
router.get('/getPayStatus', function(req, res) {
    // 상태별 결제 정보 조회
    iamport.payment.getByStatus({
        payment_status: 'your payment_status'
    }).then(function(result){
        console.log(">>> result : " + result);
        res.json({result: result});
    }).catch(function(error){
        console.log(">>> error result : " + error);
        res.json({result: result});
    });
});

/**
 * 주문 상세 테이블 조회.
 */
router.get('/order/list', function(req, res) {
console.log('주문 상세 테이블 조회 화면 호출');

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "orderNo") {
            addSQL = ' WHERE order_no = ?';
        } else if (srchType == "usrId") {
            addSQL = ' WHERE usr_id = ?';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        // 추가 SQL문
        var SQL = 'SELECT COUNT(*) as cnt FROM tbl_order_detail';
        var SQL1 = 'SELECT @rownum:=@rownum+1 as num, order_no as orderNo, usr_id as usrId, p_code as pCode,'
            + ' CASE WHEN p_div = "M" THEN "서비스" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
            + ' CASE WHEN p_pair_code_yn = "Y" THEN "있음" WHEN p_pair_code_yn = "N" THEN "없음" ELSE "" END as pPairCodeYn,'
            + ' p_pair_code as pPairCode, p_nm as pNm, FORMAT(p_price, 0) as pPrice, p_uniq_code as pUniqCode,'
            + ' CASE WHEN p_opt_btn_dis_yn = "Y" THEN "있음" WHEN p_opt_btn_dis_yn = "N" THEN "없음" ELSE "" END as pOptBtnDisYn,'
            + ' opt_cnt as optCnt, sort_no as sortNo, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insertDt, ins_id as insertUsr'
            + ' FROM tbl_order_detail, (SELECT @rownum:=' + skip + ') TMP';
        var SQL2 = ' ORDER BY ins_dt DESC LIMIT ' + skip + ', ' + limit + ';';

        conn.query(SQL+addSQL+'; '+SQL1+addSQL+SQL2, [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/pay/order/list', {
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
        res.redirect('admin');
    }
});

/**
 * 주문 상세 테이블 검색 조회.
 */
router.post('/order/list/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if (srchType == "orderNo") {
        addSQL = ' WHERE order_no = ?';
    } else if (srchType == "usrId") {
        addSQL = ' WHERE usr_id = ?';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1, reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page - 1) * limit;
    // 추가 SQL문
    var SQL = 'SELECT COUNT(*) as cnt FROM tbl_order_detail';
    var SQL1 = 'SELECT @rownum:=@rownum+1 as num, order_no as orderNo, usr_id as usrId, p_code as pCode,'
        + ' CASE WHEN p_div = "M" THEN "서비스" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' CASE WHEN p_pair_code_yn = "Y" THEN "있음" WHEN p_pair_code_yn = "N" THEN "없음" ELSE "" END as pPairCodeYn,'
        + ' p_pair_code as pPairCode, p_nm as pNm, FORMAT(p_price, 0) as pPrice, p_uniq_code as pUniqCode,'
        + ' CASE WHEN p_opt_btn_dis_yn = "Y" THEN "있음" WHEN p_opt_btn_dis_yn = "N" THEN "없음" ELSE "" END as pOptBtnDisYn,'
        + ' opt_cnt as optCnt, sort_no as sortNo, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insertDt, ins_id as insertUsr'
        + ' FROM tbl_order_detail, (SELECT @rownum:=' + skip + ') TMP';
    var SQL2 = ' ORDER BY ins_dt DESC LIMIT ' + skip + ', ' + limit + ';';

    conn.query(SQL+addSQL+'; '+SQL1+addSQL+SQL2, [srchText, srchText],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/pay/order/list', {
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
});

/**
 * 결산 조회
 */
router.get('/settling/list', function(req, res, next) {

    var ss = req.session;
    var SQL1 = '';
    var SQL2 = '';
    // 현재날짜 셋팅.
    var dt = new Date();
    var nowYear = dt.getFullYear();
    var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
    var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
    var nowDate = nowYear.toString() + "-" + nowMonth.toString() + "-" + nowDay.toString();
    // 검색 조건 셋팅.
    var srchDateFrom = req.query.srchDateFrom != null ? req.query.srchDateTo : '';
    var srchDateTo = req.query.srchDateTo != null ? req.query.srchDateTo : '';
    if(srchDateFrom == '') {
        srchDateFrom = nowYear + '-' + '01-01';
    }
    if(srchDateTo == '') {
        srchDateTo = nowDate;
    }

    console.log('srchDateFrom : ', srchDateFrom);
    console.log('srchDateTo : ', srchDateTo);

    // 년월일 조회용 SQL
    SQL1 = 'SELECT';
    SQL1 += ' `year`,';
    SQL1 += ' `month`,';
    SQL1 += ' IFNULL(sum(case when dd =  1 then p_sum_price end),0) as `dd1`,';
    SQL1 += ' IFNULL(sum(case when dd =  2 then p_sum_price end), 0) as `dd2`,';
    SQL1 += ' IFNULL(sum(case when dd=  3 then p_sum_price end), 0) as `dd3`,';
    SQL1 += ' IFNULL(sum(case when dd =  4 then p_sum_price end), 0) as `dd4`,';
    SQL1 += ' IFNULL(sum(case when dd =  5 then p_sum_price end), 0) as `dd5`,';
    SQL1 += ' IFNULL(sum(case when dd =  6 then p_sum_price end), 0) as `dd6`,';
    SQL1 += ' IFNULL(sum(case when dd =  7 then p_sum_price end), 0) as `dd7`,';
    SQL1 += ' IFNULL(sum(case when dd =  8 then p_sum_price end), 0) as `dd8`,';
    SQL1 += ' IFNULL(sum(case when dd =  9 then p_sum_price end), 0) as `dd9`,';
    SQL1 += ' IFNULL(sum(case when dd = 10 then p_sum_price end), 0) as `dd10`,';
    SQL1 += ' IFNULL(sum(case when dd = 11 then p_sum_price end), 0) as `dd11`,';
    SQL1 += ' IFNULL(sum(case when dd = 12 then p_sum_price end), 0) as `dd12`,';
    SQL1 += ' IFNULL(sum(case when dd = 13 then p_sum_price end), 0) as `dd13`,';
    SQL1 += ' IFNULL(sum(case when dd = 14 then p_sum_price end), 0) as `dd14`,';
    SQL1 += ' IFNULL(sum(case when dd = 15 then p_sum_price end), 0) as `dd15`,';
    SQL1 += ' IFNULL(sum(case when dd = 16 then p_sum_price end), 0) as `dd16`,';
    SQL1 += ' IFNULL(sum(case when dd = 17 then p_sum_price end), 0) as `dd17`,';
    SQL1 += ' IFNULL(sum(case when dd = 18 then p_sum_price end), 0) as `dd18`,';
    SQL1 += ' IFNULL(sum(case when dd = 19 then p_sum_price end), 0) as `dd19`,';
    SQL1 += ' IFNULL(sum(case when dd = 20 then p_sum_price end), 0) as `dd20`,';
    SQL1 += ' IFNULL(sum(case when dd = 21 then p_sum_price end), 0) as `dd21`,';
    SQL1 += ' IFNULL(sum(case when dd = 22 then p_sum_price end), 0) as `dd22`,';
    SQL1 += ' IFNULL(sum(case when dd = 23 then p_sum_price end), 0) as `dd23`,';
    SQL1 += ' IFNULL(sum(case when dd = 24 then p_sum_price end), 0) as `dd24`,';
    SQL1 += ' IFNULL(sum(case when dd = 25 then p_sum_price end), 0) as `dd25`,';
    SQL1 += ' IFNULL(sum(case when dd = 26 then p_sum_price end), 0) as `dd26`,';
    SQL1 += ' IFNULL(sum(case when dd = 27 then p_sum_price end), 0) as `dd27`,';
    SQL1 += ' IFNULL(sum(case when dd = 28 then p_sum_price end), 0) as `dd28`,';
    SQL1 += ' IFNULL(sum(case when dd = 29 then p_sum_price end), 0) as `dd29`,';
    SQL1 += ' IFNULL(sum(case when dd = 30 then p_sum_price end), 0) as `dd30`,';
    SQL1 += ' IFNULL(sum(case when dd = 31 then p_sum_price end), 0) as `dd31`';
    SQL1 += ' FROM (select extract(year from pay_date) `year`,';
    SQL1 += ' extract(month from pay_date) `month`,';
    SQL1 += ' extract(day from pay_date) as dd, p_sum_price';
    SQL1 += ' from tbl_pay';
    SQL1 += ' WHERE pay_date >= DATE_FORMAT("' + srchDateFrom + '","%Y-%m-%d 00:00:00") and pay_date <= DATE_FORMAT("' + srchDateTo + '", "%Y-%m-%d 23:59:59")';
    SQL1 += ' and pay_result = "paid") as t';
    SQL1 += ' GROUP BY `year`, `month`;';

    console.log('SQL1 : ', SQL1 + '\n');

    // 년월 조회용 SQL
    SQL2 = 'SELECT';
    SQL2 += ' `year`,';
    SQL2 += ' IFNULL(sum(case when mm =  1 then p_sum_price end),0) as `mm1`,';
    SQL2 += ' IFNULL(sum(case when mm =  2 then p_sum_price end), 0) as `mm2`,';
    SQL2 += ' IFNULL(sum(case when mm =  3 then p_sum_price end), 0) as `mm3`,';
    SQL2 += ' IFNULL(sum(case when mm =  4 then p_sum_price end), 0) as `mm4`,';
    SQL2 += ' IFNULL(sum(case when mm =  5 then p_sum_price end), 0) as `mm5`,';
    SQL2 += ' IFNULL(sum(case when mm =  6 then p_sum_price end), 0) as `mm6`,';
    SQL2 += ' IFNULL(sum(case when mm =  7 then p_sum_price end), 0) as `mm7`,';
    SQL2 += ' IFNULL(sum(case when mm =  8 then p_sum_price end), 0) as `mm8`,';
    SQL2 += ' IFNULL(sum(case when mm =  9 then p_sum_price end), 0) as `mm9`,';
    SQL2 += ' IFNULL(sum(case when mm = 10 then p_sum_price end), 0) as `mm10`,';
    SQL2 += ' IFNULL(sum(case when mm = 11 then p_sum_price end), 0) as `mm11`,';
    SQL2 += ' IFNULL(sum(case when mm = 12 then p_sum_price end), 0) as `mm12`,';
    SQL2 += ' (select IFNULL(SUM(p_sum_price), 0)';
    SQL2 += ' from tbl_pay';
    SQL2 += ' WHERE extract(year from pay_date) = t.year';
    SQL2 += ' and pay_result = "paid"';
    SQL2 += ' and refund_yn = "N"';
    SQL2 += ' and refund_req_yn = "N"';
    SQL2 += ' ) as totalSum';
    SQL2 += ' FROM (select extract(year from pay_date) `year`,';
    SQL2 += ' extract(month from pay_date) as mm, p_sum_price';
    SQL2 += ' from tbl_pay';
    SQL2 += ' WHERE pay_date >= DATE_FORMAT("' + srchDateFrom + '","%Y-%m-%d 00:00:00") and pay_date <= DATE_FORMAT("' + srchDateTo + '", "%Y-%m-%d 23:59:59")';
    SQL2 += ' ) as t';
    SQL2 += ' GROUP BY `year`;';

    conn.query(SQL1+SQL2, [],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {

                res.render('./admin/pay/settling/list', {
                    rList: results[0],
                    rList1: results[1],
                    srchDateFrom: '',
                    srchDateTo: '',
                    session: ss
                });
            }
        });

});

/**
 * 결산 검색 조회.
 */
router.post('/settling/list/search', function(req, res, next) {

    var ss = req.session;
    var SQL1 = '';
    var SQL2 = '';
    // 현재날짜 셋팅.
    var dt = new Date();
    var nowYear = dt.getFullYear();
    var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
    var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
    var nowDate = nowYear.toString() + "-" + nowMonth.toString() + "-" + nowDay.toString();
    // 검색 조건 셋팅.
    var srchDateFrom = req.body.fromDate != null ? req.body.fromDate : '';
    var srchDateTo = req.body.toDate != null ? req.body.toDate : '';
    if(srchDateFrom == '') {
        srchDateFrom = nowYear + '-' + '01-01';
    }
    if(srchDateTo == '') {
        srchDateTo = nowDate;
    }

console.log('srchDateFrom : ', srchDateFrom);
console.log('srchDateTo : ', srchDateTo);

    // 년월일 조회용 SQL
    SQL1 = 'SELECT';
    SQL1 += ' `year`,';
    SQL1 += ' `month`,';
    SQL1 += ' IFNULL(sum(case when dd =  1 then p_sum_price end), 0) as `dd1`,';
    SQL1 += ' IFNULL(sum(case when dd =  2 then p_sum_price end), 0) as `dd2`,';
    SQL1 += ' IFNULL(sum(case when dd =  3 then p_sum_price end), 0) as `dd3`,';
    SQL1 += ' IFNULL(sum(case when dd =  4 then p_sum_price end), 0) as `dd4`,';
    SQL1 += ' IFNULL(sum(case when dd =  5 then p_sum_price end), 0) as `dd5`,';
    SQL1 += ' IFNULL(sum(case when dd =  6 then p_sum_price end), 0) as `dd6`,';
    SQL1 += ' IFNULL(sum(case when dd =  7 then p_sum_price end), 0) as `dd7`,';
    SQL1 += ' IFNULL(sum(case when dd =  8 then p_sum_price end), 0) as `dd8`,';
    SQL1 += ' IFNULL(sum(case when dd =  9 then p_sum_price end), 0) as `dd9`,';
    SQL1 += ' IFNULL(sum(case when dd = 10 then p_sum_price end), 0) as `dd10`,';
    SQL1 += ' IFNULL(sum(case when dd = 11 then p_sum_price end), 0) as `dd11`,';
    SQL1 += ' IFNULL(sum(case when dd = 12 then p_sum_price end), 0) as `dd12`,';
    SQL1 += ' IFNULL(sum(case when dd = 13 then p_sum_price end), 0) as `dd13`,';
    SQL1 += ' IFNULL(sum(case when dd = 14 then p_sum_price end), 0) as `dd14`,';
    SQL1 += ' IFNULL(sum(case when dd = 15 then p_sum_price end), 0) as `dd15`,';
    SQL1 += ' IFNULL(sum(case when dd = 16 then p_sum_price end), 0) as `dd16`,';
    SQL1 += ' IFNULL(sum(case when dd = 17 then p_sum_price end), 0) as `dd17`,';
    SQL1 += ' IFNULL(sum(case when dd = 18 then p_sum_price end), 0) as `dd18`,';
    SQL1 += ' IFNULL(sum(case when dd = 19 then p_sum_price end), 0) as `dd19`,';
    SQL1 += ' IFNULL(sum(case when dd = 20 then p_sum_price end), 0) as `dd20`,';
    SQL1 += ' IFNULL(sum(case when dd = 21 then p_sum_price end), 0) as `dd21`,';
    SQL1 += ' IFNULL(sum(case when dd = 22 then p_sum_price end), 0) as `dd22`,';
    SQL1 += ' IFNULL(sum(case when dd = 23 then p_sum_price end), 0) as `dd23`,';
    SQL1 += ' IFNULL(sum(case when dd = 24 then p_sum_price end), 0) as `dd24`,';
    SQL1 += ' IFNULL(sum(case when dd = 25 then p_sum_price end), 0) as `dd25`,';
    SQL1 += ' IFNULL(sum(case when dd = 26 then p_sum_price end), 0) as `dd26`,';
    SQL1 += ' IFNULL(sum(case when dd = 27 then p_sum_price end), 0) as `dd27`,';
    SQL1 += ' IFNULL(sum(case when dd = 28 then p_sum_price end), 0) as `dd28`,';
    SQL1 += ' IFNULL(sum(case when dd = 29 then p_sum_price end), 0) as `dd29`,';
    SQL1 += ' IFNULL(sum(case when dd = 30 then p_sum_price end), 0) as `dd30`,';
    SQL1 += ' IFNULL(sum(case when dd = 31 then p_sum_price end), 0) as `dd31`';
    SQL1 += ' FROM (select extract(year from pay_date) `year`,';
    SQL1 += ' extract(month from pay_date) `month`,';
    SQL1 += ' extract(day from pay_date) as dd, p_sum_price';
    SQL1 += ' from tbl_pay';
    SQL1 += ' WHERE pay_date >= DATE_FORMAT("' + srchDateFrom + '","%Y-%m-%d 00:00:00") and pay_date <= DATE_FORMAT("' + srchDateTo + '", "%Y-%m-%d 23:59:59")';
    SQL1 += ' ) as t';
    SQL1 += ' GROUP BY `year`, `month`;';

    console.log('SQL1 : ', SQL1 + '\n');

    // 년월 조회용 SQL
    SQL2 = ' SELECT';
    SQL2 += ' `year`,';
    SQL2 += ' IFNULL(sum(case when mm =  1 then p_sum_price end), 0) as `mm1`,';
    SQL2 += ' IFNULL(sum(case when mm =  2 then p_sum_price end), 0) as `mm2`,';
    SQL2 += ' IFNULL(sum(case when mm =  3 then p_sum_price end), 0) as `mm3`,';
    SQL2 += ' IFNULL(sum(case when mm =  4 then p_sum_price end), 0) as `mm4`,';
    SQL2 += ' IFNULL(sum(case when mm =  5 then p_sum_price end), 0) as `mm5`,';
    SQL2 += ' IFNULL(sum(case when mm =  6 then p_sum_price end), 0) as `mm6`,';
    SQL2 += ' IFNULL(sum(case when mm =  7 then p_sum_price end), 0) as `mm7`,';
    SQL2 += ' IFNULL(sum(case when mm =  8 then p_sum_price end), 0) as `mm8`,';
    SQL2 += ' IFNULL(sum(case when mm =  9 then p_sum_price end), 0) as `mm9`,';
    SQL2 += ' IFNULL(sum(case when mm = 10 then p_sum_price end), 0) as `mm10`,';
    SQL2 += ' IFNULL(sum(case when mm = 11 then p_sum_price end), 0) as `mm11`,';
    SQL2 += ' IFNULL(sum(case when mm = 12 then p_sum_price end), 0) as `mm12`,';
    SQL2 += ' (select IFNULL(SUM(p_sum_price), 0)';
    SQL2 += ' from tbl_pay';
    SQL2 += ' WHERE extract(year from pay_date) = t.year';
    SQL2 += ' and pay_result = "paid"';
    SQL2 += ' and refund_yn = "N"';
    SQL2 += ' and refund_req_yn = "N"';
    SQL2 += ' ) as totalSum';
    SQL2 += ' FROM (select extract(year from pay_date) `year`,';
    SQL2 += ' extract(month from pay_date) as mm, p_sum_price';
    SQL2 += ' from tbl_pay';
    SQL2 += ' WHERE pay_date >= DATE_FORMAT("' + srchDateFrom + '","%Y-%m-%d 00:00:00") and pay_date <= DATE_FORMAT("' + srchDateTo + '", "%Y-%m-%d 23:59:59")';
    SQL2 += ' ) as t';
    SQL2 += ' GROUP BY `year`;';

    conn.query(SQL1+SQL2, [],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {

                if(srchDateFrom != '' && srchDateTo != '') {
                    var fromDate1 = srchDateFrom.substr(0, 4);
                    var fromDate2 = srchDateFrom.substr(4, 2);
                    var fromDate3 = srchDateFrom.substr(6, 2);
                    //console.log(fromDate1 + " " + fromDate2 + " " + fromDate3);
                    var toDate1 = srchDateTo.substr(0, 4);
                    var toDate2 = srchDateTo.substr(4, 2);
                    var toDate3 = srchDateTo.substr(6, 2);
                    //console.log(toDate1 + " " + toDate2 + " " + toDate3);
                    srchDateFrom = fromDate1 + "/" + fromDate2 + "/" + fromDate3;
                    srchDateTo = toDate1 + "/" + toDate2 + "/" + toDate3;
                }

                res.render('./admin/pay/settling/list', {
                    rList: results[0],
                    rList1: results[1],
                    srchDateFrom: srchDateFrom,
                    srchDateTo: srchDateTo,
                    session: ss
                });
            }
        });

});

/**
 * 잔여 일수 계산
 * @param starDt
 * @param endDt
 */
function fncRemainDay(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainDay = 0;

    console.log('endDt : ', endDt);
    if(endDt !=null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));
console.log('endDate substring : ', endDate);

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        //var remainMonth = parseInt(interval / month);
        remainDay = parseInt(interval / day);
    }

    return remainDay;
}

/**
 * 잔여 월수 계산 함수.
 * @param endDt
 * @returns {Number}
 */
function fncRemainMonth(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainMonth = 0;
console.log('endDt : ', endDt);

    if(endDt != null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        remainMonth = parseInt(interval / month);
        //var remainDay = parseInt(interval / day);
    }

    return remainMonth;
}

/**
 * 월을 일로 변환 처리.
 * @param month
 * @returns {number}
 */
function monthToDay(month) {
    var day = 30;
    var retVal = 0;
    if(month != null) {
        retVal = parseInt(month) * day;
    }
    return retVal;
}

function DayToMonth(day) {
    var retVal = 0;
    if(day != null) {
        retVal = parseInt(day) / 30;
    }
    return parseInt(retVal);
}

module.exports = router;