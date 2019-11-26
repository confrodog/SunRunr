var express = require('express');
var router = express.Router();
var Device = require("../models/device");
var Activity = require("../models/activity");

/* POST: Register new device. */
router.post('/pulse', function(req, res, next) {
    var responseJson = {
        status: "",
        message: ""
    };

    if (!req.body.hasOwnProperty("activities")) {
        responseJson.status = "ERROR";
        responseJson.message = "Request missing activities parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    for (let a of JSON.parse(req.body.activities)) {
        console.log(a);
    }
    responseJson.status = "GOOD";
    responseJson.message = "activity recieved";
    return res.status(201).send(JSON.stringify(responseJson));
    // // Ensure the POST data include properties id and email
    // if (!req.body.hasOwnProperty("deviceId")) {
    //     responseJson.status = "ERROR";
    //     responseJson.message = "Request missing deviceId parameter.";
    //     return res.status(201).send(JSON.stringify(responseJson));
    // }

    // if (!req.body.hasOwnProperty("apikey")) {
    //     responseJson.status = "ERROR";
    //     responseJson.message = "Request missing apikey parameter.";
    //     return res.status(201).send(JSON.stringify(responseJson));
    // }

    // if (!req.body.hasOwnProperty("longitude")) {
    //     responseJson.status = "ERROR";
    //     responseJson.message = "Request missing longitude parameter.";
    //     return res.status(201).send(JSON.stringify(responseJson));
    // }

    // if (!req.body.hasOwnProperty("latitude")) {
    //     responseJson.status = "ERROR";
    //     responseJson.message = "Request missing latitude parameter.";
    //     return res.status(201).send(JSON.stringify(responseJson));
    // }

    // // Find the device and verify the apikey
    // Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
    //     if (device !== null) {
    //         if (device.apikey != req.body.apikey) {
    //             responseJson.status = "ERROR";
    //             responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
    //             return res.status(201).send(JSON.stringify(responseJson));
    //         } else {
    //             // Create a new hw data with user email time stamp 
    //             var activity = new Activity({
    //                 deviceId: req.body.deviceId,
    //                 lon: req.body.longitude,
    //                 lat: req.body.latitude,
    //                 uv: req.body.uv,
    //                 speed: req.body.GPS_speed
    //             });

    //             // Save device. If successful, return success. If not, return error message.                          
    //             activity.save(function(err, run) {
    //                 if (err) {
    //                     responseJson.status = "ERROR";
    //                     responseJson.message = "Error saving data in db.";
    //                     return res.status(201).send(JSON.stringify(responseJson));
    //                 } else {
    //                     responseJson.status = "OK";
    //                     responseJson.message = "Data saved in db with object ID " + run._id + ".";
    //                     return res.status(201).send(JSON.stringify(responseJson));
    //                 }
    //             });
    //         }
    //     } else {
    //         responseJson.status = "ERROR";
    //         responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
    //         return res.status(201).send(JSON.stringify(responseJson));
    //     }
    // });
});

module.exports = router;