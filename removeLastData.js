var async = require('async');
var _ = require('lodash');
var tools = require('./tools/tools.js');
var pg = require('./tools/pg.js');
var redis = require('./tools/redis.js');
var REDIS_KEY = 'alibaba_company_key_old';
var getSql = 'DELETE FROM alibaba_company WHERE name = $1';
var has = true;
var count = 0;
pg.connect();
async.whilst(function () {
  return has;
}, function (callback) {
  redis.spop(REDIS_KEY, function (err, company) {
    if (company) {
      company = JSON.parse(company)
      console.log("+++++++++++++++++++++", company)
      pg.query(getSql, [company.name],
      function (err, result) {
        if (err) {
          console.log("+++++++++++++++++++++", company, err );
        } else {
          console.log(++count);
        }
          callback();
      });
    } else {
      has = false;
    }
  });
}, function (err) {
  if (err) console.log(err);
  console.log(down)
})
