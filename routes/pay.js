/*
 * 모듈명  : pay.js
 * 설명    : ADPAY 화면 '결제' 에 대한 모듈.
 * 작성일  : 2017년 10월 23일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var path = require('path');
var config = require('./common/dbconfig');
var Logs = require('./common/dblog');
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var templateDir = path.resolve(__dirname, 'templates2');
var smtpTransport = require('nodemailer-smtp-transport');
var crypto = require('crypto');
var randomstring = require('randomstring');
var Request = require('request');
var async = require('async');
var Iamport = require('iamport');
var iamport = new Iamport({
    //impKey : '6727859979366252',
    //impSecret : 'npEtTRfzAuks0hrLfQpR5V3d4kqJXkZlJEPDv4c6zxzAO1l4RKVWFZaKkBtiVtDF8siExvK72kHRl3Vc'
    // 테스트용
    impKey : 'imp_apikey',
    impSecret : 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f'
});
var router = express.Router();

// use set
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

// mysql setting
var conn = mysql.createConnection(config);
conn.connect();


// 이메일 서버 정보 셋팅
var smtpTransport = nodeEmail.createTransport(smtpTransport({
    host : 'smtp.gmail.com',
    secureConnection : false,
    port : 465,
    auth : {
        user : 'jtlab.notifier@gmail.com',
        pass : '0o0o!!!@'
    }
}));
// SQL Err 저장용 로그유틸 초기화.
var logs = new Logs();

// SMS API KEY 설정.
var SMS_API_KEY = '';
var SMS_API_SECRET = '';

/**
 * 결제 테이블 업데이트 처리. (신규)
 */
