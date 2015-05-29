var request = require('./tools.js').tryRequest;
var cheerio = require('cheerio');
var async = require('async')
var fs = require('fs');
var tools = require('./tools.js');
var _ = require('lodash');
var _s = require('underscore.string');
var pg = require('pg');
var conString = "postgres://postgres:123456@127.0.0.1:5432/alibaba";
var moment = require('moment');
// var readFileName = process.argv[2] || 'test.json';
var readFileName = process.argv[2] || 'catList.json';
var writeFileName = process.argv[3] || 'companyList.json';
var cat = [];
var errurl = [];
fs.readFile(readFileName, function (err, data) {
	if(err) console.log(err)
	var list = JSON.parse(data);
	async.eachSeries(list, function(url, callback) {
		console.log("+++++++++++++++++++++",url, moment().utc().format())
		request({
			url: url,
			headers: {
	    	'User-Agent': 'request'
			}
  	}, function (err, res, data) {
			if (err || res.statusCode != 200) {
				console.log('eachReqError',err)
				errurl.push(url)
				callback()
			} else {
				$ = cheerio.load(data);
				times = $('a.next').prev().html()||1;
				var count = 0;
				async.whilst(
			    function () { return count < times; },
			    function (cb) {
		        count++;
	      		request({
	      			url: url + '/' + count,
	      			headers: {
	      	    	'User-Agent': 'request'
	      			}
	        	}, function (err, res, data) {
	        		console.log("---------------------",url + '/' + count, moment().utc().format());
	      			if (err || res.statusCode != 200) {
	      				
								console.log('>>>>>>>>>>>>>>>>>>>>>whileReqError', moment().utc().format(),err)
								errurl.push(url)
								cb(true)

	      			} else {
		    				var companys = getEleAndInsert(data);
		    				async.each(companys, function(company,each_cb) {
	      				request({
	      					url: company[1],
	      					headers: {
	      				  	'User-Agent': 'request'
	      					}
	      				}, function (err, res, data) {
	      					console.log("=====================",company[1], moment().utc().format());
	      					if (err || res.statusCode != 200) {
	      						console.log('>>>>>>>>>>>>>>>>>>>>>detailReqError', company[1], moment().utc().format(),err)
	      						errurl.push(company[1]);
	      						each_cb();
	      					} else {
	      						$ = cheerio.load(data);
	      						var contact = {
	      							person: _s.clean($('div.contact-overview>div.contact-info>h1.name').text())
	      						}
	      						$('div.contact-overview>div.contact-info>dl>dt').each(function(i, dt) {
	      							contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
	      						})
	      						$('div.contact-detail>dl>dt').each(function(i, dt) {
	      							contact[$(dt).text().replace(':','')] = $(dt).next('dd').text();
	      						})
	      						$('table.company-info-data.table>tbody>tr').each(function(i, tr) {
	      							contact[$('th', tr).text().replace(':','')] = $('td', tr).text();
	      						})
	      						company.push(JSON.stringify(contact))
	      						pg.connect(conString, function(err, client, done) {
	      							if(err) {
	      								return console.error('err fetch', err);
	      							}
	      							client.query('INSERT INTO alibaba_company (name, url, gold_supplier, assurance, update_date, status, contact) VALUES ($1, $2, $3, $4, $5, $6, $7);' , company, function(err, result) {
	      								done();
	      								if(err) {
	      									return console.error('error running query', err);
	      								}
	      								console.log(!!result.rows)
	      								each_cb();
	      							})
	      						})
	      					}
	      				})
	      			}, function (err) {
	      					if(err) console.log(err);
	      					console.log("---------------------",url + '/' + count, 'end')
	      					cb();
	      				})
	      			}

	    				
	      		})
			    },
			    function (err) {
		        callback()
			    }
				);
				// console.log($('.main-wrap>div>div.f-icon.m-item').length)
				// $('#J-items-content>div.f-icon.m-item').each( function(i, li) {
				// 	console.log($('div.item-title .title.ellipsis>a',li).attr('href'));
				// })
			}
			// console.log(data.toString())
			// fs.writeFile('test.html', data.toString(), function(err){if(err) console.log(err)})
			

		})
	}, function (err) {
		if(err) console.log(err);
		fs.writeFile('companyList.json', JSON.stringify(cat))
		fs.writeFile('companyListERR.json', JSON.stringify(errurl))
	})
	
})
// 
// request({
// 		url: 'http://www.alibaba.com/catalogs/corporations/CID3411',
// 		headers: {
//     	'User-Agent': 'request'
//   	}
// 	}, function (err, res, data) {
// 	console.log(data)
// })
// 
// 
function getEleAndPush(data, arr) {
	$ = cheerio.load(data);
	$('#J-items-content>div.f-icon.m-item').each( function(i, li) {
		// arr.push($('div.item-title .title.ellipsis>a',li).attr('href'));
		arr.push({
			name: $('div.item-title .title.ellipsis>a',li).html(),
			goldSupplier: $('.ico-year>span', li).length&&/\d+/.test($('.ico-year>span').attr('class'))?Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]):undefined,
			assurance: $('.ico-ta', li).length? true:undefined,
			href: tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href'))
		})
	})
}

function getEleAndInsert(data) {
// function getEleAndInsert() {
	$ = cheerio.load(data);
	var data = [];
	$('#J-items-content>div.f-icon.m-item').each( function(i, li) {
	// 	// arr.push($('div.item-title .title.ellipsis>a',li).attr('href'));
	// 	arr.push({
	// 		name: $('div.item-title .title.ellipsis>a',li).html(),
	// 		goldSupplier: $('.ico-year>span', li).length&&/\d+/.test($('.ico-year>span').attr('class'))?Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]):undefined,
	// 		assurance: $('.ico-ta', li).length? true:false,
	// 		href: tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href'))
		data.push([
			tools.convertHTMLEntity($('div.item-title .title.ellipsis>a',li).html()), 
			tools.getContact($('div.item-title .title.ellipsis>a',li).attr('href')),
			$('.ico-year>span', li).length&&/\d+/.test($('.ico-year>span').attr('class'))?Number(/\d+/.exec($('.ico-year>span').attr('class'))[0]):0,
			$('.ico-ta', li).length? true:false,
			moment().utc().format('YYYY-MM-DD HH:mm:ss'),
			'suc']);
	})
	return data;

}





	