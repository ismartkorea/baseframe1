use `adpay`;

/*
 * base1용 DB
 */
grant all privileges on base1.* to base1@localhost identified by 'base19123';
create database `base1`;
flush privileges;

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


/*
  주문 정보 테이블
*/
drop table if exists `tbl_order`;

create table if not exists `tbl_order` (
`order_no` varchar(40) not null comment '주문번호',
`usr_id` varchar(40) not null comment '고객아이디',
`service_nm` varchar(20) null comment '서비스명(p_nm)',
`total_price` int(11) not null comment '총가격',
`order_date` datetime null comment '주문일',
`use_term_days` int(3) null comment '사용신청일수(30일,365일)',
`pay_result` varchar(10) null comment '결제결과',
`category1` varchar(40) null comment '분류코드1',
`category2` varchar(40) null comment '분류코드2',
`category3` varchar(40) null comment '분류코드3',
`g_id_type` varchar(10) null comment '게임계정타입(구글/카카오/네이버/페이스북/엔씨)',
`g_id` varchar(40) null comment '게임계정',
`g_pwd` varchar(100) null comment '게임비밀번호',
`g_char_nm` varchar(60) null comment '게임캐릭터명',
`g_leverl_server` varchar(80) null comment '게임레벨/서버명',
`g_etc` varchar(200) null comment '요청사항',
`gc_type` varchar(10) null comment '코드선택(카카오톡/이메일/핸드폰/기타)',
`gc_text` varchar(100) null comment '코드내용',
`star_id` varchar(40) null comment '별풍선id',
`star_pwd` varchar(80) null comment '별풍선pwd',
`insert_dt` datetime not null comment '작성날짜',
`insert_usr` varchar(12) not null comment '작성자명',
`update_dt` datetime not null comment '수정날짜',
`update_usr` varchar(12) not null comment '수정자명',
primary key (`order_no`)
) default charset='utf8' comment '주문 정보 테이블';

commit;

/*
   주문 상세 정보 테이블
*/
drop table if exists `tbl_order_detail`;

create table if not exists `tbl_order_his` (
`no` int(11) not null auto_increment comment '번호',
`order_no` varchar(40) not null comment '주문번호',
`usr_id` varchar(40) not null comment '고객아이디',
`service_nm` varchar(20) null comment '서비스명(p_nm)',
`total_price` int(11) not null comment '총가격',
`order_date` datetime null comment '주문일',
`use_term_days` int(3) null comment '신청기간(30,360일)',
`pay_result` varchar(10) null comment '결제결과',
`category1` varchar(40) null comment '분류코드1',
`category2` varchar(40) null comment '분류코드2',
`category3` varchar(40) null comment '분류코드3',
`g_id_type` varchar(10) null comment '게임계정타입(구글/카카오/네이버/페이스북/엔씨)',
`g_id` varchar(40) null comment '게임계정',
`g_pwd` varchar(100) null comment '게임비밀번호',
`g_char_nm` varchar(60) null comment '게임캐릭터명',
`g_leverl_server` varchar(80) null comment '게임레벨/서버명',
`g_etc` varchar(200) null comment '요청사항',
`gc_type` varchar(10) null comment '코드선택(카카오톡/이메일/핸드폰/기타)',
`gc_text` varchar(100) null comment '코드내용',
`star_id` varchar(40) null comment '별풍선id',
`star_pwd` varchar(80) null comment '별풍선pwd',
`insert_dt` datetime not null comment '작성날짜',
`insert_usr` varchar(12) not null comment '작성자명',
`update_dt` datetime not null comment '수정날짜',
`update_usr` varchar(12) not null comment '수정자명',
primary key (`no`)
) default charset='utf8' comment '주문 정보 테이블';


commit;

/*
   SQL 에러 로그 관리 테이블.
*/
drop table if exists `tbl_err`;

