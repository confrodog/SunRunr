var express = require('express');
var request = require('request');
var fs = require('fs');
var router = express.Router();
var User = require("../models/users");
var Device = require("../models/device");
var Activity = require("../models/activity");

var apikey = fs.readFileSync(__dirname+'/../../weatherAPI.txt');

// helpers
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
        actType = "walk";
    } else if (speed > 4 && speed <= 8) {
        actType =  "run";
    } else if (speed > 8) {
        actType =  "bike";
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
    if (req.body.continue && !req.body.activityId) {
        console.log("transmission of an activity has began...");
        //authenticate API key
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } else {
                    // call openweatherapi to get temperature and humidity
                    let url = `http://api.openweathermap.org/data/2.5/weather?`+
                            `lat=${req.body.activity[0].lat}&lon=${req.body.activity[0].lon}&appid=${apikey}`;
                    request(url,(err, response, body)=>{
                        if(err)console.log(err);
                        else{
                            let weather = JSON.parse(body);
                            //create new activity with temp and humidity
                            var activity = new Activity({
                                deviceId: req.body.deviceId,
                                activity: req.body.activity,
                                temp: weather.main.temp,
                                humidity: weather.main.humidity
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
                                    });
                                }
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
    //continuing transmission
    else if (req.body.continue && req.body.activityId) {
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
                    Activity.findOne({ _id: req.body.activityId },(err, activity)=>{
                        if (err) {
                            responseJson.status = "ERROR";
                            responseJson.message = "Error saving data in db.1";
                            return res.status(201).send(JSON.stringify(responseJson));
                        }else{
                            //concatenate activity
                            activity.activity.concat(req.body.activity);
                            activity.save((err,activity)=>{
                                if(err){
                                    responseJson.status = "ERROR";
                                    responseJson.message = "Error saving data in db.2";
                                    return res.status(201).send(JSON.stringify(responseJson));
                                }else{
                                    User.findOne({userDevices: req.body.deviceId}, (err,user)=>{
                                        responseJson.uvThreshold = user.uvThreshold;
                                        responseJson.activityId = activity._id;
                                        responseJson.status = "OK";
                                        responseJson.message = "Activity "+ activity._id +" is in progress.";
                                        return res.status(201).send(JSON.stringify(responseJson));
                                    });
                                }
                            });
                        }
                    });
                    // Activity.findOneAndUpdate({ _id: req.body.activityId }, { $concatArrays: [ activity, req.body.activity ] }, function(err, activity) {
                    //     if (err) {
                    //         responseJson.status = "ERROR";
                    //         responseJson.message = "Error saving data in db.";
                    //         return res.status(201).send(JSON.stringify(responseJson));
                    //     } else {
                    //         //return uvThreshold and activity Id to photon
                    //         User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                    //             //console.log(user);
                    //             responseJson.uvThreshold = user.uvThreshold;
                    //             responseJson.activityId = activity._id;
                    //             responseJson.status = "OK";
                    //             responseJson.message = "Activity "+ activity._id +" is in progress.";
                    //             return res.status(201).send(JSON.stringify(responseJson));
                    //         })

                    //     }
                    // });
                }
            } else {
                responseJson.status = "ERROR";
                responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
                return res.status(201).send(JSON.stringify(responseJson));
            }
        });
    }
    //ending transmission
    else if (!req.body.continue && req.body.activityId) {
        console.log("transmission of an activity has ended...");
        //authenticate API key
        Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
            if (device !== null) {
                if (device.apikey != req.body.apikey) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                    return res.status(201).send(JSON.stringify(responseJson));
                } 
                else {
                    // find activity with given _id, add final activity locations and add began, ended values                          
                    Activity.findOne({ _id: req.body.activityId }, (err,activity)=>{
                        if (err) {
                            responseJson.status = "ERROR";
                            responseJson.message = "Error saving data in db.";
                            return res.status(201).send(JSON.stringify(responseJson));
                        } else {
                            activity.activity.concat(req.body.activity);
                            let totalAct = activity.activity;
                            //let totalAct = activity.activity.concat(req.body.activity);
                            let avgUV = calculateUVIndex(totalAct);
                            let avgSpeed = calculateActivity(totalAct);
                            activity.activityType = avgSpeed[1];
                            activity.averageSpeed = avgSpeed[0];
                            activity.uvIndex = avgUV;
                            activity.save((err,activity)=>{
                                if(err){
                                    responseJson.status = "ERROR";
                                    responseJson.message = "Error saving data in db.3";
                                    return res.status(201).send(JSON.stringify(responseJson));
                                }
                                else{
                                    User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                        responseJson.uvThreshold = user.uvThreshold;
                                        responseJson.activityId = activity._id;
                                        responseJson.status = "OK";
                                        responseJson.message = "Activity "+ activity._id +" has ended.";
                                        return res.status(201).send(JSON.stringify(responseJson));
                                    });
                                }
                            })
                        }
                    });
                    // Activity.findOneAndUpdate({ _id: req.body.activityId }, {
                    //     $concatArrays: [ activity.activity, req.body.activity ] },{
                    //         $set: { began: req.body.began, ended: req.body.ended }
                    //     },
                    //     function(err, activity) {
                    //         if (err) {
                    //             responseJson.status = "ERROR";
                    //             responseJson.message = "Error saving data in db.";
                    //             return res.status(201).send(JSON.stringify(responseJson));
                    //         } else {
                    //             //calculate avgUV and avgSpeed and add those fields
                    //             let totalAct = activity.activity.concat(req.body.activity);
                    //             let avgUV = calculateUVIndex(totalAct);
                    //             let avgSpeed = calculateActivity(totalAct);
                    //             activity.update({ $set: {activityType:avgSpeed[1],averageSpeed:avgSpeed[0],uvIndex:avgUV}},()=>{
                    //                 //return uvThreshold and activity Id to photon
                    //                 User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                    //                     responseJson.uvThreshold = user.uvThreshold;
                    //                     responseJson.activityId = activity._id;
                    //                     responseJson.status = "OK";
                    //                     responseJson.message = "Activity "+ activity._id +" has ended.";
                    //                     return res.status(201).send(JSON.stringify(responseJson));
                    //                 });
                    //             })
                    //         }
                    // });
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
                    apikey = '1ac5b46230b1f3ae861be919195faa05';
                    let url = `http://api.openweathermap.org/data/2.5/weather?`+
                            `lat=${req.body.activity[0].lat}&lon=${req.body.activity[0].lon}&appid=${apikey}`;
                    request(url,(err, response, body)=>{
                        if(err)console.log(err);
                        else{
                            let weather = JSON.parse(body);
                            actType = calculateActivity(req.body.activity);
                            uvIndex = calculateUVIndex(req.body.activity);
                            var activity = new Activity({
                                deviceId: req.body.deviceId,
                                activity: req.body.activity,
                                began: req.body.began,
                                ended: req.body.ended,
                                activityType: actType[1],
                                averageSpeed: actType[0],
                                uvIndex: uvIndex,
                                temp: weather.main.temp,
                                humidity: weather.main.humidity
                            });
    
                            // Save device. If successful, return success. If not, return error message.                          
                            activity.save(function(err, activity) {
                                if (err) {
                                    responseJson.status = "ERROR";
                                    responseJson.message = "Error saving data in db.";
                                    return res.status(201).send(JSON.stringify(responseJson));
                                } else {
                                    User.findOne({ userDevices: req.body.deviceId }, (err, user) => {
                                        responseJson.uvThreshold = user.uvThreshold;
                                        responseJson.status = "OK";
                                        responseJson.message = "Single data saved in db with object ID " + activity._id + ".";
                                        return res.status(201).send(JSON.stringify(responseJson));
                                    });
                                }
                            });//end save activity
                        }
                    });//end request
                }
            } else {
                responseJson.status = "ERROR";
                responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
                return res.status(201).send(JSON.stringify(responseJson));
            }
        });
    }
});//end callback hell

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