router.post('/', function(req, res) {
    console.log('routes 결제 처리.');

    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var usrName = ss.usrName !=null ? ss.usrName : ''; var orderNm = "";
    var orderEmail = ""; var orderTelno = ""; var orderTelno1 = ""; var orderTelno2 = ""; var orderTelno3 = "";
    console.log('req.body : ', JSON.stringify(req.body) + '\n');

    var orderNo = req.body['orderNo'] !=null ? req.body['orderNo'] : ''; // 현 주문번호
    var pDiv = req.body['2pDiv'] !=null ? req.body['2pDiv'] : '';
    var prvOrderNo = req.body.pastOrderNo !=null ? req.body.pastOrderNo : ''; // 과거 주문번호
    //var payType = req.body.payType !=null ? req.body.payType : ''; // 결제타입 (1:신용카드,2:이체,3:모바일소액결제)
    var totalPrice = req.body.totalPayPrice != null ? parseInt(fnUnComma(req.body.totalPayPrice)) : 0;
    var taxInvoiceYn = req.body.taxInvoiceYn != null ? req.body.taxInvoiceYn : ''; // 전자계산서 발행 요청여부.
    var payMethod = req.body.payMethod != null ? req.body.payMethod : '';
    var shippingUseYn = req.body.shippingUseYn != null ? req.body.shippingUseYn : '';
    // 배솓지 정보 조회
    if(shippingUseYn == "Y") {
        orderNm = req.body.orderNm !=null ? req.body.orderNm : '';
        orderEmail = req.body.orderEmail !=null ? req.body.orderEmail : '';
        orderTelno1 = req.body.orderTelno1 !=null ? req.body.orderTelno1 : '';
        orderTelno2 = req.body.orderTelno2 !=null ? req.body.orderTelno2 : '';
        orderTelno3 = req.body.orderTelno3 !=null ? req.body.orderTelno3 : '';
        orderTelno = orderTelno1 + orderTelno2 + orderTelno3;
    }

    var splitPrvOrderNo = prvOrderNo.split(",");
    var splitOrderNo = '';
    var arrOrderNo = [];
    var orderNoCnt = 0;
    if(typeof(orderNo) == 'object') {
        orderNoCnt = orderNo.length;
    } else if(typeof(orderNo) == 'string') {
        orderNoCnt = 1;
    }

    // pay code 생성.
    var pMiddle = randomString(15, 'n');
    var pPrev = "ADPC";
    var payCode = pPrev + pMiddle;

    console.log('orderNoCnt : ', orderNoCnt + '\n');
    var cnt = orderNo.length - 1;
    for(var z = 0; z < orderNoCnt; z++) {

        if(orderNoCnt > 1) {
            if (z == cnt) {
                splitOrderNo += '"' + orderNo[z] + '"';
            } else {
                splitOrderNo += '"' + orderNo[z] + '",';
            }
        } else {
            splitOrderNo = '"' + orderNo + '"';
        }


        (function () {
            var idx = z;

            // 테이블 저장 처리.
            async.waterfall([
                function(callback) {
                    if(splitPrvOrderNo[idx] !=null && splitPrvOrderNo[idx] != '') {
                        // 기존 주문 삭제 처리.
                        var conn = mysql.createConnection(config);
                        /* Begin transaction */
                        conn.beginTransaction(function(err) {
                            if(err) { console.log('pay.js 기존주문 삭제처리. err : ', err); }
                            conn.query('DELETE FROM tbl_order_detail WHERE order_no = ? AND usr_id = ?;'
                                + 'DELETE FROM tbl_order WHERE order_no = ? AND usr_id = ?;',
                                [prvOrderNo, ss.usrId, prvOrderNo, ss.usrId],
                                function (err, results) {
                                    if (err) {
                                        conn.rollback(function() {
                                            //throw err;
                                            logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                        });
                                        conn.end();
                                    } else {
                                        conn.commit(function(err) {
                                            if(err) {
                                                conn.rollback(function() {
                                                    //throw err;
                                                    logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                                });
                                            }
                                            console.log('pay.js 기존주문 삭제처리.');
                                            conn.end();
                                        });
                                    }
                                }
                            );
                        });
                    }
                    callback(null);
                },
                function (callback) {

                    var setOrderNo = '';
                    if(orderNoCnt > 1) {
                        setOrderNo = orderNo[idx];
                    } else {
                        setOrderNo = orderNo;
                    }

                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('주문 테이블의 주문번호로 처리 err : ', err);
                        }
                        conn.query('INSERT INTO tbl_pay(order_no, pay_code, usr_id, p_sum_price, p_total_price, pay_method, pay_date, pay_result, use_term_days, use_end_date,'
                            + ' tax_invoice_req_yn, expire_yn, insert_dt, insert_usr, update_dt, update_usr) SELECT order_no, "' + payCode + '", "' + ss.usrId + '", total_price, "' + totalPrice + '",'
                            + ' "' + payMethod + '", now(), "wait", use_term_days, ADDDATE(now(), use_term_days), "' + taxInvoiceYn + '", "N", now(), "' + ss.usrId + '", now(), "'
                            + ss.usrId + '" FROM tbl_order WHERE order_no = ? AND usr_id = ?',
                            [setOrderNo, ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('pay.js 주문 마스터 테이블에서 결제 마스터 테이블에 복사 처리.');
                                        conn.end();
                                    });
                                    callback(null, setOrderNo);
                                }
                            });
                    });
                },
                function (getOrderNo, callback) {

                    console.log('getOrderNo : ', getOrderNo);

                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('tbl_order pay_result 업데이트 처리 err : ', err);
                        }
                        conn.query('UPDATE tbl_order SET pay_result = "wait" WHERE order_no = ? AND usr_id = ?',
                            [getOrderNo, ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('tbl_order pay_result 업데이트 처리.');
                                        conn.end();
                                    });
                                    callback(null);
                                }
                            });
                    });
                },
                function (callback) {
                    // 카트 정보 삭제 처리.
                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('tbl_order pay_result 업데이트 처리 err : ', err);
                        }
                        conn.query('DELETE FROM tbl_cart WHERE usr_id = ?;',
                            [ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('pay.js 카트 정보 삭제 처리.');
                                        conn.end();
                                    });
                                    callback(null);
                                }
                            });
                    });
                },
                function (callback) {
                    if(shippingUseYn == "Y") {
                        // 배송정보 저장 처리.
                        var conn = mysql.createConnection(config);
                        conn.connect();
                        conn.query('INSERT INTO tbl_shipping(pay_code, order_usr_id, order_nm, order_email,'
                            + ' order_tel_no, order_tel_no1, order_tel_no2, order_tel_no3,'
                            + ' ins_date, ins_usr_id, upd_date, upd_usr_id)'
                            + ' VALUES(?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
                            [
                                payCode, usrId, orderNm, orderEmail, orderTelno, orderTelno1, orderTelno2, orderTelno3, usrId, usrId
                            ],
                            function(err, results) {
                                if(err) {
                                    console.log('err : ', err);
                                } else {
                                    console.dir(results);
                                }
                            });
                        conn.commit();
                        conn.end();
                    }
                    callback(null);
                }
            ], function (err, result) {
                if (err) {
                    console.log('err : ', err);
                } else {
                    console.log('results : ', result);
                }
                // result에는 '끝'이 담겨 온다.
                //console.log(' async result : ', result);
            });

        })(); // end function
    }

    console.log('splitOrderNo : ', splitOrderNo);

    // 테이블 조회 처리 및 결제 결과 이메일 발송 처리.
    async.waterfall([
        function(callback) {

//console.log('usrId : ', usrId);
            // 결제된 내역 정보 조회.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT p_code as pCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' p_nm as pNm, p_price as pPrice FROM tbl_order_detail'
                + ' WHERE order_no IN (' + splitOrderNo + ') AND usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                /*
                 conn.query('SELECT x.p_code as pCode, x.p_div as pDiv,'
                 + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                 + ' x.p_nm as pNm, x.p_price as pPrice FROM tbl_order_detail x, tbl_pay y'
                 + ' WHERE x.order_no = y.order_no AND y.pay_result = "wait" AND x.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;',
                 */
                [usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('pay.js 결제된 내역 정보 조회');
                        console.dir(results);
                        callback(null, results);
                    }
                });
            conn.end();
        },
        function(retList, callback) {

            // 무통장 입금인 경우
            if (payMethod == 'bank' || payMethod == 'escro') {

                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>ADPAY 구매(이용) 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 아래의 계좌정보로 입금해주시면 확인하시고 이용처리 해드립니다. </dd>';
                content += '<dd>* 입금 계좌 은행 : 농협 </dd>';
                content += '<dd>* 예금계좌번호 : 농협 302-9992-3210-21</dd>';
                content += '<dd>* 예금주명:  에디페이(ADPAY) </dd>';

                // 관리자에게 이메일 전송처리.
                //sendMail(usrEmail, compNm, content);
                //sendSMS(ss.usrCellNo, totalPrice);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});
            } else if (payMethod == 'card') {
                // 그 외 결제방법.(카드)
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
                    + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
                    + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
                    + ' where c_no = ?',
                    [usrNo],
                    function (err, results) {
                        if (err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                            var usrEmail = results[0].c_email;
                            var usrName = results[0].c_name;
                            var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                            var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                            var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                            var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                            var payData = {
                                //payNo: orderNo,
                                payNo: payCode,
                                //payPgNm : 'html5_inicis',
                                payPgNm: 'card',
                                //payMethod : req.body.payMethod,
                                payMethod: payMethod,
                                orderNo: orderNo,
                                payName: 'JTLAB 서비스 결제',
                                amount: totalPrice,
                                //email : req.body.email,
                                email: usrEmail,
                                //name : req.body.name,
                                name: usrName,
                                //telno : req.body.telno,
                                telno: usrTelNo,
                                //address : req.body.address,
                                address: usrAddress,
                                //postno : req.body.postno
                                postno: usrPostNo
                            };

                            //sendSMS(ss.usrCellNo, totalPrice);
                            res.render('./pay/pgCall', {data: payData});
                        }
                    });
                conn.end();
                // 그외 결제인(금액이 0인) 경우

            } else if (payMethod == 'paypal') {
                // 그 외 결제방법.(페이팔)
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('SELECT c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email,'
                    + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3,'
                    + ' FROM c_inf_tbl'
                    + ' WHERE c_no = ?',
                    [usrNo],
                    function (err, results) {
                        if (err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                            var usrEmail = results[0].c_email;
                            var usrName = results[0].c_name;
                            var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                            var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                            var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                            var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                            var payData = {
                                //payNo: orderNo,
                                payNo: payCode,
                                //payPgNm : 'html5_inicis',
                                payPgNm: 'paypal',
                                //payMethod : req.body.payMethod,
                                payMethod: payMethod,
                                orderNo: orderNo,
                                payName: 'JTLAB 서비스 결제',
                                amount: totalPrice,
                                //email : req.body.email,
                                email: usrEmail,
                                //name : req.body.name,
                                name: usrName,
                                //telno : req.body.telno,
                                telno: usrTelNo,
                                //address : req.body.address,
                                address: usrAddress,
                                //postno : req.body.postno
                                postno: usrPostNo
                            };
                            // SMS 처리.
                            //sendSMS(ss.usrCellNo, totalPrice);

                            res.render('./pay/pgCall', {data: payData});
                        }
                    });
                conn.end();
                // 그외 결제인(금액이 0인) 경우
            } else {
                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>ADPAY 서비스 이용 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 24시간 이내 확인하고 서비스 이용처리 해드리겠습니다. </dd>';

                // 관리자에게 이메일 전송처리.
                //sendMail(usrEmail, compNm, content);
                //sendSMS(ss.usrCellNo, totalPrice);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});
            }
            callback(null);
        } // end function
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
    });

});

