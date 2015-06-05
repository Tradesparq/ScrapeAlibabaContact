var pg = require('pg');
var config = require('../config.js');
var conString = config.db.dialect + '://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + '/' + config.db.name;
// module.exports = {
//   query: function (sql, parameters, callback) {
//     pg.connect(conString, function(err, client, done) {
//       if(err) {
//         return console.error('err fetch', err);
//       }
//       client.query(sql , parameters, function(err, result) {
//         done();
//         if(err) {
//           callback(err, result);
//         } else {
//           callback(null, result);
//         }
//       })
//     })
//   }
// }
module.exports = new pg.Client(conString)
