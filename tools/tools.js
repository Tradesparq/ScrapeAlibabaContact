var retry = require('retry');
var request = require('request');
var _ = require('lodash');
var config = require('../config.js');

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
	    request(_.assign({
				followRedirect: true,
				followAllRedirects: true,
				maxRedirects: 20,
        headers: {
          'User-Agent': 'request'
        }
			}, option), function(err, res, data) {
				// console.log(err.stack)
	      if (operation.retry(err)) {
	        return;
	      }
	      cb(err ? operation.mainError() : null, res, data);
	    });
	  });
	}
}
