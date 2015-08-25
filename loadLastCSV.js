var fs = require('fs');
var parse = require('csv-parse');
var async = require('async');
var redis = require('./tools/redis.js');
var REDIS_KEY = 'alibaba_company_key_old';
var lastCSV = process.argv[2] || './data/alibabaContact.csv';
var parser = parse({delimiter: ','}, function(err, data){
  async.eachSeries(data, function (record, callback) {
    redis.sadd(REDIS_KEY, JSON.stringify({name: record[1]}), function () {
      callback();
    });
  }, function (err) {
    if (err) console.log(err);
    else console.log('---- Total add', data.length,
      'company ids into redis', REDIS_KEY, '----')
    redis.end();
  })
});

fs.createReadStream(lastCSV).pipe(parser);
// fs.createReadStream('./data/test.csv').pipe(parser);