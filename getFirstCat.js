var request = require('./tools.js').tryRequest;
var cheerio = require("cheerio");
var fs = require('fs');
var readFileName = process.argv[2] || 'home.html';
var writeFileName = process.argv[3] || 'firstCat.json';
var tools = require('./tools.js');
var cat = {};
fs.readFile(readFileName, function (err, data) {
	if(!err) {
		var $ = cheerio.load(data);
		var list = $('div.vi-component>ul.wordlist-class7>li>a');
		list.each(function (i, item) {
			cat[tools.convertHTMLEntity($(item).html())] = $(item).attr('href');
		});
		console.log(cat);
		fs.writeFile(writeFileName, JSON.stringify(cat), function(err) {
			if(!err) {
				console.log(writeFileName, ' saved!');
			}
		})
	}
})

