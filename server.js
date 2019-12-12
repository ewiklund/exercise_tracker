const express = require("express")
const app = express()
const bodyParser = require("body-parser")

const cors = require("cors")
const mongoose = require("mongoose")
mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track", {useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static("public"))
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html")
});

// Importing the Schema
const User = require(__dirname + "/models/user.js");

app.post("/api/exercise/new-user", function(req, res, next) {
  const username = req.body.username;
  if(username) {
    const newUser = {username: username, count: 0, log: []};
    User.findOne({username: newUser.username}, (error, data) => {
      if (error) return next(error);
      if (data) {
        res.send("The username already exists in the db.");
      } else {
        User.create(newUser, (error, user) => {
          if (error) return next(error);
          res.json({username: user.username, id: user._id});
        });
      }
});
} else {
  res.send("Please provide a username!");
}
});

app.post("/api/exercise/add", function(req, res, next) {
// At this point, we should verify the entered data
const userId = req.body.userId;
const description = req.body.description;
const duration = req.body.duration;
const requiredFields  = userId && description && duration;
if(requiredFields) {
  User.findById(userId, (error, user) => {
    if(error) return next(error);
    if(user) {
      const date = (req.body.date) ? new Date(req.body.date) : new Date();
      user.count = user.count + 1;
      const newExercise = {description: description, duration: duration, date: date};
      user.log.push(newExercise);
      user.save((error, user) => {
        if(error) return next(error);
        const showData = {
          username: user.username,
          _id: user._id,
          description: description,
          duration: duration,
          date: date.toDateString()
        };
        res.json(showData);
      });
    } else {
      next();
    }
});
} else {
  const message = "Please complete all required fields.";
  res.send(message);
}
});

app.get("/api/exercise/log", function(req, req, next) {
  // Verify the provided data

  const userId = req.query.userId;
  if(userId) {
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;

    const limitations = {};
    if(limit) limitations.limit = limit;
    User.findById(userId)
      .populate({path: "log", match: {}, select: "-_id", options: limitations})
      .exec((error, user) => {
        console.error("Testing invalid userId")
        console.error("error: " + error);
        console.error("user: " + user);

        if(error) return next(error);
        if(user) {
          const showData = {id: user._id, username: user.username, count: user.count};
          if(from) showData.from = from.toDateString();
          if(to) showData.to = to.toDateString();
          showData.log = user.log.filter((ej) => {
            if(from && to) {
              return ej.date >= from && ej.date <= to;
            } else if (from) {
              return ej.date >= from;
            } else if (to) {
              return ej.date <= to;
            } else {
              return true;
            }
          });
          res.json(showData);
        } else {
          next();
        }
      });
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: "not found"})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || "Internal Server Error"
  }
  res.status(errCode).type("txt")
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port)
})