create table if not exists `tbl_err` (
`no` int(11) not null auto_increment comment '번호',
`code` varchar(60) not null comment '에러코드',
`err_no` varchar(6) not null comment '에러번호',
`sql_msg` text null comment '에러메시지',
`ins_dt` timestamp null comment '작성일시',
primary key(`no`)
) default charset = utf8 comment 'SQL에러로그정보테이블';

commit;

drop table if exists `tbl_conn_his`;

create table if not exists `tbl_conn_his` (
  `cno` int(11) NOT NULL auto_increment COMMENT '접속번호',
  `cview` varchar(80) NOT NULL COMMENT '접속뷰',
  `cpage` varchar(80) NOT NULL COMMENT '접속화면페이지',
  `cid` varchar(40) NOT NULL COMMENT '접속id',
  `cin_date` datetime NOT NULL COMMENT '접속일',
  `cout_date` datetime default '0000-00-00 00:00:00' COMMENT '접속out날짜',
  `cip` varchar(80) default '000.000.000.000' COMMENT '접속p',
  PRIMARY KEY  (`cno`)
) default charset=utf8 comment '어드민 qna 댓글 테이블';

commit;

drop table if exists `tbl_category`;

 CREATE TABLE if not exists `tbl_category` (
  `category_no` int(11) NOT NULL auto_increment COMMENT '카테고리번호',
  `name` varchar(40) NOT NULL COMMENT '카테고리명',
  `parent_no` int(11) default NULL COMMENT '상위 부모카테고리번호',
  `order_no` int(11) default NULL COMMENT '정렬번호',
  PRIMARY KEY  (`category_no`)
) DEFAULT CHARSET=utf8 COMMENT='상품카테고리 관리 테이블';

commit;


/*
 * 카운터 테이블
 */
drop table if exists `tbl_counter`;

create table if not exists `tbl_counter` (
`name` varchar(40) not null comment '방문자임시명-visitor',
`total_count` int(11) not null comment '전체카운트수',
`today_count` int(11) comment '일일카운트수',
`date` varchar(20) comment '날짜'
) default charset = utf8 comment '카운터조회용 테이블';

commit;


/*
 * 게시판 테이블
 */
DROP TABLE IF EXISTS `tbl_board`;

CREATE TABLE IF NOT EXISTS `tbl_board` (
`no` int(11) not null auto_increment comment '게시물번호',
`title` varchar(60) not null comment '타이틀',
`content` varchar(200) not null comment '내용',
`writer` varchar(20) null comment '작성자명',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(12) null comment '수정자id',
`count` int(11) null default 0 comment '조회수',
primary key(`no`)
) default charset = utf8 comment '게시판 테이블';

commit;

/*
 * 게시판 댓글 테이블
 */
drop table if exists `tbl_comment`;

create table if not exists `tbl_comment` (
 `rno` int(11) not null auto_increment comment '댓글번호',
 `bno` int(11) not null comment '게시판번호',
 `comment` varchar(2000) not null comment '댓글내용',
 `ins_dt` datetime not null comment '작성날짜',
 `ins_id` varchar(40) null comment '작성자id',
 primary key(`rno`)
) default charset = utf8 comment '게시판 댓글 테이블';

commit;

/*
 * 1:1 게시판 테이블
 */
drop table if exists `tbl_qna`;

create table if not exists `tbl_qna` (
 `qno` int(11) not null auto_increment comment '번호',
 `name` varchar(40) not null comment '이름',
 `usr_id` varchar(40) null comment '고객번호',
 `email` varchar(80) not null comment '이메일',
 `telno` varchar(13) not null comment '전화번호',
 `title` varchar(80) not null comment '제목',
 `content` varchar(2000) not null comment '내용',
 `ins_dt` datetime not null comment '작성날짜',
 `reply_yn` char(1) null default 'N' comment '답변여부',
 `reply_id` varchar(40) null comment '답변자id',
 `reply_name` varchar(60) null comment '답변자명',
 `reply_comment` varchar(2000) null comment '답변글',
 `reply_ups_dt` datetime null comment '답변일자',
 `cate_cd` varchar(12) null comment '카테고리cd',
 `cate_nm` varchar(12) null comment '카테고리명',
 primary key(`qno`)
 ) default charset = utf8 comment 'QnA 게시판 테이블';