// PG 대행사 처리 조회.
router.post('/getPayList', function(req, res) {
    var ss = req.session;
    console.log(">>> req.body: " + JSON.stringify(req.body));
    //var merchantUid = req.body.merchant_uid !=null ? req.body.merchant_uid : "";
    var usrId = ss.usrId;
    var payNo = req.body.payNo !=null ? req.body.payNo : "";
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : "";

    //아임포트 고유 아이디로 결제 정보를 조회
    iamport.payment.getByImpUid({
        //imp_uid: 'imp11226682'
        imp_uid: req.body.imp_uid
    }).then(function(result){
        console.log(">>> getPayList result : " + JSON.stringify(result));
        // 조회후 결과를 업데이트 처리함.
        if(result.status=="paid" || result.status == "ready" || result.status=="failed") {
            // DB 인서트 처리.
            conn.query('UPDATE tbl_pay SET pay_method = ?, pay_result = ? WHERE pay_code = ? AND usr_id = ?;'
                + 'UPDATE tbl_order SET pay_result = ? WHERE order_no = ?;',
                [result.pay_method, result.status, payNo, usrId, result.status, orderNo],
                function (err) {
                    if (err) {
                        console.log('error : ', err.message);
                        res.render('error', {message: err.message, error: err, session: ss});
                    } else {
                        res.json({status: result.status, impUid : result.imp_uid, merchantUid : result.merchant_uid, name : result.name, paidAt : result.paid_at,
                            payMethod : result.pay_method, pgProvider : result.pg_provider, cardName : result.card_name, receiptUrl : result.receipt_url,
                            amount : result.amount, failReason : result.fail_reason,
                            cancelAmount : result.cancel_amount, cancelReason : result.cancel_reason});
                    }
                }
            );
        }

    }).catch(function(error){
        console.log(">>> error result : " + error);
        res.json({errMsg : error});
    });
});


