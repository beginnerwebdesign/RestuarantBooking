// Dependencies
// =============================================================
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/RestuarantDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
//to send message using twilio
const accountSid = "ACb674d3cf56445bcba0299337f5522498";
const authToken = "71f23e94c02588bbae158fdc9e5832ec";
const client = require('twilio')(accountSid, authToken);



// Sets up the Express App
// =============================================================
var app = express();
var PORT = 3000;

// Sets up the Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.text());
app.use(bodyParser.json({
  type: "application/vnd.api+json"
}));

// Reservation DATA



var tables = [];
var waitlist = [];

// Routes
var restuarantSchema = new mongoose.Schema({

  name: String,
  password: String,
  email: String,
  tables: Number
})
var userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phonenumber: String,
  restuarantName: String,
  date:String
})

var restuarants = mongoose.model('restuarants', restuarantSchema)
var users = mongoose.model('users', userSchema)
var rest;
var date;

app.get("/", function (req, res) {
  restuarants.find({}, function (err, result) {
    if (err) throw err;
    else {

      res.render("index.ejs", {
        restuarantsName: result
      })
    }
  }).then(function () {
    res.render("index.ejs", {
      restuarantsName: result
    })
  })
});
app.post("/api", (req, res) => {
  app.use(express.static(path.join(__dirname, '/public')));
  rest = req.body.lastname
  users.find({
    restuarantName: rest
  }, function (err, result) {
    console.log(result)
  })
  res.render("reserve1.ejs", {
    restuarant: req.body.lastname,
    msg: " "
  })
})

app.get("/register", function (req, res) {
  res.render("register.ejs", {
    msg: " "
  })
})

//  at current reservations.

app.get("/login", function (req, res) {
  app.use(express.static(path.join(__dirname, '/public')));
  res.render("login1.ejs",{msg:" "})
});

app.post("/login",function(req,res){
  var email=req.body.email
  var password=req.body.password
  //console.log(email,password)

  restuarants.findOne({email:email},function(err,foundUser){
    if(err){
      console.log("err");
    }
    else{
      if(foundUser){
      if(foundUser.password===password){
        users.find({restuarantName:foundUser.name},function(err, result) {
          if (err) throw err;
          res.render("restuarantdata.ejs",{data:result})
        });
      }
      else{
          var msg="!Incorrect password"
        res.render("login1.ejs",{msg:msg})
      }
    }
    else{
        var msg="!Incorrect username"
        res.render("login1.ejs",{msg:msg})
    }
    }
  })
})
app.post("/register", function (req, res) {
  var username = req.body.username
  var password = req.body.password
  var fullname = req.body.fullname
  
  var newUser = new restuarants({
    name: fullname,
    email: username,
    password: password,
    tables: 5,
  
  })
  restuarants.findOne({
    email: username
  }, function (err, foundUser) {
    if (foundUser) {
      var msg = "!Already user present"
      res.render("register.ejs", {
        msg: msg
      })
    } else {
      newUser.save().then(function () {
        restuarants.find({}, function (err, result) {
          if (err) throw err;
          else {
            res.render("index.ejs", {
              restuarantsName: result
            })
          }
        }).then(function () {
          res.render("index.ejs", {
            restuarantsName: result
          })
        })
      })



    }
  })

})


// Route to send current data (as JSON) on reserved and waitlisted parties.


app.post("/reserve", function (req, res) {
  var newtable = req.body
  var name = newtable.name
  var phonenumber = newtable.phonenumber
  var email = newtable.email
  var restuarantName = newtable.restuarant
   date     = newtable.date
  console.log(newtable)
  var newCustomer = new users({
    name: name,
    email: email,
    phonenumber: phonenumber,
    restuarantName: restuarantName,
    date: date
  })
  var msg
  newCustomer.save()
  if (tables.length > 5) {
    msg = "your table is in waiting list"
    waitlist.push(newtable);
  } else {
    client.messages
      .create({
        body: 'Hello, '+name+' Your Table at ' + restuarantName + ' on '+date+ " is successfully booked.",
        from: '(984) 207-1274',
        to:phonenumber
      })
      .then(message => console.log(message.sid));
    msg = " your table is successfully booked"
    tables.push(newtable);
  }

  app.use(express.static(path.join(__dirname, '/public')));
  res.render("reserve1.ejs", {
    msg: msg,
    restuarant: restuarantName
  })


})



// Creates new table reservations.


app.get("/tables", function (req, res) {
  // res.sendFile(path.join(__dirname, "tables.html"));
 // console.log(rest)
  tables.length = 0
  waitlist.length = 0
  users.find({
    restuarantName: rest,date:date
  }, function (err, result) {
    if (result.length > 5) {
      for (var i = 0; i < 5; i++) {
        tables.push(result[i])
        console.log(tables)
      }

      for (var j = i; j < result.length; j++) {
        waitlist.push(result[j])
      }

    } else {
      for (var i = 0; i < result.length; i++) {
        tables.push(result[i])
        console.log(tables)
      }
    }
  })
  res.render("tables1.ejs", {
    rest: rest
  })
})
app.get("/tabledata", function (req, res) {
  res.send(
    JSON.stringify({
      tables: tables,
      waitlist: waitlist
    })
  )
  res.end();
})
app.post("/api/new", function (req, res) {
  var newtable = req.body;
  //console.log(newtable);
  //console.log(newtable.name);
  newtable.routeName = newtable.name.replace(/\s+/g, "").toLowerCase();

 // console.log(newtable);

  // if (tables.length>4) {
  //   waitlist.push(newtable);
  // }
  // else {
  //   tables.push(newtable);
  // }

  res.json(newtable);
});

// Starts the server to begin listening.
// =============================================================
app.listen(PORT, function () {
  console.log("App listening on PORT " + PORT);
});