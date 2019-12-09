var db = require("../db");

var userSchema = new db.Schema({
  email:        { type: String, required: true, unique: true },
  fullName:     { type: String, required: true },
  passwordHash: String,
  lastAccess:   { type: Date, default: Date.now },
  userDevices:  [ String ],
  uvThreshold: { type: Number, default: 20 },
  longitude: {type: Number, default: -110.97 },
  latitude: {type: Number, default: 32.22 },
  location: {type: String, default: 'Tucson, Pima County, Arizona, USA'}
});

var User = db.model("User", userSchema);

module.exports = User;