// 결과  처리.
router.get('/result', function(req, res) {
    console.log('routes 결제 결과 화면 호출.');
    var ss = req.session;
    var data = {};
    console.log('result req.query : ', JSON.stringify(req.query) + '\n');

    var payNo = req.query.payNo !=null ? req.query.payNo : "";
    var orderNo = req.query.orderNo !=null ? req.query.orderNo : "";
    var impUid = req.query.imp_uid != null ? req.query.imp_uid : '';
    var mechantUid = req.query.merchant_uid != null ? req.query.merchant_uid : '';
    var impSucess = req.query.imp_success != null ? req.query.imp_success : '';
    if(impSucess == 'true') {
        impSucess = 'paid';
    } else if(impSucess == 'false') {
        impSucess = 'failed';
    }
    var errorMsg = req.query.error_msg != null ? req.query.error_msg : '';
    console.log(">>> impSucess : " + impSucess);
    console.log(">>> errorMsg : " + errorMsg);
    if(impSucess=='false') {
        data = {
            impUid : impUid,
            merchantUid : mechantUid,
            msg : errorMsg
        }
    } else {
        data = {
            impUid : impUid,
            merchantUid : mechantUid,
            msg : '결제 완료 처리되었습니다.'
        }
    }
    // 업데이트 처리.
    // DB 인서트 처리.
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('UPDATE tbl_pay SET pay_method = ?, pay_result = ? WHERE pay_code = ? AND usr_id = ?;'
        + 'UPDATE tbl_order SET pay_result = ? WHERE order_no = ?;',
        [req.query.pay_method, impSucess, payNo, ss.usrId, impSucess, orderNo],
        function (err) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                res.render('./pay/payResult', {data : data, session : ss});
            }
        }
    );
    conn.end();
});

