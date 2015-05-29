var request = require('./tools.js').tryRequest;
var cheerio = require("cheerio");
var fs = require('fs');
var tools = require('./tools.js');
var async = require('async')
var _ = require('lodash');

async.auto({
  homeDate: [getHome],
  firstCat: ['homeDate', getFirstCat],
  secondCat: ['firstCat', getSecondCat],
  urlList: ['secondCat', toUrlList]
}, function (err, result) {
	console.log('suc')
})

function getHome(cb, result) {
	var url = 'http://www.alibaba.com/countrysearch/CN-China.html';
	request(url, function (err, res, data) {
		if (!err && res.statusCode == 200) {
			cb(null, data);
		} else {
			cb(err);
		}
	});
}

function getFirstCat(cb, result) {
	var cat = {};
	console.log(result)
	if(result.homeDate) {
		var $ = cheerio.load(result.homeDate);
		var list = $('div.vi-component>ul.wordlist-class7>li>a');
		list.each(function (i, item) {
			cat[tools.convertHTMLEntity($(item).html())] = $(item).attr('href');
		});
		console.log(cat);
		cb(null, cat)
	}
}

function getSecondCat(cb, result) {
	console.log(result)
	var cat = {}
	if(result.firstCat) {
		var firstCat = _.clone(result.firstCat);
		var cat = _.clone(result.firstCat);
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
			if (err) cb(err);
			cb(null, cat)
		}) 
	}//req

}

function toUrlList (cb, result) {
	console.log(result)
	var writeFileName = 'catList.json';
	if(result.secondCat) {
		console.log(result.secondCat)
		var secondCat = _.clone(result.secondCat);
		var result = _.flatten(Object.keys(secondCat).map(function (e) {
					return catEach(secondCat[e]);
				}), true);
		fs.writeFile(writeFileName, JSON.stringify(result), function (err) {
			console.log(result, writeFileName)
			if(!err) console.log(writeFileName, ' saved!');
			cb(null, result)
		})
	}	
}

function catEach(obj) {
	if(typeof obj == 'object') {
		var keys = Object.keys(obj);
		if(keys.length == 1) {
			return catEach(obj[keys[0]]);
		} else if(keys.length > 1) {
			return keys.map(function(key) {
				return catEach(obj[key])
			})
		}
	} else if(typeof obj == 'string') {
		return obj
	}
}