commit;

/*
 * 공지사항 테이블
 */
DROP TABLE IF EXISTS `tbl_announce`;

CREATE TABLE IF NOT EXISTS `tbl_announce` (
`no` int(11) not null auto_increment comment '게시물번호',
`title` varchar(60) not null comment '타이틀',
`content` text not null comment '내용',
`writer` varchar(40) null comment '작성자명',
`cate_cd` varchar(12) null comment '카테고리코드',
`cate_nm` varchar(12) null comment '카테고리코드명',
`attch_file_url1` varchar(100) null comment '첨부파일1',
`attch_file_nm1` varchar(60) null comment '첨부파일명1',
`attch_file_url2` varchar(100) null comment '첨부파일2',
`attch_file_nm2` varchar(60) null comment '첨부파일명2',
`count` int(11) null default 0 comment '조회수',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(12) null comment '수정자id',
primary key(`no`)
) default charset = utf8 comment '공지 게시판 테이블';

commit;

/*
  주문 이력 정보 테이블
*/
drop table if exists `tbl_order_his`;

create table if not exists `tbl_order` (
`order_no` varchar(40) not null comment '주문번호',
`usr_id` varchar(40) not null comment '고객아이디',
`service_nm` varchar(20) null comment '서비스명(p_nm)',
`total_price` int(11) not null comment '총가격',
`order_date` datetime null comment '주문일',
`use_term_days` int(3) null comment '사용신청일수(30일,365일)',
`pay_result` varchar(10) null comment '결제결과',
`category1` varchar(40) null comment '분류코드1',
`category2` varchar(40) null comment '분류코드2',
`category3` varchar(40) null comment '분류코드3',
`g_id_type` varchar(10) null comment '게임계정타입(구글/카카오/네이버/페이스북/엔씨)',
`g_id` varchar(40) null comment '게임계정',
`g_pwd` varchar(100) null comment '게임비밀번호',
`g_char_nm` varchar(60) null comment '게임캐릭터명',
`g_leverl_server` varchar(80) null comment '게임레벨/서버명',
`g_etc` varchar(200) null comment '요청사항',
`gc_type` varchar(10) null comment '코드선택(카카오톡/이메일/핸드폰/기타)',
`gc_text` varchar(100) null comment '코드내용',
`insert_dt` datetime not null comment '작성날짜',
`insert_usr` varchar(12) not null comment '작성자명',
`update_dt` datetime not null comment '수정날짜',
`update_usr` varchar(12) not null comment '수정자명',
primary key (`order_no`)
) default charset='utf8' comment '주문 정보 테이블';

commit;



drop table if exists `tbl_cart`;

create table if not exists `tbl_cart` (
`no` int(11) not null auto_increment comment '번호',
`usr_id` varchar(40) not null comment '고객아이디',
`p_code` varchar(40) null comment '상품코드',
`p_pair_code_yn` varchar(40) null default 'N' comment '상품쌍코드여부(하위상품코드)',
`p_pair_code` varchar(40) null comment '상품쌍코드(연관상품코드)',
`p_div` char(1) not null comment '상품구분(메인:M,옵션:O)',
`p_type` char(3) null comment '상품타입(서비스:srv,패키지:pkg)',
`p_gubun` varchar(10) null comment '상품서비스구분(Assist Pro, JT Lab)',
`p_opt_btn_dis_yn` char(1) default 'Y' null comment '옵션상품버튼표시여부',
`p_nm` varchar(60) not null comment '상품명',
`p_price` int(11) not null comment '상품가격',
`p_disc_price` int(11) NULL COMMENT '상품할인가격',
`p_disc_percent` int(11) NULL COMMENT '상품할인퍼센트',
`p_uniq_code` varchar(40) null comment '상품고유코드',
`opt_cnt` int(3) null default 0 comment '옵션갯수',
`p_count` int(11) null default 0 comment '상품구매갯수',
`p_sum_price` int(11) null default 0 comment '상품합계가격',
`p_image` varchar(80)  NULL COMMENT ' 상품대표이미지',
`p_image_url` varchar(100)  NULL COMMENT '상품이미지URL',
`sort_no` varchar(10) null comment '정렬번호',
`insert_dt` datetime null comment '작성날짜',
`insert_usr` varchar(12) null comment '작성자명',
`update_dt` datetime null comment '수정날짜',
`update_usr` varchar(12) null comment '수정자명',
primary key(`no`)
) default charset='utf8' comment '장바구니 정보 테이블';

