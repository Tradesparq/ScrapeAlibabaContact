var request = require('request');
var fs = require('fs');
var url = 'http://www.alibaba.com/countrysearch/CN-China.html';
var fileName = 'home.html';
request(url, function (err, res, data) {
	if (!err && res.statusCode == 200) {
		fs.writeFile('home.html', data, function(err) {
			if(!err)
				console.log(fileName,' saved')
		})
	}
});