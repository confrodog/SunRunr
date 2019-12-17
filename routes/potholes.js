let express = require('express');
let router = express.Router();
let fs = require('fs');
let jwt = require("jwt-simple");
let Device = require("../models/device");
//let Pothole = require("../models/pothole");
let User = require("../models/users");

// Secret key for JWT
let secret = fs.readFileSync(__dirname + '/../../jwtkey.txt').toString();
let authenticateRecentEndpoint = true;

function authenticateAuthToken(req) {
    // Check for authentication token in x-auth header
    if (!req.headers["x-auth"]) {
        return null;
    }

    let authToken = req.headers["x-auth"];

    try {
        let decodedToken = jwt.decode(authToken, secret);
        return decodedToken;
    } catch (ex) {
        return null;
    }
}

// POST: Adds reported pothole to the database and returns total hit count for the pothole
// Authentication: APIKEY. The device reporting must have a valid APIKEY
router.post("/hit", function(req, res) {
    let responseJson = {
        success: false,
        message: "",
        totalHits: 1
    };

    // Ensure the POST data include required properties                                               
    if (!req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Request missing deviceId parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    if (!req.body.hasOwnProperty("apikey")) {
        responseJson.message = "Request missing apikey parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    if (!req.body.hasOwnProperty("longitude")) {
        responseJson.message = "Request missing longitude parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    if (!req.body.hasOwnProperty("latitude")) {
        responseJson.message = "Request missing latitude parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    if (!req.body.hasOwnProperty("time")) {
        responseJson.message = "Request missing time parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    // Find the device and verify the apikey                                           
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device === null) {
            responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        if (device.apikey != req.body.apikey) {
            responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        // Check to see if a pothole was already recoreded within 10 meters (or thereabouts, this needs to be verified)
        let findPotholeQuery = Pothole.findOne({
            loc: {
                $near: {
                    $geometry: { type: "Point", coordinates: [req.body.longitude, req.body.latitude] },
                    $maxDistance: 10.0
                }
            }
        });

        // Execute the query     
        findPotholeQuery.exec(function(err, pothole) {
            if (err) {
                console.log(err);
                responseJson.message = "Error accessing db.";
                return res.status(201).send(JSON.stringify(responseJson));
            }

            // Pothole was found, update the hit count and last reported time
            if (pothole) {
                pothole.totalHits++;
                pothole.lastReported = Date.now();
                responseJson.message = "Pothole hit recorded.";
                responseJson.totalHits = pothole.totalHits;
            }
            // New pothole found
            else {
                // Create a new pothole and save the pothole to the database
                var pothole = new Pothole({
                    loc: [req.body.longitude, req.body.latitude],
                    totalHits: 1,
                    lastReported: Date.now(),
                    firstReported: Date.now(),
                });
                responseJson.message = "New pothole recorded.";
            }

            // Save the pothole data. 
            pothole.save(function(err, newPothole) {
                if (err) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Error saving data in db." + err;
                    return res.status(201).send(JSON.stringify(responseJson));
                }

                responseJson.success = true;
                return res.status(201).send(JSON.stringify(responseJson));
            });
        });
    });
});

// GET: Returns all potholes first reported in the previous specified number of days
// Authentication: Token. A user must be signed in to access this endpoint
router.get("/recent/:days", function(req, res) {
    let days = req.params.days;

    let responseJson = {
        success: true,
        message: "",
        potholes: [],
    };

    if (authenticateRecentEndpoint) {
        decodedToken = authenticateAuthToken(req);
        if (!decodedToken) {
            responseJson.success = false;
            responseJson.message = "Authentication failed";
            return res.status(401).json(responseJson);
        }
    }


    // Check to ensure the days is between 1 and 30 (inclsuive), return error if not
    if (days < 1 || days > 30) {
        responseJson.success = false;
        responseJson.message = "Invalid days parameter.";
        return res.status(200).json(responseJson);
    }

    // Find all potholes reported in the spcified number of days
    let recentPotholesQuery = Pothole.find({
        "firstReported": {
            $gte: new Date((new Date().getTime() - (days * 24 * 60 * 60 * 1000)))
        }
    }).sort({ "date": -1 });


    recentPotholesQuery.exec({}, function(err, recentPotholes) {
        if (err) {
            responseJson.success = false;
            responseJson.message = "Error accessing db.";
            return res.status(200).send(JSON.stringify(responseJson));
        } else {
            let numRecentPotholes = 0;
            let numTotalHits = 0;
            for (let pothole of recentPotholes) {
                // Add pothole data to the respone's potholes array
                numRecentPotholes++;
                numTotalHits += pothole.totalHits;
                responseJson.potholes.push({
                    latitude: pothole.loc[1],
                    longitude: pothole.loc[0],
                    date: pothole.firstReported,
                    totalHits: pothole.totalHits
                });
            }
            responseJson.message = "In the past " + days + " days, " + numRecentPotholes + " potholes have been hit " + numTotalHits + " times.";
            return res.status(200).send(JSON.stringify(responseJson));
        }
    })
});


module.exports = router;