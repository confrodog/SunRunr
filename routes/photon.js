var express = require('express');
var router = express.Router();
var User = require("../models/users");
var Device = require("../models/device");
var Activity = require("../models/activity");

//gonna move this function to route where the activities are called for////////////////////////////

function calculateActivity(activity) {
    let speed = 0.0;
    for (a of activity) {
        speed += parseFloat(a.speed);
    }
    console.log("total speed: " + speed);
    speed /= activity.length;
    console.log("average speed: " + speed);
    if (speed <= 2) {
        return "walking";
    } else if (speed > 2 && speed <= 4) {
        return "running";
    } else if (speed > 4) {
        return "biking";
    } else {
        return "" + speed;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

/* POST: Register new device. */
router.post('/pulse', function(req, res, next) {
    var responseJson = {
        status: "",
        message: "",
        uvThreshold: "NA",
        activityId: ""
    };

    if (!req.body.hasOwnProperty("activity")) {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing activities parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    req.body.activity.pop();
    console.log("API key: " + req.body.apikey);
    console.log("Activity: ");
    console.log(req.body.activity);
    console.log("Activity size: " + req.body.activity.length);
    console.log("Activity size in bytes: " + JSON.stringify(req.body.activity).length);
    // // Ensure the POST data include properties id and email
    if (!req.body.hasOwnProperty("deviceId")) {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing deviceId parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    if (!req.body.hasOwnProperty("apikey")) {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing apikey parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    //beginning of the transmission
    if (req.body.hasOwnProperty("continue") && !req.body.hasOwnProperty("activityId")) {
        console.log("transmission of an activity has began...");
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    //actType = calculateActivity(req.body.activity);
                    //console.log("actType: " + actType);
                    var activity = new Activity({
                        deviceId: req.body.deviceId,
                        activity: req.body.activity
                    });

                    // Save device. If successful, return success. If not, return error message.                          
                    activity.save(function(err, activity) {
                        if (err) {
                            responseJson.status = "ERROR";
                            responseJson.message = "Error saving data in db.";
                            return res.status(201).send(JSON.stringify(responseJson));
                        } else {
                            User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                //console.log(user);
                                responseJson.uvThreshold = user.uvThreshold;
                                responseJson.activityId = activity._id;
                                responseJson.status = "OK";
                                responseJson.message = "Data saved in db with object ID " + activity._id + ".";
                                return res.status(201).send(JSON.stringify(responseJson));
                            })
                        }
                    });
                }
            } else {
                responseJson.status = "ERROR";
                responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
                return res.status(201).send(JSON.stringify(responseJson));
            }
        });
    }
    //continuing transmission
    else if (req.body.hasOwnProperty("continue") && req.body.hasOwnProperty("activityId")) {
        console.log("transmission of an activity is continuing...");
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    // Save device. If successful, return success. If not, return error message.                          
                    Activity.findOneAndUpdate({ _id: req.body.activityId }, { $push: { activity: req.body.activity } }, function(err, activity) {
                        if (err) {
                            responseJson.status = "ERROR";
                            responseJson.message = "Error saving data in db.";
                            return res.status(201).send(JSON.stringify(responseJson));
                        } else {
                            User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                //console.log(user);
                                responseJson.uvThreshold = user.uvThreshold;
                                responseJson.activityId = activity._id;
                                responseJson.status = "OK";
                                responseJson.message = "Data saved in db with object ID " + activity._id + ".";
                                return res.status(201).send(JSON.stringify(responseJson));
                            })

                        }
                    });
                }
            } else {
                responseJson.status = "ERROR";
                responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
                return res.status(201).send(JSON.stringify(responseJson));
            }
        });
    }
    //ending transmission
    else if (!req.body.hasOwnProperty("continue") && req.body.hasOwnProperty("activityId")) {
        console.log("transmission of an activity has ended...");
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    // Save device. If successful, return success. If not, return error message.                          
                    Activity.findOneAndUpdate({ _id: req.body.activityId }, {
                            $push: { activity: req.body.activity },
                            $set: { began: req.body.began, ended: req.body.ended }
                        },
                        function(err, activity) {
                            if (err) {
                                responseJson.status = "ERROR";
                                responseJson.message = "Error saving data in db.";
                                return res.status(201).send(JSON.stringify(responseJson));
                            } else {
                                User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                    //console.log(user);
                                    responseJson.uvThreshold = user.uvThreshold;
                                    responseJson.activityId = activity._id;
                                    responseJson.status = "OK";
                                    responseJson.message = "Data saved in db with object ID " + activity._id + ".";
                                    return res.status(201).send(JSON.stringify(responseJson));
                                });
                            }
                        });
                }
            } else {
                responseJson.status = "ERROR";
                responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
                return res.status(201).send(JSON.stringify(responseJson));
            }
        });
    }
    // Find the device and verify the apikey
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device !== null) {
            if (device.apikey != req.body.apikey) {
                responseJson.status = "ERROR";
                responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                return res.status(201).send(JSON.stringify(responseJson));
            } else {
                actType = calculateActivity(req.body.activity);
                console.log("actType: " + actType);
                var activity = new Activity({
                    deviceId: req.body.deviceId,
                    activity: req.body.activity,
                    began: req.body.began,
                    ended: req.body.ended,
                    activityType: actType
                });

                // Save device. If successful, return success. If not, return error message.                          
                activity.save(function(err, run) {
                    if (err) {
                        responseJson.status = "ERROR";
                        responseJson.message = "Error saving data in db.";
                        return res.status(201).send(JSON.stringify(responseJson));
                    } else {
                        User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                            //console.log(user);
                            responseJson.uvThreshold = user.uvThreshold;
                            responseJson.status = "OK";
                            responseJson.message = "Data saved in db with object ID " + run._id + ".";
                            return res.status(201).send(JSON.stringify(responseJson));
                        })

                    }
                });
            }
        } else {
            responseJson.status = "ERROR";
            responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
            return res.status(201).send(JSON.stringify(responseJson));
        }
    });
});

router.get('/threshold', (req, res) => {
    console.log("deviceId of requesting thresh: " + req.query.coreid);
    User.findOne({ userDevices: req.query.coreid }, (err, user) => {
        if (user !== null) {
            return res.status(200).send(JSON.stringify(user.uvThreshold));
        }
    })
});

module.exports = router;