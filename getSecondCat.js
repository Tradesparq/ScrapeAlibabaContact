var request = require('./tools.js').tryRequest;
var cheerio = require('cheerio');
var async = require('async')
var fs = require('fs');
var tools = require('./tools.js');
var readFileName = process.argv[2] || 'firstCat.json';
var writeFileName = process.argv[3] || 'secondCat.json';

fs.readFile(readFileName, function(err, data) {
	if(!err) {
		var firstCat = JSON.parse(data);
		var cat = JSON.parse(data);
		// var firstCat = {"Transportation":"http://chinasuppliers.alibaba.com/products/china/12/Transportation.html"}
		// var cat = {"Transportation":{}}
		async.eachSeries(Object.keys(firstCat), function(key, callback) {
			request(firstCat[key], function (err, res, data) {
				console.log('req ', key);
			// request('http://chinasuppliers.alibaba.com/products/china/12/Transportation.html', function (err, res, data) {
				if (!err && res.statusCode == 200) {
					cat[key] = {};
					var $ = cheerio.load(data);
					var li = $('div.categorylist>div.section>ul>li');
					// console.log(li.length)
					li.each(function(i, item) {
						// console.log(i, $('a',item).attr('href'))
						// console.log($(item).next('ul').length);
						var catName = tools.convertHTMLEntity($('a', item).html())
						cat[key][catName] = tools.getCIDtoURL($('a',item).attr('href'));
						// console.log('sfsdfa',$('a', item).html())
						if($(item).next('ul').length) { // has child cat
							cat[key][catName] = {}
							$(item).next('ul').children('li').each(function(i, childItem) {
								// console.log($(childItem).html())
								cat[key][catName][tools.convertHTMLEntity($('a', childItem).html())] = tools.getCIDtoURL($('a', childItem).attr('href'));
							})
						}
						
					});
					callback();	
				}
			})
		}, function(err) {
			if (err) console.log(err);
			fs.writeFile(writeFileName, JSON.stringify(cat), function(err) {
				if(!err) console.log(writeFileName, ' saved!');
			})
		}) 
	}//req

})

