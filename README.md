
# SunRunr
Cool app that will track your runs and temperature

URL: ec2-52-37-217-169.us-west-2.compute.amazonaws.com:3000

## Read Me Requirements
 - [x] website: ec2-52-37-217-169.us-west-2.compute.amazonaws.com:3000
 - [ ] Login Credentials to a user with recently collected data
 - [ ] Link to 5 minute pitch video
 - [ ] Link to 20 minute demonstration video
## Account Creation and Management
 - [x] A user must be able to **create** an account, using an **email address** as the username and a **strong password**, and register **at least one** device with their account.
 - [x] A user should be able to **update** any of their account information.
 - [x] A user should be able to **replace** a device with a new one in their account.
 - [x] A user should be able to have **more than one** device.
## IoT Device
 - [x] User should use a button on the IoT device to **start** and **stop** activities.
 - [X] IoT shall use **onboard** LEDs to indicate activity status.
 - [X] During an activity, the IoT device should periodically record the GPS location, speed, and UV exposure, at least at a rate of **once every 15 seconds.**
 - [x] If the UV exposure during an activity **exceeds** a user-defined
       threshold (the threshold will be set in the web application), an
       **alert should be provided** on the IoT device.
 - [x] After an activity is complete, the IoT device should **transmit the
       activity data to the server**.
 - [x] If the WiFi connection is **not available**, the IoT device should
       **locally store the data** for up to **24 hours** and submit the data
       when later connected.
 - [ ] (CONNOR) The IoT device should have an auto-pause feature: During an
       activity if the **user’s speed** is **0** for **more than 30 seconds**, the
       device should **pause the activity data recording** until the user
       starts moving again.
 - [x] The server should **require an APIKEY** from the IoT device for
       posting activity data.
## Web Application
 - [x] (MIRANDA) A summary view showing the user’s **total activity duration**, total 
       **calories burned**, and total **UV exposure** in the past **7 days**.
 - [x] (MIRANDA) An activities summary view that lists **all fitness activities** with
       data **summarizing each activity**, including the **date of activity**,  
       **duration of activity**, **calories burned**, **UV exposure**, **temperature**,
       and **humidity**.
 - [x] (MIRANDA) An activity detail view for a selected activity that will display
       the **activity date**, **duration**, **UV exposure**, **temperature**,   
       **humidity**, **activity type**, **calories burned**, and uses **line charts**
       to    display the  **speed** and **UV exposure** throughout the
       activity.
 - [x] (MIRANDA) In the activity detail view, the web application should allow a
       user to **change the activity type**. Activity types should minimally
       support **walking**, **running**, and **biking**.
 - [x] (MIRANDA) The calculation of calories burned should be based on the
       activity type for each activity.
       344 - walking
       672 - runnning
       600 - biking

 - [X] (MEL) The web application should allow the user to **define a UV
       threshold** that defines the total UV exposure beyond which the IoT
       device should alert the user during an activity. The alert can be
       a simple as illuminating an LED. This setting should be made
       in the account profile page.
 - [X] (MIRANDA/MEL) The web application should include a weather forecast including
       UV index for at least the **next five days**. Your server should
       use a third-party API to acquire this information.
 - [x] The web application should have a **navigation menu**.
 - [ ] The web application should use **responsive design to be viewable
       on desktops, tablets, and smartphones.**
## Server
 - [x] When an activity is sent to the server by the IoT device, the
       server should assign a default activity type based on the speed
       data.
 - [x] When an activity is sent to the server by the IoT device, the
       server should use a third-party weather service to determine the
       temperature and humidity at the activity's location, which should
       be stored in the database for the activity.
 - [x] Your server must be implemented using Node.js, Express, and
       MongoDB.
 - [ ] Your server’s endpoints must use RESTful APIs. Each endpoint must
           have accompanying documentation that describes the behavior, the
           expected parameters, and responses.
 - [x] Access to the web application should be controlled using token
       based authentication.
## EXTRAS
 - [X] add user location through account settings and use that information to show weather
