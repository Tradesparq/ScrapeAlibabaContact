var fs = require('fs');
var moment = require('moment');
var async = require('async')
var cheerio = require('cheerio');
var _ = require('lodash');
var _s = require('underscore.string');

var request = require('./tools/tools.js').tryRequest;
var tools = require('./tools/tools.js');
var pg = require('./tools/pg.js');
var redis = require('./tools/redis.js');
var getRandomSql = 'SELECT id, name, sid, url, status FROM alibaba_company WHERE status = \'brief\' ORDER BY RANDOM() LIMIT 1;';
var updateDetail = 'UPDATE alibaba_company SET contact = $1, update_data = $2, status = $3 where id = $4';
var checkSidSql = 'SELECT id, name, sid, url FROM alibaba_company WHERE sid = $1';
var has = 3;
// var has = true;
var REDIS_KEY = 'alibaba_category_key';

async.whilst(function () {
  return --has;
}, function (callback) {
  pg.query(getRandomSql, [], function(err, result) {
    if(result.rows.length === 1) {
      request({
        url: rows.url,
        headers: {
          'User-Agent': 'request'
        }
      },
      catchCompanyDetailAfterRequest(result.rows, callback));

    } else {
      has = false;
      callback()
    }
    console.log(result.rows);
    callback()
  })
}, function (err) {
  pg.end();
});




function catchCompanyDetailAfterRequest (company, cbEachCompany) {
  return function (err, res, data) {
    console.log("=====================",company.url, moment().utc().format());
    if (err || res.statusCode != 200) {
      console.log('>>>>>>>>>>>>>>>>>>>>>detailReqError', company.url, moment().utc().format(),err);
      company.push(moment().utc().format('YYYY-MM-DD HH:mm:ss'));
      company.push('err');
      pg.query(insertErrSql, company, function (err, result) {
        if(err) console.log(err);
        else {
          console.log('inserted;');
          cbEachCompany();
        }
      });
    }
    else {
      var insertData = [

      ]
      catchCompanyDetailAndPush(data, company);
      pg.query(insertSql, company, function (err, result) {
        if(err) console.log(err);
        else {
          cbEachCompany();
        }
      });
    }
  }
}



// async.whilst(function () {
//   return has;
// }, function (callback) {
//   redis.spop(REDIS_KEY, function (err, url) {
//     if (url) {
//       console.log("+++++++++++++++++++++",url, moment().utc().format());
//       request({
//         url: url,
//         headers: {
//           'User-Agent': 'request'
//         }
//       }, function (err, res, data) {
//         if (err || res.statusCode != 200) {
//           console.log('eachReqError',err);
//           errList.push(url);
//           callback();
//         } else {
//           $ = cheerio.load(data);
//           times = $('a.next').prev().html() || 1;
//           var count = 0;
//           async.whilst(
//             function () { return count < times; },
//             function (cbEachPage) {
//               count++;
//               request({
//                 url: url + '/' + count,
//                 headers: {
//                   'User-Agent': 'request'
//                 }
//               }, catchCompanyListEachPageAfterRequest(url, count, cbEachPage));
//             },
//             function (err) {
//               if(err) {
//                 redis.sadd(REDIS_KEY, url, function(){
//                   callback();
//                 });
//               } else {
//                 callback();
//               }
//             }
//           );
//         }
//       })
//     } else {
//       has = false;
//       callback();
//     }
//   });
// }, function (err) {
//   redis.end();
//   console.log('All Done.',new Date());
// });
//
// function catchCompanyListEachPageAfterRequest (url, count, cbEachPage) {
//   return function (err, res, data) {
//     console.log("---------------------", url + '/' + count, moment().utc().format());
//     if (err || res.statusCode != 200) {
//       console.log('>>>>>>>>>>>>>>>>>>>>>whileReqError', moment().utc().format(),err);
//       console.log(err|| res.statusCode);
//       count--;
//       cb();
//     }
//     else {
//       async.each(companys, function(company, cbEachCompany) {
//         checkCompanyExist(company, function(flag) {
//           if(flag) cbEachCompany();
//           else {
//             company.push(moment().utc().format('YYYY-MM-DD HH:mm:ss'));
//             company.push('brief');
//             pg.query(insertBriefSql, company, function (err, result) {
//               if(err) console.log(err);
//               else {
//                 console.log('inserted;');
//                 cbEachCompany();
//               }
//             })
//           }
//         })
//       },
//         function (err) {
//             if(err) console.log(err);
//             console.log("---------------------",url + '/' + count, 'end')
//             cbEachPage();
//         })
//       })
      // async.filter(catchCompanyList(data), checkNotCompanyExist, function(companys) {
      //   async.each(companys, function(company, cbEachCompany) {
      //     request(
      //       {
      //       url: company[2],
      //       headers: {
      //         'User-Agent': 'request'
      //       }
      //     },
      //     catchCompanyDetailAfterRequest(company, cbEachCompany));
      //   },
      //   function (err) {
      //       if(err) console.log(err);
      //       console.log("---------------------",url + '/' + count, 'end')
      //       cbEachPage();
      //   })
      // })
//     }
//   }
// }


// function catchCompanyList(data) {
// 	var $ = cheerio.load(data);
// 	var result = [];
// 	$('#J-items-content>div.f-icon.m-item').each( function(i, li) {
//     result.push([
// 			tools.convertHTMLEntity($('div.item-title .title.ellipsis>a',li).html()),
// 			Number($('h2.title.ellipsis>a', li).attr('data-hislog')),
// 			tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href')),
// 			$('.ico-year>span', li).length&&/\d+/.test($('.ico-year>span').attr('class'))?Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]):0,
// 			$('.ico-ta', li).length? true:false
// 		]);
// 	})
// 	return result;
// }
//
// function checkCompanyExist (company, callback) {
//   pg.query(checkSidSql, [company[1]], function(err, result){
//     if(result.rowCount > 0) {
//       callback(false);
//     } else {
//       console.log('havent')
//       callback(true);
//     }
//   })
// }
//
// function catchCompanyDetailAndPush(data, company) {
//   var $ = cheerio.load(data);
//   var contact = {
//     person: _s.clean($('div.contact-overview>div.contact-info>h1.name').text())
//   };
//   $('div.contact-overview>div.contact-info>dl>dt').each(function(i, dt) {
//     contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
//   });
//   $('div.contact-detail>dl>dt').each(function(i, dt) {
//     contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
//   });
//   company.push(moment().utc().format('YYYY-MM-DD HH:mm:ss'));
//   company.push('suc');
//   company.push(JSON.stringify(contact));
// }
