var db = require("../db");
var autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(db);

// Define the schema
var activitySchema = new db.Schema({
    deviceId: String,
    activity: [{
        lon: Number,
        lat: Number,
        uv: Number,
        speed: Number
    }],
    began: Number,
    ended: Number,
    activityType: String,
    averageSpeed: Number,
    uvIndex: Number,
    submitTime: { type: Date, default: Date.now }
});

activitySchema.plugin(autoIncrement.plugin, "Activity");
// Creates a Devices (plural) collection in the db using the device schema
var Activity = db.model("Activity", activitySchema);

module.exports = Activity;