// 결과 처리.
router.post('/result', function(req, res) {
    console.log('routes 결제 결과 화면 호출.');
    var ss = req.session;
    console.log(">>>> msg : " + req.body.rstMsg);

    var data = {
        msg : req.body.rstMsg
    };
    res.render('./pay/payResult', {data : data, session : ss});
});

/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
function sendMail(receiverEmail, receiver, content) {

    var title = '[ADPAY] 결제 안내';
    var fromEmail = '[ADPAY] 관리자 < jtlab.notifier@gmail.com >';
    var toEmail = '['+ receiver+'] '+ '< ' + receiverEmail +' >';
    var ccEmail = '< logger@jt-lab.co.kr >';
    var fromName = '[ADPAY] 에디페이';
    var toName = receiver;

    var template = new EmailTemplate(path.join(templateDir, 'newsletter'));
    // HTML 에 들어갈 문자 변수 셋팅.
    var locals = {
        title : title,
        fromEmail : fromEmail,
        toEmail : toEmail,
        fromName : fromName,
        toName : toName,
        content : content
    };
    template.render(locals, function(err, results) {
        if(err) {
            return console.log(err);
        }
        console.log('results : ', JSON.stringify(results));

        smtpTransport.sendMail({
            from : fromEmail,
            to : toEmail,
            bc : ccEmail,
            subject: title,
            html : results.html
        }, function(err, responseStatus) {
            if(err) {
                console.error(err);
                //res.send('error');
            } else {
                console.log(responseStatus.message);
                //res.end('sent');
            }
        })
    });

}


/*
 * RANDOM STRING GENERATOR
 *
 * Info:      http://stackoverflow.com/a/27872144/383904
 * Use:       randomString(length [,"A"] [,"N"] );
 * Default:   return a random alpha-numeric string
 * Arguments: If you use the optional "A", "N" flags:
 *            "A" (Alpha flag)   return random a-Z string
 *            "N" (Numeric flag) return random 0-9 string
 */
function randomString(len, an){
    an = an&&an.toLowerCase();
    var str="", i=0, min=an=="a"?10:0, max=an=="n"?10:62;
    for(;i++<len;){
        var r = Math.random()*(max-min)+min <<0;
        str += String.fromCharCode(r+=r>9?r<36?55:61:48);
    }
    return str;
}

function getNowDate(str) {
    var nowDate = new Date();
    var year = nowDate.getFullYear();
    var month = nowDate.getMonth()+1;
    var date = nowDate.getDate();

    if (month < 10) month = "0" + month;
    if (date < 10) date = "0" + date;

    return year + str + month + str + date;
}