commit;

drop table if exists `tbl_manager`;

create table if not exists `tbl_manager` (
`m_no` int(11) not null auto_increment comment '번호',
`m_id` varchar(20) not null comment '아이디',
`m_pwd`  varchar(75) not null comment '비밀번호',
`m_name` varchar(40) not null comment '관리자이름',
`m_email` varchar(80) not null comment '이메일',
`m_cell_no` varchar(13) null comment '휴대폰연락처',
`m_cell_no1` varchar(3) null comment '휴대폰앞자리',
`m_cell_no2` varchar(4) null comment '휴대폰중간자리',
`m_cell_no3` varchar(4) null comment '휴대폰끝자리',
`m_auth_level` varchar(3) null default '001' comment '권한레벨(000:수퍼,001:관리자,002:담당자)',
`insert_dt` datetime not null comment '작성일자',
`insert_usr` varchar(40) null comment '작성자id',
`update_dt` datetime not null comment '수정일자',
`update_usr` varchar(40) null comment '수정자id',
primary key(`m_no`)
) default charset = utf8 comment '관리자 테이블';

commit;

DROP TABLE if exists `tbl_user`;

CREATE TABLE `tbl_user` (
  `c_no` int(11) NOT NULL AUTO_INCREMENT COMMENT '고객번호',
  `c_id` varchar(20) NOT NULL COMMENT '아이디',
  `c_pwd` varchar(60) NOT NULL COMMENT '비밀번호',
  `c_name` varchar(40) NOT NULL COMMENT '이름',
  `c_addr1` varchar(60) DEFAULT NULL COMMENT '주소1',
  `c_addr2` varchar(60) DEFAULT NULL COMMENT '주소2',
  `c_postno` varchar(7) DEFAULT NULL COMMENT '우편번호',
  `c_email` varchar(60) NOT NULL COMMENT '이메일주소',
  `c_sex` varchar(1) DEFAULT NULL COMMENT '성별',
  `c_birth` varchar(8) DEFAULT NULL COMMENT '회원 생년월일',
  `c_tel_no` varchar(13) DEFAULT NULL COMMENT '전화번호',
  `c_tel_no1` varchar(4) DEFAULT NULL COMMENT '전화번호 앞자리',
  `c_tel_no2` varchar(4) DEFAULT NULL COMMENT '전화번호 중간자리',
  `c_tel_no3` varchar(4) DEFAULT NULL COMMENT '전화번호 끝자리',
  `c_cell_no` varchar(13) DEFAULT NULL COMMENT '휴대폰번호',
  `c_cell_no1` varchar(3) DEFAULT NULL COMMENT '휴대폰번호 앞자리',
  `c_cell_no2` varchar(4) DEFAULT NULL COMMENT '휴대폰번호 중간자리',
  `c_cell_no3` varchar(4) DEFAULT NULL COMMENT '휴대폰번호 끝자리',
  `c_email_yn` char(1) DEFAULT NULL COMMENT '이메일수신',
  `c_sms_yn` char(1) DEFAULT NULL COMMENT 'sms수신여부',
  `c_term_yn` char(1) DEFAULT NULL COMMENT '약관동의여부',
  `c_inf_use_yn` char(1) DEFAULT NULL COMMENT '정보활용확인여부',
  `c_user_tp` char(1) NOT NULL COMMENT '유저타입(개인)',
  `c_auth_level` varchar(3) DEFAULT NULL COMMENT '회원등급',
  `c_auth_cd` varchar(16) DEFAULT NULL COMMENT '회원인증코드',
  `c_area` char(3) null comment '회원지역코드',
  `c_cert_yn` char(1) default 'N' comment 'SMS인증여부(Y:예,N:아니오)',
  `insert_dt` datetime NOT NULL COMMENT '입력날짜',
  `insert_usr` varchar(40) DEFAULT NULL COMMENT '입력자',
  `update_dt` datetime NOT NULL COMMENT '수정날짜',
  `update_usr` varchar(40) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`c_no`)
) DEFAULT CHARSET=utf8 COMMENT='고객정보테이블';

