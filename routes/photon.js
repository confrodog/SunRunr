var express = require('express');
var router = express.Router();
var User = require("../models/users");
var Device = require("../models/device");
var Activity = require("../models/activity");

function calculateActivity(activity){
    console.log("activity: "+activity);
    let speed = 0.0;
    for(a of activity){
        speed += parseFloat(a.speed);
    }
    console.log("total speed: "+speed);
    speed /= activity.length;
    if(speed <= 2){
        return "walk";
    }
    else if(speed > 2 && speed <=4){
        return "run";
    }
    else if(speed > 4){
        return "biking";
    }
    else{
        return ""+speed;
    }
}

/* POST: Register new device. */
router.post('/pulse', function(req, res, next) {
    var responseJson = {
        status: "",
        message: ""
    };

    if (!req.body.hasOwnProperty("activity")) {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing activities parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    req.body.activity.pop();
    console.log(req.body);
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

    // Find the device and verify the apikey
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device !== null) {
            if (device.apikey != req.body.apikey) {
                responseJson.status = "ERROR";
                responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
                return res.status(201).send(JSON.stringify(responseJson));
            } else {
                // Create a new hw data with user email time stamp 
                
                actType = calculateActivity(req.body.activity);
                console.log("actType: "+actType);
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
                        responseJson.status = "OK";
                        responseJson.message = "Data saved in db with object ID " + run._id + ".";
                        return res.status(201).send(JSON.stringify(responseJson));
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

router.get('/threshold', (req,res)=>{
    console.log("deviceId of requesting thresh: "+req.query.coreid);
    User.findOne({ userDevices: req.query.coreid }, (err, user)=>{
        if(user !== null){
            return res.status(200).send(JSON.stringify(user.uvThreshold));
        }
    })
});

module.exports = router;