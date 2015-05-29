var request = require('request');
var cheerio = require('cheerio');
var async = require('async')
var fs = require('fs');
var tools = require('./tools.js');
var _ = require('lodash');
// var readFileName = process.argv[2] || 'test.json';
var readFileName = process.argv[2] || 'secondCat.json';
var writeFileName = process.argv[3] || 'catList.json';
fs.readFile(readFileName, function(err, data) {
	if(!err) {
		var secondCat = JSON.parse(data);
		var result = _.flatten(Object.keys(secondCat).map(function (e) {
					return catEach(secondCat[e]);
				}), true);
		fs.writeFile(writeFileName, JSON.stringify(result), function (err) {
			if(!err) console.log(writeFileName, ' saved!');
		})

	}
})
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