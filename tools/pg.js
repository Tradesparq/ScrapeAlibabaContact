var pg = require('pg');
var config = require('../config.js');
var conString = config.db.dialect + '://' + config.db.user + ':'
              + config.db.pass + '@' + config.db.host + '/' + config.db.name;
module.exports = new pg.Client(conString);
