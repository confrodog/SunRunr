let express = require('express');
let router = express.Router();
let User = require("../models/users");
let Device = require("../models/device");
let Activity = require("../models/activity");
let fs = require('fs');
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let https = require('https');

/* Authenticate user */
var secret = fs.readFileSync(__dirname + '/../../jwtkey.txt').toString();

router.post('/signin', function(req, res, next) {
    User.findOne({ email: req.body.email }, function(err, user) {
        if (err) {
            res.status(401).json({ success: false, message: "Can't connect to DB." });
        } else if (!user) {
            res.status(401).json({ success: false, message: "Email or password invalid." });
        } else {
            bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
                if (err) {
                    res.status(401).json({ success: false, message: "Error authenticating. Contact support." });
                } else if (valid) {
                    var authToken = jwt.encode({ email: req.body.email }, secret);
                    res.status(201).json({ success: true, authToken: authToken });
                } else {
                    res.status(401).json({ success: false, message: "Email or password invalid." });
                }

            });
        }
    });
});

// Update the name/password/UVindex for a user 
router.put('/update', function(req, res, next) {
    let password = req.body.password;
    let email = req.body.email;
    let fullName = req.body.fullName;
    let uvThreshold = req.body.uvThreshold;
    let location = req.body.location;
    let lat = 0;
    let lon = 0;

    console.log(req.body);

    let responseJson = {
        "nameChanged": false,
        "passwordChanged": false,
        "uvChanged": false,
        "locationChanged": false,
        "success": false,
        "message": ''
    }
    
    let promiseArray = [];

    const updatePassword = bcrypt.hash(password, 10, function(err, hash) {
        if (err) {
            responseJson = {success: false, message: err.errmsg};
        } else {
            User.findOneAndUpdate({ email: email }, { passwordHash: hash });
        }
    });

    const getLocation = new Promise(function(resolve, reject) {
        let url = 'https://us1.locationiq.com/v1/search.php?key=eb122602cf386b&q='+encodeURI(location)+'&format=json';
        console.log("Trying to get an API response");

        https.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                let json = JSON.parse(data);
                lat = json[0]["lat"];
                lon = json[0]["lon"];
                location = json[0]["display_name"];

                User.findOneAndUpdate({ email: email }, {location: location, latitude: lat, longitude: lon})
                    .then(result => resolve("Updated the database"))
                    .catch(err => reject(err))
            });
        }).on("error", (err) => {
            responseJson = {success: false, message: err.message}
            reject(Error("It broke"));
        }); 
      });

    const updateName = User.findOneAndUpdate({ email: email} ,{ fullName: fullName});

    const updateUVThreshold = User.findOneAndUpdate({email: email},{uvThreshold: uvThreshold});

    // If no password or full name given, update nothing
    if (!password && !fullName && !uvThreshold && !location) {
        res.status(201).json({ success: true, message: "Nothing has been updated!"});
        return;
    }
    // If no full name given, update the password
    if (password) {
        console.log("changing password");
        responseJson.passwordChanged = true;
        responseJson.success = true;
        responseJson.message = "password has been updated";
        promiseArray.push(updatePassword);
    }
    // If no password given, update the name
    if (fullName) {
        console.log("changing name");
        responseJson.nameChanged = true;
        responseJson.success = true;
        responseJson.message = "name has been updated";
        promiseArray.push(updateName);
    }
    if(uvThreshold){
        console.log("changing uv");
        responseJson.uvChanged = true;
        responseJson.success = true;
        responseJson.message ="uvThreshold has been updated";
        promiseArray.push(updateUVThreshold);
    }
    if(location){
        console.log("changing location");
        responseJson.locationChanged = true;
        responseJson.success = true;
        responseJson.message = "location has been updated";
        promiseArray.push(getLocation);
    }
    console.log("Promise Array:");
    console.log(promiseArray.length);
    Promise
    .all(promiseArray).then((values)=>{
        return res.status(201).send(responseJson);
    })
    .catch((reason)=>{
        return res.status(400).send({ reason: 'unknown' });
    });
});

/* Register a new user */
router.post('/register', function(req, res, next) {

    bcrypt.hash(req.body.password, 10, function(err, hash) {
        if (err) {
            res.status(400).json({ success: false, message: err.errmsg });
        } else {
            var newUser = new User({
                email: req.body.email,
                fullName: req.body.fullName,
                passwordHash: hash
            });

            newUser.save(function(err, user) {
                if (err) {
                    res.status(400).json({ success: false, message: err.errmsg });
                } else {
                    res.status(201).json({ success: true, message: user.fullName + "has been created" });
                }
            });
        }
    });
});

router.get("/account", function(req, res) {
    // Check for authentication token in x-auth header
    if (!req.headers["x-auth"]) {
        return res.status(401).json({ success: false, message: "No authentication token" });
    }

    var authToken = req.headers["x-auth"];

    try {
        var decodedToken = jwt.decode(authToken, secret);
        var userStatus = {};

        User.findOne({ email: decodedToken.email }, function(err, user) {
            if (err) {
                return res.status(400).json({ success: false, message: "User does not exist." });
            } else {
                userStatus['success'] = true;
                userStatus['email'] = user.email;
                userStatus['fullName'] = user.fullName;
                userStatus['lastAccess'] = user.lastAccess;
                userStatus['uvThreshold'] = user.uvThreshold;
                userStatus['latitude'] = user.latitude;
                userStatus['longitude'] = user.longitude;
                userStatus['location'] = user.location;

                // Find devices based on decoded token
                Device.find({ userEmail: decodedToken.email }, function(err, devices) {
                    if (!err) {
                        // Construct device list
                        let deviceList = [];
                        for (device of devices) {
                            deviceList.push({
                                deviceId: device.deviceId,
                                apikey: device.apikey,
                            });
                        }
                        userStatus['devices'] = deviceList;
                    }

                    return res.status(200).json(userStatus);
                });
            }
        });
    } catch (ex) {
        return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }
});

router.get('/activities', (req, res) => {
    if (!req.headers["x-auth"]) {
        return res.status(401).json({ success: false, message: "No authentication token" });
    }
    if (!req.query.deviceId) {
        return res.status(401).json({ success: false, message: "No device ID specified." });
    }

    var authToken = req.headers["x-auth"];

    try {
        var decodedToken = jwt.decode(authToken, secret);

        Activity.find({ deviceId: req.query.deviceId }, function(err, activities) {
            if (err) {
                return res.status(400).json({ success: false, message: "there is an issue with activity storing." });
            } else {
                return res.status(200).json({ 'activities': activities })
            }
        });
    } catch (ex) {
        return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }
})

module.exports = router;