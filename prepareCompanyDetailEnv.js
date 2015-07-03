var async = require('async');
var pg = require('./tools/pg.js');
var redis = require('./tools/redis.js');
var getBriefSql = 'SELECT id, url FROM alibaba_company '
                + 'WHERE status <> \'detail\' AND status <> \'404\''
                + ' AND status <> \'CANT REQ\'';
var REDIS_KEY = 'alibaba_company_key';
pg.connect();
pg.query(getBriefSql, [], function (err, data) {
  console.log(data.rows.length,'lines')
  if (err) console.log(err)
  else {
    console.log('add', data.rows.length, 'items to redis');
    async.eachSeries(data.rows, function (company, callback) {
      redis.sadd(REDIS_KEY, JSON.stringify(company), function () {
        callback();
      });
    }, function (err) {
      if (err) console.log(err);
      else console.log('---- Total add', data.rows.length,
        'company ids into redis', REDIS_KEY, '----')
      redis.end();
      pg.end();
    })
  }
})
