
var userEmail = "";

function ShowAcct(){
  $('#accountInfo').show();
  $('#main').hide();
}

//------------------------------------------------------------------------------
function sendReqForAccountInfo() {
  $.ajax({
    url: '/users/account',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },
    dataType: 'json'
  })
    .done(accountInfoSuccess)
    .fail(accountInfoError);
}

function accountInfoSuccess(data, textSatus, jqXHR) {
  $("#email").html(data.email);
  $("#fullName").html(data.fullName);
  $("#lastAccess").html(data.lastAccess);
  
  // Add the devices to the list before the list item for the add device button (link)
  for (var device of data.devices) {
    $("#addDeviceForm").before("<li class='collection-item'>ID: " +
      device.deviceId + ", APIKEY: " + device.apikey + 
      /*" <button id='ping-" + device.deviceId + "' class='waves-effect waves-light btn'>Ping</button> " +
      " <button id='activity-" + device.deviceId + "' class='waves-effect waves-light btn'>Show Activity</button> " +*/
      " <button id='remove-" + device.deviceId + "' class='waves-effect waves-light btn'>Remove Device</button> " +
      " </li>");
    //$("#ping-"+device.deviceId).click({deviceId: device.deviceId},pingDevice);
    //$("#activity-"+device.deviceId).click({deviceId: device.deviceId},populateDeviceActivity);
    $("#remove-"+device.deviceId).click({deviceId: device.deviceId},removeDevice);
  }
}

function accountInfoError(jqXHR, textStatus, errorThrown) {
  // If authentication error, delete the authToken 
  // redirect user to sign-in page (which is index.html)
  if( jqXHR.status === 401 ) {
    window.localStorage.removeItem("authToken");
    window.location.replace("index.html");
  } 
  else {
    $("#error").html("Error: " + status.message);
    $("#error").show();
  } 
}

//------------------------------------------------------------------------------

// Registers the specified device with the server.
function registerDevice() {
  $.ajax({
    url: '/devices/register',
    type: 'POST',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    data: JSON.stringify({ deviceId: $("#deviceId").val() }), 
    dataType: 'json'
   })
     .done(function (data, textStatus, jqXHR) {
       // Add new device to the device list
       $("#addDeviceForm").before("<li class='collection-item'>ID: " +
       $("#deviceId").val() + ", APIKEY: " + data["apikey"] + 
         /*" <button id='ping-" + $("#deviceId").val() + "' class='waves-effect waves-light btn'>Ping</button> " +*/
         " <button id='remove-" + $("#deviceId").val() + "' class='waves-effect waves-light btn'>Remove Device</button> " +
         /* " <button id='activity-" + $("#deviceId").val() + "' class='waves-effect waves-light btn'>Show Activity</button> " +*/
         "</li>");
      //  $("#ping-"+$("#deviceId").val()).click(function(event) {
      //    pingDevice(event, device.deviceId);
      //  });
      $("#remove-"+$("#deviceId").val()).click({deviceId: $("#deviceId").val()},removeDevice);
       hideAddDeviceForm();
     })
     .fail(function(jqXHR, textStatus, errorThrown) {
       let response = JSON.parse(jqXHR.responseText);
       $("#error").html("Error: " + response.message);
       $("#error").show();
     }); 
}

//Dont know if we want/need this

// function pingDevice(event, deviceId) {
//    $.ajax({
//         url: '/devices/ping',
//         type: 'POST',
//         headers: { 'x-auth': window.localStorage.getItem("authToken") },   
//         data: { 'deviceId': deviceId }, 
//         responseType: 'json',
//         success: function (data, textStatus, jqXHR) {
//             console.log("Pinged.");
//         },
//         error: function(jqXHR, textStatus, errorThrown) {
//             var response = JSON.parse(jqXHR.responseText);
//             $("#error").html("Error: " + response.message);
//             $("#error").show();
//         }
//     }); 
// }

function populateDeviceActivity(event){
  console.log(event.data.deviceId);
  $('#activityItemList').html('');
  $.ajax({
    url: '/users/activities',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    data: { deviceId: event.data.deviceId }, 
    dataType: 'json'
  }).done(function(data){
    for(let activity of data.activities){
      $('#activityItemList').append('<li>Longitude: '+activity.lon+
      ', Latitude: '+activity.lat+', UV index: '+activity.uv+', Speed: '+activity.speed);
    }
  })
}

function removeDevice(e){
  console.log(e.data.deviceId);
  $.ajax({
    url: '/devices/remove/'+ e.data.deviceId,
    type: 'DELETE',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    //contentType: 'application/json',
    //data: { deviceId: e.data.deviceId }, 
    dataType: 'json'
  }).done(function(data){
    console.log("data: "+data.deviceId);

    $('#'+data.deviceId).remove();
  })
}

//------------------------------------------------------------------------------
function showEditAccount() {
  $("#fullNameEdit").val("");
  $("#editAccountButton").hide();
  $("#editAccountInfo").slideDown();
}

function hideEditAccount() {
  $("#editAccountButton").show();
  $("#editAccountInfo").slideUp();
}
//------------------------------------------------------------------------------

// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
  $("#deviceId").val("");        // Clear the input for the device ID
  $("#addDeviceControl").hide();   // Hide the add device link
  $("#addDeviceForm").slideDown();  // Show the add device form
}

// Hides the add device form and shows the add device button (link)
function hideAddDeviceForm() {
  $("#addDeviceControl").show();  // Hide the add device link
  $("#addDeviceForm").slideUp();  // Show the add device form
  $("#error").hide();
}
//------------------------------------------------------------------------------
function sendUpdateRequest() {
  $.ajax({
    url: '/users/account',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },
    dataType: 'json'
  })
    .done(accountInfoOnlySuccess)
    .fail(accountInfoError);
}

//------------------------------------------------------------------------------

// If the old password is correct, continue the update process
function validateSuccess(data, textSatus, jqXHR) {
  $.ajax({
    type: "PUT",
    url: '/users/update',
    data: {
      email: userEmail,
      password: $('#passwordEdit').val(),
      fullName: $("#fullNameEdit").val()
    },
    dataType: "json"
  }).done(function(returnedData) {
    $('#editErrors').html("Success! " + returnedData.message);
    $('#editErrors').show();
  }).fail(function(jqXHR) {
    $('#editErrors').html("Error: Could not update account information.");
    $('#editErrors').show();
  });
}

function validateError(jqXHR, textStatus, errorThrown) {
  if (jqXHR.statusCode == 404) {
    $("#editErrors").html("Error: Server could not be reached.");
    $('#editErrors').show();
  }
  else {
    $('#editErrors').html("Error: Password is incorrect.");
    $('#editErrors').show();
  }
}

function accountInfoOnlySuccess(data, textSatus, jqXHR) {
  let email = data.email;
  userEmail = data.email;
  let newPassword = $('#passwordEdit').val();
  let newPasswordConfirm = $('#passwordEditConfirm').val();
  let oldPassword = $("#currentPasswordEdit").val();
  let validLogin = true;
  
  $("#editErrors").hide();
  $("#editErrors").html("");

  // check old password is entered
  if (!oldPassword) {
    $("#editErrors").html("Error: You need to provide your old password.");
    $("#editErrors").show();
    return;
  }

  // check the new passwords are the same
  if (newPassword != newPasswordConfirm) {
    $("#editErrors").html("Error: New Passwords do not match.");
    $("#editErrors").show();
    return;
  }

  // check new password is strong
  let passwordLowercaseRegex = /[a-z]+/;
  let passwordUppercaseRegex = /[A-Z]+/;
  let passwordDigitRegex = /\d+/;
  let passwordSpecCharRegex = /[!@#\$%\^&]+/;

  let lowerCaseCheck = passwordLowercaseRegex.exec(newPassword);
  let upperCaseCheck = passwordUppercaseRegex.exec(newPassword);
  let digitCheck = passwordDigitRegex.exec(newPassword);
  let specialCharacterCheck = passwordSpecCharRegex.exec(newPassword);

  if (newPassword.length < 10 && newPassword.length != 0) {
    $('#editErrors').append("<div class='red-text text-darken-2'>Password needs to be at least 10 characters long.</div>");
    $('#editErrors').show();
    validLogin = false;
  }

  if (lowerCaseCheck === null && newPassword.length != 0) {
    $('#editErrors').append("<div class='red-text text-darken-2'>Password must contain at least one lower case character.</div>");
    $('#editErrors').show();
    validLogin = false;
  }

  if (upperCaseCheck === null && newPassword.length != 0) {
    $('#editErrors').append("<div class='red-text text-darken-2'>Password must contain at least one upper case character.</div>");
    $('#editErrors').show();
    validLogin = false;
  }

  if (digitCheck === null && newPassword.length != 0) {
    $('#editErrors').append("<div class='red-text text-darken-2'>Password must contain at least one digit.</div>");
    $('#editErrors').show();
    validLogin = false;
  }

  if (specialCharacterCheck === null && newPassword.length != 0) {
    $('#editErrors').append("<div class='red-text text-darken-2'>Password must contain at least one special character. Ex: (!@#\$%\^&)</div>");
    $('#editErrors').show();
    validLogin = false;
  }

  // Don't process an AJAX call
  if (!validLogin) {
    return;
  }

  // check if the old password is correct
  $.ajax({
    url: '/users/signin',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ email : email, password : oldPassword }), 
    dataType: 'json'
  })
    .done(validateSuccess)
    .fail(validateError);
}

//------------------------------------------------------------------------------

// Handle authentication on page load
$(function() {
  // If there's no authToekn stored, redirect user to 
  // the sign-in page (which is index.html)
  if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  else {
    sendReqForAccountInfo();
    hideEditAccount();
    $('#main').show();
  }
  
  // Register event listeners
  $('#saveEdit').click(sendUpdateRequest);
  $("#editAccount").click(showEditAccount);
  $("#cancelEdit").click(hideEditAccount);
  $("#addDevice").click(showAddDeviceForm);
  $("#registerDevice").click(registerDevice);  
  $("#cancel").click(hideAddDeviceForm);  
});