// 날짜 구하기.
function dateAdd(addDay, str) {

    var nowDate = new Date();
    var nowYear = nowDate.getFullYear();
    var nowMonth = nowDate.getMonth()+1;
    var nowDay = nowDate.getDate();
    if (nowMonth < 10) {
        nowMonth = "0" + nowMonth
    }
    if (nowDay < 10) {
        nowDay = "0" + nowDay
    }
    var todayDate = nowYear + str + nowMonth + str + nowDay;
    var dateArray = todayDate.split(str);
    var tmpDate = new Date(dateArray[0], dateArray[1], dateArray[2]);
    tmpDate.setMonth(tmpDate.getMonth() + (parseInt(addDay) - 1));
    nowDate.setTime(tmpDate);
    var y = nowDate.getFullYear();
    var m = nowDate.getMonth() + 1;
    var d;
    if(addDay=='12') {
        d = nowDate.getDate();
    } else {
        d = nowDate.getDate() - 1;
    }
    if (m < 10) m = "0" + m;
    if (d < 10) d = "0" + d;
    var retVal = y + str + m + str + d;

//console.log(">> addDays() -> retDate : " + retVal);

    return retVal;
}

// 콤마 붙이기
function fnComma(num) {
    var reg = /(^[+-]?\d+)(\d{3})/;
    num += '';
    while(reg.test(num)) {
        num = num.replace(reg, '$1' + ',' + '$2');
    }
    return num;
}
// 콤마 제거
function fnUnComma(num) {
    if(num !=null) {
        return (num.replace(/\,/g,""));
    } else {
        return num;
    }

}

/**
 * 가격 표시 변환.
 * @param rep
 * @param text
 * @returns {*}
 */
function fnMsgRep(rep, text) {
    if(text !=null) {
        return (text.replace(/\[price]/g,fnComma(rep)));
    } else {
        return text;
    }
}

// SMS 보내기
function sendSMS(toTelNo, price) {
    console.log('sendSMS() 함수 호출 \n');
    console.log('고객 연락처 정보 : ', toTelNo);
    console.log('가격 : ', price);
    var curDate = new Date();
    var timestamp = parseInt(curDate.getTime() / 1000);
    //console.log('>>> timestamp : ', timestamp + '\n');
    var salt = randomstring.generate(30);
    var signature = crypto.createHmac('md5', SMS_API_SECRET).update(timestamp + salt).digest('hex');

    async.waterfall([

        function(callback) {
            // 주문 테이블의 주문번호로 처리함.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT subject as subject, content as content, from_tel_no as fromTelNo, type as type, use_yn as useYn'
                + ' FROM lab_sms_inf_tbl WHERE type = "PAY" AND use_yn = "Y"',
                [],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('result : ', results.message);
                        callback(null, results);
                    }
                });
            conn.end();
        },
        function(retValues, callback) {
//console.log('retValues.fromTelNo : ' , retValues[0].fromTelNo);
//console.log('retValues.subject : ' , retValues[0].subject);
            // sms info
            var extension = [{
                type : 'SMS',
                to : toTelNo,
                from : retValues[0].fromTelNo,
                subject : retValues[0].subject,
                text : fnMsgRep(price, retValues[0].content)
            }];

            // body data set
            var params = {
                api_key: SMS_API_KEY,
                timestamp: timestamp,
                salt : salt,
                signature : signature,
                extension : JSON.stringify(extension)
            };
            // 전송 처리.
            Request.post({url:'https://api.coolsms.co.kr/sms/1.1/send', formData: params}, function (err, response, body) {
                //console.log('body : ', JSON.parse(body));
                var result2 = JSON.parse(body);
                if (!err && response.statusCode == 200) {
                    console.log('response : ', result2.response);
                    console.log('Complete SMS SEND !!');
                } else {
                    console.log('Error to SEND : ', err);
                    console.log('code : ', result2.code);
                    console.log('message : ', result2.message);
                }
            });
            callback(null);
        }
    ], function (err, result) {
        // result에는 '끝'이 담겨 온다.
        console.log(' async result : ', result);
    });

}

module.exports = router;
