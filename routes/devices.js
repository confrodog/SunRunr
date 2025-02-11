let express = require('express');
let router = express.Router();
let Device = require("../models/device");
let User = require('../models/users');
let fs = require('fs');
let jwt = require("jwt-simple");

/* Authenticate user */
var secret = fs.readFileSync(__dirname + '/../../jwtkey.txt').toString();

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
    let newApikey = "";
    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 32; i++) {
        newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    return newApikey;
}

// GET request return one or "all" devices registered and last time of contact.
router.get('/status/:devid', function(req, res, next) {
    let deviceId = req.params.devid;
    let responseJson = { devices: [] };

    if (deviceId == "all") {
        let query = {};
    } else {
        let query = {
            "deviceId": deviceId
        };
    }

    Device.find(query, function(err, allDevices) {
        if (err) {
            let errorMsg = { "message": err };
            res.status(400).json(errorMsg);
        } else {
            for (let doc of allDevices) {
                responseJson.devices.push({ "deviceId": doc.deviceId, "lastContact": doc.lastContact });
            }
        }
        res.status(200).json(responseJson);
    });
});

router.post('/register', function(req, res, next) {
    let responseJson = {
        registered: false,
        message: "",
        apikey: "none",
        deviceId: "none"
    };
    let deviceExists = false;

    // Ensure the request includes the deviceId parameter
    if (!req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Missing deviceId.";
        return res.status(400).json(responseJson);
    }

    let email = "";

    // If authToken provided, use email in authToken 
    if (req.headers["x-auth"]) {
        try {
            let decodedToken = jwt.decode(req.headers["x-auth"], secret);
            email = decodedToken.email;
        } catch (ex) {
            responseJson.message = "Invalid authorization token.";
            return res.status(400).json(responseJson);
        }
    } else {
        // Ensure the request includes the email parameter
        if (!req.body.hasOwnProperty("email")) {
            responseJson.message = "Invalid authorization token or missing email address.";
            return res.status(400).json(responseJson);
        }
        email = req.body.email;
    }

    // See if device is already registered
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device !== null) {
            responseJson.message = "Device ID " + req.body.deviceId + " already registered.";
            return res.status(400).json(responseJson);
        } else {
            // Get a new apikey
            deviceApikey = getNewApikey();

            // Create a new device with specified id, user email, and randomly generated apikey.
            let newDevice = new Device({
                deviceId: req.body.deviceId,
                userEmail: email,
                apikey: deviceApikey
            });

            // Save device. If successful, return success. If not, return error message.
            newDevice.save(function(err, newDevice) {
                console.log("new device: " + newDevice);
                if (err) {
                    responseJson.message = err;
                    // This following is equivalent to: res.status(400).send(JSON.stringify(responseJson));
                    return res.status(400).json(responseJson);
                } else {
                    User.findOneAndUpdate({ email: email }, { $push: { userDevices: req.body.deviceId } }, (err, user) => {
                        //console.log("user: "+ user);
                        if (err) {
                            responseJson.message = err;
                            // This following is equivalent to: res.status(400).send(JSON.stringify(responseJson));
                            return res.status(400).json(responseJson);
                        } else {
                            responseJson.registered = true;
                            responseJson.apikey = deviceApikey;
                            responseJson.deviceId = req.body.deviceId;
                            responseJson.message = "Device ID " + req.body.deviceId + " was registered and added to " + user.email + " list.";
                            return res.status(201).json(responseJson);

                        }

                    });

                }
            });
        }
    });
});

router.post('/ping', function(req, res, next) {
    let responseJson = {
        success: false,
        message: "",
    };
    let deviceExists = false;

    // Ensure the request includes the deviceId parameter
    if (!req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Missing deviceId.";
        return res.status(400).json(responseJson);
    }

    // If authToken provided, use email in authToken 
    try {
        let decodedToken = jwt.decode(req.headers["x-auth"], secret);
    } catch (ex) {
        responseJson.message = "Invalid authorization token.";
        return res.status(400).json(responseJson);
    }

    request({
        method: "POST",
        uri: "https://api.particle.io/v1/devices/" + req.body.deviceId + "/pingDevice",
        form: {
            access_token: particleAccessToken,
            args: "" + (Math.floor(Math.random() * 11) + 1)
        }
    });

    responseJson.success = true;
    responseJson.message = "Device ID " + req.body.deviceId + " pinged.";
    return res.status(200).json(responseJson);
});

router.delete('/remove/:deviceId', (req, res) => {
    //console.log("deleting device...");
    //console.log(req.params);
    try {
        let decodedToken = jwt.decode(req.headers["x-auth"], secret);
    } catch (ex) {
        console.log("bad authorization");
        responseJson.message = "Invalid authorization token.";
        return res.status(400).json(responseJson);
    }
    Device.findOneAndRemove({ deviceId: req.params.deviceId }, (err, device) => {
        //console.log("DEvice email: "+device.userEmail);
        //console.log("removed device "+req.params.deviceId);
        User.findOneAndUpdate({ email: device.userEmail }, { $pull: { userDevices: req.params.deviceId } }, (err, user) => {
            //console.log("User: "+JSON.stringify(user));
            //console.log("removed device from user "+user.email);
            res.status(202).json({ "message": "good", "deviceId": req.params.deviceId });
        });
    });
});

module.exports = router;