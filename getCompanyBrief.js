var fs = require('fs');
var moment = require('moment');
var async = require('async')
var cheerio = require('cheerio');
var _ = require('lodash');
var _s = require('underscore.string');

var request = require('./tools/tools.js').tryRequest(false);
var tools = require('./tools/tools.js');
var pg = require('./tools/pg.js');

var redis = require('./tools/redis.js');

var insertBriefSql = 'INSERT INTO alibaba_company (name, sid, url,'
                   + 'gold_supplier, assurance, update_date, status) '
                   + 'VALUES ($1, $2, $3, $4, $5, $6, $7);';
var checkSidSql = 'SELECT id, name, sid, url FROM alibaba_company '
                + 'WHERE sid = $1';
var has = true;
var REDIS_KEY = 'alibaba_category_key';

pg.connect();
async.whilst(function () {
  return has;
}, function (callback) {
  redis.spop(REDIS_KEY, function (err, url) {
    if (url) {
      console.log("+++++++++++++++++++++", url, moment().utc().format());
      request({url: url}, function (err, res, data) {
        if (err || res.statusCode != 200) {
          console.log("+++++++++++++++++++++", url, 'eachReqError', err, moment().utc().format());
          redis.sadd(REDIS_KEY, url, function (err) {
            if (err) console.log("+++++++++++++++++++++", url, "sadd error",  moment().utc().format());
            callback();
          })
        } else {
          $ = cheerio.load(data);
          times = $('a.next').prev().html() || 1;
          var count = 0;
          async.whilst(
            function () { return count < times; },
            function (cbEachPage) {
              count++;
              request({url: url + '/' + count},
                catchCompanyListEachPageAfterRequest(url, count, cbEachPage));
            },
            function (err) {
              if (err) {
                redis.sadd(REDIS_KEY, url, function (){
                  console.log("+++++++++++++++++++++", url, "sadd error", moment().utc().format());
                  callback();
                });
              } else {
                callback();
              }
            }
          );
        }
      })
    } else {
      has = false;
      callback();
    }
  });
}, function (err) {
  redis.end();
  pg.end();
  console.log('All Done.', new Date());
});

function catchCompanyListEachPageAfterRequest (url, count, cbEachPage) {
  return function (err, res, data) {
    console.log("---------------------", url + '/' + count, moment().utc().format());
    if (err || res.statusCode != 200) {
      console.log('>>>>>>>>>>>>>>>>>>>>>whileReqError', moment().utc().format(),err);
      console.log(err|| res.statusCode);
      count--;
      cbEachPage();
    }
    else {
      async.each(catchCompanyList(data), function (company, cbEachCompany) {
        checkCompanyExist(company, function (flag) {
          if (flag) cbEachCompany();
          else {
            company.push(moment().utc().format('YYYY-MM-DD HH:mm:ss'));
            company.push('brief');
            pg.query(insertBriefSql, company, function (err, result) {
              if (err) console.log(err);
              else {
                cbEachCompany();
              }
            })
          }
        })
      }, function (err) {
          if (err) console.log(err);
          console.log("---------------------",url + '/' + count, 'end')
          cbEachPage();
      })
    }
  }
}

function catchCompanyList(data) {
  var $ = cheerio.load(data);
  var result = [];
  $('#J-items-content>div.f-icon.m-item').each(function (i, li) {
    result.push([
      tools.convertHTMLEntity($('div.item-title .title.ellipsis>a',li).html()),
      Number($('h2.title.ellipsis>a', li).attr('data-hislog')),
      tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href')),
      $('.ico-year>span', li).length
      && /\d+/.test($('.ico-year>span').attr('class'))?
      Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]): 0,
      $('.ico-ta', li).length? true: false
    ]);
  })
  return result;
}

function checkCompanyExist (company, callback) {
  pg.query(checkSidSql, [company[1]], function (err, result){
    if (err) {
      console.log(err)
    } else if (result.rowCount > 0) {
      callback(true);
    } else {
      callback(false);
    }
  })
}
