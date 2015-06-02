var retry = require('retry');
var request = require('request');
var config = require('./config.js');
var pg = require('pg');
var conString = config.db.dialect + '://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + '/' + config.db.name;

// db: {
// 	host: '127.0.0.1',
// 	name: 'alibaba',
// 	user: 'postgres',
// 	pass: '123456',
// 	dialect: 'postgres',
// 	port: 5432,
// 	logging: true
// }
module.exports = {
	convertHTMLEntity: function (str) {
		str = str.replace( /\&amp;/g, '&' );
		str = str.replace( /\&lt;/g, '<' );
		str = str.replace( /\&quot;/g, '\"' );
		str = str.replace( /\&copy;/g, '©' );
		str = str.replace( /\&reg;/g, '®' );
		str = str.replace( /\&laquo;/g, '«' );
		str = str.replace( /\&raqou;/g, '»' );
		str = str.replace( /\&apos;/g, "'" );
		return str;
	},
	getCIDtoURL: function (str) {
		reg = /\/(\d+)\//;
		// urlForm = 'http://www.alibaba.com/catalogs/corporations/CID_replaceHere_';
		urlForm = 'http://www.alibaba.com/catalogs/corporations/CID_replaceHere_--CN------------------50';
		if(!reg.test(str)) return false;
		else {
			cid = reg.exec(str)[1];
		}
		return urlForm.replace('_replaceHere_',cid);
	},
	getContact: function (str) {
		from = 'company_profile.html#top-nav-bar';
		to = 'contactinfo.html';
		return str.replace(from,to);
	},
	tryRequest: function (option, cb) {
	  var operation = retry.operation();
	  operation.attempt(function(currentAttempt) {
	    request(option, function(err, res, data) {
	      if (operation.retry(err)) {
	        return;
	      }
	      cb(err ? operation.mainError() : null, res, data);
	    });
	  });
	},
	pgQuery: function (sql, parameters, callback) {
		pg.connect(conString, function(err, client, done) {
			if(err) {
				return console.error('err fetch', err);
			}
			client.query(sql , parameters, function(err, result) {
				done();
				if(err) {
					callback(err, result);
				} else {
					callback(null, result);
				}
			})
		})
	}
}
