var request = require('./tools.js').tryRequest;
var cheerio = require('cheerio');
var async = require('async')
var fs = require('fs');
var tools = require('./tools.js');
var _ = require('lodash');
var _s = require('underscore.string');
var pg = require('./pg.js');
var moment = require('moment');
// var readFileName = process.argv[2] || 'test.json';
var readFileName = process.argv[2] || './data/catList.json';
var errFileName = process.argv[2] || './data/catListErr.json';
var insertSql = 'INSERT INTO alibaba_company (name, sid, url, gold_supplier, assurance, update_date, status, contact) '
              + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8);'
var insertErrSql = 'INSERT INTO alibaba_company (name, sid, url, gold_supplier, assurance, update_date, status) '
              + 'VALUES ($1, $2, $3, $4, $5, $6, $7);'
var checkSidSql = 'SELECT id, name, sid, url FROM alibaba_company WHERE sid = $1';
var errList = [];
fs.readFile(readFileName, function (err, data) {
	if(err) console.log(err);
	var list = JSON.parse(data);
	async.eachSeries(list, function(url, callback) {
		console.log("+++++++++++++++++++++",url, moment().utc().format());
		request({
			url: url,
			headers: {
	    	'User-Agent': 'request'
			}
  	}, function (err, res, data) {
			if (err || res.statusCode != 200) {
				console.log('eachReqError',err);
        errList.push(url);
				callback();
			} else {
				$ = cheerio.load(data);
				times = $('a.next').prev().html() || 1;
				var count = 0;
				async.whilst(
			    function () { return count < times; },
			    function (cbEachPage) {
		        count++;
	      		request({
	      			url: url + '/' + count,
	      			headers: {
	      	    	'User-Agent': 'request'
	      			}
	        	}, catchCompanyListEachPageAfterRequest(url, count, cbEachPage));
			    },
			    function (err) {
		        callback();
			    }
				);
			}
		})
	}, function (err) {
		if(err) console.log(err);
    fs.writeFile(errFileName, JSON.stringify(errList));
	})
})

function catchCompanyListEachPageAfterRequest (url, count, cbEachPage) {
  return function (err, res, data) {
    console.log("---------------------", url + '/' + count, moment().utc().format());
    if (err || res.statusCode != 200) {
      console.log('>>>>>>>>>>>>>>>>>>>>>whileReqError', moment().utc().format(),err);
      console.log(err|| res.statusCode);
      count--;
      cb();
    }
    else {
      async.filter(catchCompanyList(data), checkNotCompanyExist, function(companys) {
        async.each(companys, function(company, cbEachCompany) {
          request(
            {
            url: company[2],
            headers: {
              'User-Agent': 'request'
            }
          },
          catchCompanyDetailAfterRequest(company, cbEachCompany));
        },
        function (err) {
            if(err) console.log(err);
            console.log("---------------------",url + '/' + count, 'end')
            cbEachPage();
        })
      })
    }
  }
}

function catchCompanyList(data) {
	var $ = cheerio.load(data);
	var result = [];
	$('#J-items-content>div.f-icon.m-item').each( function(i, li) {
    result.push([
			tools.convertHTMLEntity($('div.item-title .title.ellipsis>a',li).html()),
			Number($('h2.title.ellipsis>a', li).attr('data-hislog')),
			tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href')),
			$('.ico-year>span', li).length&&/\d+/.test($('.ico-year>span').attr('class'))?Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]):0,
			$('.ico-ta', li).length? true:false
		]);
	})
	return result;
}

function checkNotCompanyExist (company, callback) {
  pg.query(checkSidSql, [company[1]], function(err, result){
    if(result.rowCount > 0) {
      callback(false);
    } else {
      console.log('havent')
      callback(true);
    }
  })
}

function catchCompanyDetailAfterRequest (company, cbEachCompany) {
  return function (err, res, data) {
    console.log("=====================",company[1], moment().utc().format());
    if (err || res.statusCode != 200) {
      console.log('>>>>>>>>>>>>>>>>>>>>>detailReqError', company[1], moment().utc().format(),err);
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


function catchCompanyDetailAndPush(data, company) {
  var $ = cheerio.load(data);
  var contact = {
    person: _s.clean($('div.contact-overview>div.contact-info>h1.name').text())
  };
  $('div.contact-overview>div.contact-info>dl>dt').each(function(i, dt) {
    contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
  });
  $('div.contact-detail>dl>dt').each(function(i, dt) {
    contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
  });
  company.push(moment().utc().format('YYYY-MM-DD HH:mm:ss'));
  company.push('suc');
  company.push(JSON.stringify(contact));
}
