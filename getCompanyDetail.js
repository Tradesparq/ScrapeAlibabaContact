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
var updateDetailSql = 'UPDATE alibaba_company SET contact = $1, '
                    + 'update_date = $2, status = $3 WHERE id = $4';
var updateUrlSql = 'UPDATE alibaba_company SET update_date = $1, url= $2,'
                 + ' status = $3 WHERE id = $4';
var updateDetailErrSql = 'UPDATE alibaba_company SET update_date = $1, '
                       + 'status = $2 WHERE id = $3';
// var has = 3;
var has = true;
var REDIS_KEY = 'alibaba_company_key';
pg.connect();
async.whilst(function () {
  return has;
}, function (callback) {
  redis.spop(REDIS_KEY, function (err, company) {
    if (company) {
      company = JSON.parse(company)
      console.log("+++++++++++++++++++++",
        company.url, moment().utc().format());
      if (/\/\/[^\/]*_\.[^\/]*\//.test(company.url)) {
        pg.query(updateUrlSql, [
          moment().utc().format('YYYY-MM-DD HH:mm:ss'),
          company.url,
          'CANT REQ',
          company.id
        ], function (err) {
          if (err) console.log("+++++++++++++++++++++", company.url, err, 
            moment().utc().format());
          callback();
        })
      } else {
        request({url: company.url}, function (err, res, data) {
          if (res && res.statusCode == 301) {
            console.log(res.headers.location)
            pg.query(updateUrlSql, [
              moment().utc().format('YYYY-MM-DD HH:mm:ss'),
              res.headers.location,
              /\/\/[^\/]*_\.[^\/]*\//.test(res.headers.location)?
              'CANT REQ': 'brief',
              company.id
            ], function (err) {
              if (err) console.log("+++++++++++++++++++++", company.url, err, 
              moment().utc().format());
              callback();
            })
            // callback();
          } else if (err || res.statusCode != 200) {
          // if (err || res.statusCode != 200) {
            console.log('eachReqError',err || res.statusCode);
            pg.query(updateDetailErrSql, [
              moment().utc().format('YYYY-MM-DD HH:mm:ss'),
              res && res.statusCode && res.statusCode == 404? '404': 'detailErr',
              company.id
            ], function (err) {
              if (err) console.log("+++++++++++++++++++++", company.url, err, 
                moment().utc().format());
              callback();
            })
          } else {
            pg.query(updateDetailSql, catchCompanyDetailAndPush(data, company),
            function (err, result) {
              if (err) console.log("+++++++++++++++++++++", company.url, err, 
              moment().utc().format());
                callback();
            });
          }
        })
      }
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

function catchCompanyDetailAndPush (data, company) {
  var $ = cheerio.load(data);
  var contact = {
    person: _s.clean($('div.contact-overview>div.contact-info>h1.name').text())
  };
  $('div.contact-overview>div.contact-info>dl>dt').each(function (i, dt) {
    contact[$(dt).text().replace(':', '')] = $(dt).next('dd').text();
  });
  $('div.contact-detail>dl>dt').each(function (i, dt) {
    contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
  });
  return [
    JSON.stringify(contact),
    moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    'detail',
    company.id
  ]
}
