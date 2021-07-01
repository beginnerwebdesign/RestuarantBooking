var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "keerthana",
  database:"db"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "select * from user";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
  });
});