commit;

drop table if exists `tbl_product`;

CREATE TABLE if not exists `tbl_product` (
  `p_no` int(11) NOT NULL AUTO_INCREMENT COMMENT '상품번호',
  `p_code` varchar(40) NOT NULL COMMENT '상품코드',
  `p_pair_code_yn` varchar(40) DEFAULT 'N' COMMENT '상품쌍코드여부(하위상품코드)',
  `p_pair_code` varchar(40) DEFAULT NULL COMMENT '상품쌍코드(연관상품코드)',
  `p_div` char(1) DEFAULT NULL COMMENT '상품구분(메인:M,옵션:O)',
  `p_opt_btn_dis_yn` char(1) DEFAULT 'Y' COMMENT '옵션상품버튼표시여부',
  `p_type` char(3) DEFAULT NULL COMMENT '상품타입(서비스:srv,패키지:pkg)',
  `p_gubun` varchar(10) DEFAULT NULL COMMENT '상품서비스구분(Assist Pro, JT Lab)',
  `p_nm` varchar(60) NOT NULL COMMENT '상품명',
  `p_price` int(11) NOT NULL COMMENT '상품가격',
  `p_desc` text COMMENT '상품(서비스) 설명',
  `p_display_yn` char(1) DEFAULT 'Y' COMMENT '상품표시yn',
  `p_image` varchar(80) DEFAULT NULL COMMENT ' 상품대표이미지',
  `p_uniq_code` varchar(40) DEFAULT NULL COMMENT '상품고유코드',
  `opt_cnt` int(3) DEFAULT NULL COMMENT '옵션갯수',
  `sort_no` varchar(10) DEFAULT NULL COMMENT '정렬번호',
  `p_gubun_cd` char(3) DEFAULT NULL COMMENT '서비스구분코드',
  `p_smmry` varchar(100) DEFAULT NULL COMMENT '상품설명',
  `p_image_url` varchar(100) DEFAULT NULL COMMENT '상품이미지URL',
  `display_order_no` varchar(2) DEFAULT NULL COMMENT '상품전시표시번호',
  `category1` varchar(40) DEFAULT NULL COMMENT '카테고리구분',
  `category2` varchar(40) DEFAULT NULL COMMENT '카테고리구분',
  `category3` varchar(40) DEFAULT NULL COMMENT '카테고리구분3',
  `p_disc_price` int(11) DEFAULT NULL COMMENT '할인가격',
  `p_disc_percent` int(11) DEFAULT NULL COMMENT '할인율',
  `p_count` int(3) DEFAULT NULL COMMENT '상품갯수',
  `p_stock_count` int(3) DEFAULT NULL COMMENT '상품재고수',
  `p_maked_date` date DEFAULT NULL COMMENT '제조일',
  `p_launch_date` date DEFAULT NULL COMMENT '출고일',
  `p_brand_nm` varchar(20) DEFAULT NULL COMMENT '브랜드명',
  `p_model_nm` varchar(60) DEFAULT NULL COMMENT '모델명',
  `p_origin_country` varchar(15) DEFAULT NULL COMMENT '원산지명',
  `p_production_company` varchar(20) DEFAULT NULL COMMENT '회사명',
  `p_tax_level_cd` char(4) DEFAULT NULL COMMENT '세금율코드',
  `p_tax_amount` int(2) DEFAULT NULL COMMENT '세율금액',
  `p_shipping_set` char(4) DEFAULT NULL COMMENT '배송설정',
  `p_shipping_price` int(11) DEFAULT NULL COMMENT '배송비',
  `p_pay_sign` text COMMENT '지불',
  `p_shipping_sign` text COMMENT '배송',
  `p_qna_sign` text COMMENT 'qna',
  `p_count_use_yn` char(1) DEFAULT NULL COMMENT '갯수사용여부',
  `set_best_yn` char(1) DEFAULT 'N' COMMENT '베스트상품여부',
  `best_no` varchar(3) DEFAULT NULL COMMENT '베스트번호',
  `insert_dt` datetime NOT NULL COMMENT '작성날짜',
  `insert_usr` varchar(12) NOT NULL COMMENT '작성자명',
  `update_dt` datetime NOT NULL COMMENT '수정날짜',
  `update_usr` varchar(12) NOT NULL COMMENT '수정자명',
  PRIMARY KEY (`p_no`)
) DEFAULT CHARSET=utf8 COMMENT='상품정보테이블(신)'
;

