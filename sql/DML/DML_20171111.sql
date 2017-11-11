use adpay;


show tables;

desc `tbl_pay`;

desc `tbl_order`;

/*
  결제 상세 정보 테이블 (신규)
*/
drop table if exists `tbl_pay`;

CREATE TABLE if not exists `tbl_pay` (
  `order_no` varchar(20) NOT NULL COMMENT '주문번호',
  `pay_code` varchar(20) NOT NULL COMMENT '결제코드',
  `usr_id` varchar(40) NOT NULL COMMENT '고객아이디',
  `p_code` varchar(40) DEFAULT NULL COMMENT '대표상품코드(메인서비스)',
  `p_sum_price` int(11) NOT NULL COMMENT '상품합계가격',
  `p_total_price` int(11) DEFAULT NULL COMMENT '상품총가격',
  `pay_method` varchar(8) DEFAULT NULL COMMENT '결제방법',
  `pay_date` datetime DEFAULT NULL COMMENT '결제일',
  `pay_result` varchar(10) DEFAULT NULL COMMENT '결제결과',
  `use_term_days` int(3) DEFAULT NULL COMMENT '사용신청일수(30일,365일)',
  `use_end_date` datetime DEFAULT NULL COMMENT '시용종료날짜',
  `refund_yn` char(1) DEFAULT 'N' COMMENT '환불여부yn',
  `refund_price` int(11) DEFAULT NULL COMMENT '환불금액',
  `refund_req_yn` char(1) DEFAULT 'N' COMMENT '환불신청여부yn',
  `refund_req_date` datetime DEFAULT NULL COMMENT '환불신청일',
  `refund_req_memo` varchar(2000) DEFAULT NULL COMMENT '환불신청이유메모',
  `tax_invoice_req_yn` char(1) DEFAULT 'N' COMMENT '세금계산서신청여부',
  `tax_invoice_yn` char(1) DEFAULT 'N' COMMENT '세금계산서지불여부yn',
  `expire_yn` char(1) DEFAULT 'Y' COMMENT '사용기한yn',
  `code_send_yn` char(1) null default 'N' comment '코드전송여부yn',
  `mng_ins_dt` datetime DEFAULT NULL COMMENT '관리자작성날짜',
  `mng_ins_usr` varchar(40) DEFAULT NULL COMMENT '작성한관리자id',
  `mng_upd_dt` datetime DEFAULT NULL COMMENT '관리자수장날짜',
  `mng_upd_usr` varchar(40) DEFAULT NULL COMMENT '작성한관리자id',
  `insert_dt` datetime NOT NULL COMMENT '작성날짜',
  `insert_usr` varchar(12) NOT NULL COMMENT '작성자명',
  `update_dt` datetime NOT NULL COMMENT '수정날짜',
  `update_usr` varchar(12) NOT NULL COMMENT '수정자명',
  PRIMARY KEY (`order_no`)
) DEFAULT CHARSET=utf8 COMMENT='결제 상세 정보 테이블';

commit;


delete from tbl_order;

delete from tbl_order_his;

delete from tbl_order_detail;

delete from tbl_order_detail_his;

commit;

desc `tbl_pay`;


SELECT count(pay_code) as cnt FROM tbl_pay WHERE DATE_FORMAT(insert_dt, "%Y%m%d") >= DATE_FORMAT(now(), "%Y%m%d") ORDER BY insert_dt;

SELECT count(rno) as cnt FROM tbl_comment WHERE DATE_FORMAT(ins_dt, "%Y%m%d") >= DATE_FORMAT(now(), "%Y%m%d")
UNION
SELECT count(rno) as cnt FROM tbl_review_comment WHERE DATE_FORMAT(ins_dt, "%Y%m%d") >= DATE_FORMAT(now(), "%Y%m%d")
;

desc tbl_comment;

desc tbl_review_comment;

desc tbl_qna;

desc tbl_user;

desc tbl_review;


SELECT count(no) as reviewCnt FROM tbl_review WHERE DATE_FORMAT(insert_dt, "%Y%m%d") >= DATE_FORMAT(now(), "%Y%m%d") ORDER BY insert_dt;






