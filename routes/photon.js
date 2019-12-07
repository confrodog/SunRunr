var express = require('express');
var router = express.Router();
var User = require("../models/users");
var Device = require("../models/device");
var Activity = require("../models/activity");

//////////////////////////////////////////////////////////////////////////////////////////////////
//input: activity
//output: speed and activity type
function calculateActivity(activity) {
    let speed = 0.0;
    let actType = "";
    for (a of activity) {
        speed += parseFloat(a.speed);
    }
    console.log("total speed: " + speed);
    speed /= activity.length;
    console.log("average speed: " + speed);
    if (speed <= 4) {
        actType = "walking";
    } else if (speed > 4 && speed <= 8) {
        actType =  "running";
    } else if (speed > 8) {
        actType =  "biking";
    } else {
        actType =  ""
    }
    return [speed,actType];
}

//input: activity
//output: UV index for the activity

function calculateUVIndex(activity){
    let avgUV = 0.0;
    for(a of activity){
        avgUV += a.uv;
    }
    avgUV /= activity.length;
    return avgUV;
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
    // Ensure the POST data include properties id and api key
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
        //authenticate API key
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    //create new activity
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
                            //return uvThreshold and activity Id to photon
                            User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                //console.log(user);
                                responseJson.uvThreshold = user.uvThreshold;
                                responseJson.activityId = activity._id;
                                responseJson.status = "OK";
                                responseJson.message = "Activity " + activity._id +" has began.";
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
        //authenticate API key
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    // Find activity by _id and add more locations to activity array                        
                    Activity.findOneAndUpdate({ _id: req.body.activityId }, { $push: { activity: req.body.activity } }, function(err, activity) {
                        if (err) {
                            responseJson.status = "ERROR";
                            responseJson.message = "Error saving data in db.";
                            return res.status(201).send(JSON.stringify(responseJson));
                        } else {
                            //return uvThreshold and activity Id to photon
                            User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                //console.log(user);
                                responseJson.uvThreshold = user.uvThreshold;
                                responseJson.activityId = activity._id;
                                responseJson.status = "OK";
                                responseJson.message = "Activity "+ activity._id +" is in progress.";
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
        //authenticate API key
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    // find activity with given _id, add final activity locations and add began, ended values                          
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
                                //calculate avgUV and avgSpeed and add those fields
                                let totalAct = activity.activity.concat(req.body.activity);
                                let avgUV = calculateUVIndex(totalAct);
                                let avgSpeed = calculateActivity(totalAct);
                                activity.update({ $set: {activityType:avgSpeed[1],averageSpeed:avgSpeed[0],uvIndex:avgUV}},()=>{
                                    //return uvThreshold and activity Id to photon
                                    User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                        responseJson.uvThreshold = user.uvThreshold;
                                        responseJson.activityId = activity._id;
                                        responseJson.status = "OK";
                                        responseJson.message = "Activity "+ activity._id +" has ended.";
                                        return res.status(201).send(JSON.stringify(responseJson));
                                    });
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
    else{
        //route if activity <= 5 locations i.e. 75 seconds
        console.log("posting if all else case...")
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
                                responseJson.message = "Single data saved in db with object ID " + run._id + ".";
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
});

//not needed
router.get('/threshold', (req, res) => {
    console.log("deviceId of requesting thresh: " + req.query.coreid);
    User.findOne({ userDevices: req.query.coreid }, (err, user) => {
        if (user !== null) {
            return res.status(200).send(JSON.stringify(user.uvThreshold));
        }
    })
});

module.exports = router;