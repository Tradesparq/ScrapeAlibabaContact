var cheerio = require("cheerio");
var fs = require('fs');
var async = require('async');
var _ = require('lodash');

var tools = require('./tools/tools.js');
var request = require('./tools/tools.js').tryRequest;
var redis = require('./tools/redis.js');

var url = 'http://www.alibaba.com/countrysearch/CN-China.html';
var REDIS_KEY = 'alibaba_category_key';

async.auto({
  homeDate: [getHome],
  firstCat: ['homeDate', getFirstCat],
  secondCat: ['firstCat', getSecondCat],
  catList: ['secondCat', toUrlList]
}, function (err, result) {
  async.eachSeries(result.catList, function (cat, callback) {
    redis.sadd(REDIS_KEY, cat, function (){
      callback();
    });
  }, function(err) {
    if (err) console.log(err);
    else console.log('---- Total add', result.catList.length,
    'company ids into redis', REDIS_KEY, '----')
    redis.end();
  })
})

function getHome(cb, result) {
	request({url: url}, function (err, res, data) {
		if (!err && res.statusCode == 200) {
			cb(null, data);
		} else {
			cb(err);
		}
	});
}

function getFirstCat(cb, result) {
	var cat = {};
	if (result.homeDate) {
		var $ = cheerio.load(result.homeDate);
		var list = $('div.vi-component>ul.wordlist-class7>li>a');
		list.each(function (i, item) {
			cat[tools.convertHTMLEntity($(item).html())] = $(item).attr('href');
		});
		console.log(cat);
		cb(null, cat);
	}
}

function getSecondCat(cb, result) {
	var cat = {};
	if(result.firstCat) {
		var firstCat = _.clone(result.firstCat);
		var cat = _.clone(result.firstCat);
		async.eachSeries(Object.keys(firstCat), function (key, callback) {
			request({url: firstCat[key]}, function (err, res, data) {
				console.log('req ', key);
				if (!err && res.statusCode == 200) {
					cat[key] = {};
					var $ = cheerio.load(data);
					var li = $('div.categorylist>div.section>ul>li');
					li.each(function (i, item) {
						var catName = tools.convertHTMLEntity($('a', item).html());
						cat[key][catName] = tools.getCIDtoURL($('a',item).attr('href'));
						if ($(item).next('ul').length) { // has child cat
							cat[key][catName] = {};
							$(item).next('ul').children('li').each(function (i, childItem) {
								cat[key][catName][tools.convertHTMLEntity(
                  $('a', childItem).html())] = tools.getCIDtoURL(
                    $('a', childItem).attr('href'));
							})
						}

					});
					callback();
				}
			})
		}, function (err) {
			if (err) cb(err);
			cb(null, cat)
		})
	}

}

function toUrlList (cb, result) {
	if(result.secondCat) {
		var secondCat = _.clone(result.secondCat);
		var result = _.uniq(_.flatten(Object.keys(secondCat).map(function (e) {
					return catEach(secondCat[e]);
				}), true));
    cb(null, result);
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
