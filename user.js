// Template with a structure of the user Schema.
//Require mongoose

const mongoose = require("mongoose");

const User = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{ descrition: String, duration: Number, date: Date }],
});


const ModelClass = mongoose.model("User", User);

module.exports = ModelClass;