commit;

drop table if exists `tbl_product_category`;

CREATE TABLE if not exists `tbl_product_category` (
  `category_no` int(11) NOT NULL AUTO_INCREMENT COMMENT '카테고리번호',
  `name` varchar(40) NOT NULL COMMENT '카테고리명',
  `parent_no` int(11) DEFAULT NULL COMMENT '상위 부모카테고리번호',
  `order_no` int(11) DEFAULT NULL COMMENT '정렬번호',
  PRIMARY KEY (`category_no`)
) DEFAULT CHARSET=utf8 COMMENT='상품카테고리 관리 테이블'
;

commit;

drop table if exists `tbl_commcd`;

CREATE TABLE `tbl_commcd` (
  `comm_cd` varchar(7) NOT NULL COMMENT '공통코드',
  `p_comm_cd` varchar(7) DEFAULT NULL COMMENT '상위공통코드',
  `comm_nm` varchar(13) NOT NULL COMMENT '공통코드명',
  `desc` varchar(100) DEFAULT NULL COMMENT '코드설명',
  `sort_no` varchar(3) DEFAULT NULL COMMENT '정렬번호',
  `system_div` varchar(20) DEFAULT NULL COMMENT '시스템구분(assist:어시스트프로lab:제티랩)',
  `insert_dt` datetime NOT NULL COMMENT '등록날짜',
  `insert_usr` varchar(40) NOT NULL COMMENT '등록자명',
  `update_dt` datetime NOT NULL COMMENT '수정날짜',
  `update_usr` varchar(40) NOT NULL COMMENT '수정자명',
  PRIMARY KEY (`comm_cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='공통코드 테이블'
;

commit;

drop table if exists `tbl_coupon`;

CREATE TABLE `tbl_coupon` (
  `no` int(11) NOT NULL AUTO_INCREMENT COMMENT '번호',
  `coupon_no` varchar(60) NOT NULL COMMENT '쿠폰번호',
  `coupon_status` varchar(10) NOT NULL COMMENT '쿠폰상태',
  `ins_date` datetime NOT NULL COMMENT '작성일날짜',
  `ins_usr_id` varchar(40) NOT NULL COMMENT '작성자id',
  `ins_usr_nm` varchar(40) DEFAULT NULL COMMENT '작성자명',
  PRIMARY KEY (`no`)
) DEFAULT CHARSET=utf8 COMMENT='쿠폰 관리 테이블'
;

commit;

drop table if exists `tbl_coupon_use`;

CREATE TABLE if not exists `tbl_coupon_use` (
  `no` int(11) NOT NULL AUTO_INCREMENT COMMENT '번호',
  `coupon_no` varchar(60) NOT NULL COMMENT '쿠폰번호',
  `ins_usr_id` varchar(40) NOT NULL COMMENT '입력고객id',
  `ins_usr_nm` varchar(40) DEFAULT NULL COMMENT '입력고객명',
  `ins_date` datetime NOT NULL COMMENT '입력날짜',
  `accept_yn` char(1) DEFAULT 'N' COMMENT '허가YN',
  `accept_usr_id` varchar(40) DEFAULT NULL COMMENT '허가자id',
  `accept_usr_nm` varchar(40) DEFAULT NULL COMMENT '허가자명',
  `accept_date` datetime DEFAULT NULL COMMENT '허가일',
  PRIMARY KEY (`no`)
) DEFAULT CHARSET=utf8 COMMENT='쿠폰 사용 관리 테이블'
;

commit;

drop table if exists `tbl_menu`;

create table if not exists `tbl_menu` (
`menu_no` int(11) not null auto_increment comment '번호',
`menu_nm` varchar(40) not null comment '메뉴명',
`menu_link` varchar(200) not null comment '메뉴URL',
`menu_sort_no` int(11) null null comment '메뉴정렬번호',
`ins_dt` datetime null comment '작성일',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정일',
`upd_id` varchar(12) null comment '수정자id',
primary key(`menu_no`)
) default charset = 'utf8' comment '메뉴 정보 테이블';

commit;

DROP TABLE IF EXISTS `tbl_event`;

CREATE TABLE IF NOT EXISTS `tbl_event` (
`no` int(11) not null auto_increment comment '게시물번호',
`title` varchar(60) not null comment '제목',
`content` varchar(200) not null comment '내용',
`writer` varchar(20) null comment '작성자명',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(12) null comment '수정자id',
`count` int(11) null default 0 comment '조회수',
primary key(`no`)
) default charset = utf8 comment '이벤트 게시판 테이블';

commit;

/*
 * 이벤트 게시판 댓글 테이블
 */
drop table if exists `tbl_event_comment`;

create table if not exists `tbl_event_comment` (
 `rno` int(11) not null auto_increment comment '댓글번호',
 `bno` int(11) not null comment '게시판번호',
 `comment` varchar(2000) not null comment '댓글내용',
 `ins_dt` datetime not null comment '작성날짜',
 `ins_id` varchar(40) null comment '작성자id',
 primary key(`rno`)
) default charset = utf8 comment '이벤트 게시판 댓글 테이블';

commit;


/*
 * 리뷰 테이블
 */
DROP TABLE IF EXISTS `tbl_review`;

CREATE TABLE IF NOT EXISTS `tbl_review` (
`no` int(11) not null auto_increment comment '게시물번호',
`title` varchar(60) not null comment '타이틀',
`content` varchar(200) not null comment '내용',
`writer` varchar(20) null comment '작성자명',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(12) null comment '수정자id',
`count` int(11) null default 0 comment '조회수',
primary key(`no`)
) default charset = utf8 comment '리뷰 테이블';

commit;


/*
 * 리뷰 게시판 댓글 테이블
 */
drop table if exists `tbl_review_comment`;

create table if not exists `tbl_review_comment` (
 `rno` int(11) not null auto_increment comment '댓글번호',
 `bno` int(11) not null comment '게시판번호',
 `comment` varchar(2000) not null comment '댓글내용',
 `ins_dt` datetime not null comment '작성날짜',
 `ins_id` varchar(40) null comment '작성자id',
 primary key(`rno`)
) default charset = utf8 comment '리뷰 게시판 댓글 테이블';

commit;



/*
 * 상품권 테이블
 */
DROP TABLE IF EXISTS `tbl_product_coupon`;

CREATE TABLE IF NOT EXISTS `tbl_product_coupon` (
`no` int(11) not null auto_increment comment '게시물번호',
`title` varchar(60) not null comment '타이틀',
`content` varchar(200) not null comment '내용',
`writer` varchar(20) null comment '작성자명',
`pwd_yn` char(1) null default 'N' comment '비밀번호여부',
`pwd` varchar(40) null comment '비밀번호',
`status` varchar(10) null comment '진행상태',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(12) null comment '작성자id',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(12) null comment '수정자id',
`count` int(11) null default 0 comment '조회수',
primary key(`no`)
) default charset = utf8 comment '상품권 테이블';

commit;

/*
 * 상품권 댓글 테이블
 */
drop table if exists `tbl_product_coupon_comment`;

create table if not exists `tbl_product_coupon_comment` (
 `rno` int(11) not null auto_increment comment '댓글번호',
 `bno` int(11) not null comment '게시판번호',
 `pwd_yn` char(1) null default 'N' comment '비밀번호여부',
 `pwd` varchar(40) null comment '비밀번호',
 `comment` varchar(2000) not null comment '댓글내용',
 `ins_dt` datetime not null comment '작성날짜',
 `ins_id` varchar(40) null comment '작성자id',
 primary key(`rno`)
) default charset = utf8 comment '게시판 댓글 테이블';

commit;



/*
	SMS 관리 테이블 생성

*/
drop table if exists `tbl_sms`;

create table if not exists `tbl_sms` (
`no` int(11) not null auto_increment comment 'SMS번호',
`subject` varchar(20) not null comment 'SMS제목',
`content` varchar(200) not null comment 'SMS내용',
`from_tel_no` varchar(13) not null comment 'SMS 발신연락처',
`type` varchar(10) null comment '분류',
`use_yn` char(1) default 'N' comment '사용여부',
`ins_dt` datetime null comment '작성날짜',
`ins_id` varchar(20) null comment '작성자id',
`ins_nm` varchar(20) null comment '작성자명',
`upd_dt` datetime null comment '수정날짜',
`upd_id` varchar(20) null comment '수정자id',
`upd_nm` varchar(20) null comment '수정자명',
primary key(`no`)
) default charset=utf8 comment 'sms 관리 테이블';

commit;

drop table if exists `tbl_config`;

create table if not exists `tbl_config` (
`sms_use_yn` char(1) default 'N' comment 'sms사용여부'
) default charset=utf8 comment 'system 관리 테이블';

commit;

/**
* 주문자 정보 관리 테이블.
*/
drop table if exists `tbl_shipping`;

create table if not exists `tbl_shipping` (
`no` int(11) not null auto_increment comment '번호',
`pay_code` varchar(20) not null comment '결제코드번호',
`order_usr_id` varchar(40) not null comment '주문자id',
`order_nm` varchar(20) not null comment '주문자명',
`order_email` varchar(60) null comment '주문자이메일',
`order_tel_no` varchar(13) null comment '주문자연락처',
`order_tel_no1` varchar(4) null comment '주문자연락처1',
`order_tel_no2` varchar(4) null comment '주문자연락처2',
`order_tel_no3` varchar(4) null comment '주문자연락처3',
`order_cell_no` varchar(13) null comment '주문자휴대폰연락처',
`order_cell_no1` varchar(3) null comment '주문자휴대폰연락처1',
`order_cell_no2` varchar(4) null comment '주문자휴대폰연락처2',
`order_cell_no3` varchar(4) null comment '주문자휴대폰연락처3',
`shipping_status` char(4) null comment '배송상태(준비중/처리완료)',
`shipping_yn` char(1) default 'N' null comment '처리완료여부',
`manager_ins_id` varchar(40) null comment '담당작성자id',
`manager_ins_nm` varchar(20) null comment '담당작성자명',
`manager_ins_date` datetime null comment '담당작성일',
`manager_upd_id` varchar(40) null comment '담당수정자id',
`manager_upd_nm` varchar(20) null comment '담당수정자명',
`manager_upd_date` datetime null comment '담당자수정일',
`ins_date` datetime not null comment '작성일',
`ins_usr_id` varchar(40) null comment '작성자id',
`upd_date` datetime not null comment '수정일',
`upd_usr_id` varchar(40) null comment '수정자id',
primary key(`no`)
) default charset='utf8' comment '주문자 정보 관리 테이블';

commit;
