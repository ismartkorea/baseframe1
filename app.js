var express = require('express');
var engine = require('ejs-locals');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var mongoose = require('mongoose');

// 라우터 초기화.
var index = require('./routes/index');
var users = require('./routes/users');
var commons = require('./routes/common/common');
var terms = require('./routes/term');
var mypage = require('./routes/mypage');
var cart = require('./routes/cart');
var ascenter = require('./routes/ascenter');
var purchase = require('./routes/purchase');
var signup = require('./routes/signup');
var login = require('./routes/login');
var product = require('./routes/product');
var announce = require('./routes/announce');
var event = require('./routes/event');
var review = require('./routes/review');
var search = require('./routes/search');
var pay = require('./routes/pay');

// 어드민 라우터 초기화.
var admin = require('./routes/admin/admin');
var adminLogin = require('./routes/admin/login');
var adminSignup = require('./routes/admin/signup');
var adminMember = require('./routes/admin/members');
var adminManager = require('./routes/admin/managers');
var adminPay = require('./routes/admin/pay');
var adminCommonCd = require('./routes/admin/commoncd');
var adminUser = require('./routes/admin/users');
var adminCoupon = require('./routes/admin/coupon');
var adminProduct = require('./routes/admin/product');
var adminVisit = require('./routes/admin/visit');
var adminLog = require('./routes/admin/log');
var adminAnnounce = require('./routes/admin/announce');
var adminQna = require('./routes/admin/qna');
var adminMenu = require('./routes/admin/menu');
var adminEvent = require('./routes/admin/event');
var adminReview = require('./routes/admin/review');
var adminSms = require('./routes/admin/sms');

// MySQL Connect 설정.
var config = require('./routes/common/dbconfig');
global.dbConn = mysql.createConnection(config);
handleDisconnect(global.dbConn);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// session setup
var mongostore = require('connect-mongo')(session);
var mongourl = "mongodb://localhost:27017/base1";

// 몽구스 스토이인경우.
app.use(session({
  secret: 'base1!@$#!',
  store: new mongostore({
    url:mongourl,
    ttl:60 * 60 * 1000// 1시간 설정
  }),
  resave: false,
  saveUninitialized: false,
  cookie : {
    //expires : new Date(253402300000000)
    maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효기간 1시간
  }
}));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'tmp')));

// 화면 파트
app.use('/', index);
app.use('/users', users);
app.use('/common', commons);
app.use('/terms', terms);
app.use('/mypage', mypage);
app.use('/cart' , cart);
app.use('/ascenter', ascenter);
app.use('/purchase', purchase);
app.use('/signup', signup);
app.use('/login', login);
app.use('/product', product);
app.use('/online', product2);
app.use('/gkgame', product3);
app.use('/ggift', product4);
app.use('/afreeca', product5);
app.use('/coupon', product6);
app.use('/announce', announce);
app.use('/event', event);
app.use('/review', review);
app.use('/search', search);
app.use('/pay', pay);

// 어드민 파트.
app.use('/admin', admin);
app.use('/admin/signup', adminSignup);
app.use('/admin/login', adminLogin);
app.use('/admin/user', adminUser);
app.use('/admin/member', adminMember);
app.use('/admin/manager', adminManager);
app.use('/admin/pay', adminPay);
app.use('/admin/commoncd', adminCommonCd);
app.use('/admin/product', adminProduct);
app.use('/admin/product2', adminProduct2);
app.use('/admin/product3', adminProduct3);
app.use('/admin/product4', adminProduct4);
app.use('/admin/product5', adminProduct5);
app.use('/admin/product6', adminProduct6);
app.use('/admin/coupon', adminCoupon);
app.use('/admin/log', adminLog);
app.use('/admin/visit', adminVisit);
app.use('/admin/announce', adminAnnounce);
app.use('/admin/qna', adminQna);
app.use('/admin/menu', adminMenu);
app.use('/admin/event', adminEvent);
app.use('/admin/review', adminReview);
app.use('/admin/sms', adminSms);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.engine('ejs', engine);

// CONNECT TO MONGODB SERVER
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
  // CONNECTED TO MONGODB SERVER
  console.log("Connected to mongod server");
});
mongoose.connect('mongodb://localhost:27017/base1', {useMongoClient: true });


/**
 * DB ReConnect 함수.
 * @param client
 */
function handleDisconnect(client) {
  client.on('error', function (error) {
    if (!error.fatal) return;
    if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;
    console.error('> Re-connecting lost MySQL connection: ' + error.stack);

    // NOTE: This assignment is to a variable from an outer scope; this is extremely important
    // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
    // to `global.mysqlClient =` in node.
    global.dbcon = mysql.createConnection(client.config);
    handleDisconnect(global.dbcon);
    global.dbcon.connect();
  });
}

module.exports = app;
