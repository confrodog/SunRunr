function sendRegisterRequest() {
  let email = $('#email').val();
  let password = $('#password').val();
  let fullName = $('#fullName').val();
  let passwordConfirm = $('#passwordConfirm').val();
  let validLogin = true;

  // Reset the Server Response
  $('#ServerResponse').html("");
  $('#ServerResponse').hide();
  
  // Check to make sure the passwords match
  if (password != passwordConfirm) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Passwords do not match.</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  // Check for a strong password
  let passwordLowercaseRegex = /[a-z]+/;
  let passwordUppercaseRegex = /[A-Z]+/;
  let passwordDigitRegex = /\d+/;
  let passwordSpecCharRegex = /[!@#\$%\^&]+/;

  let lowerCaseCheck = passwordLowercaseRegex.exec(password);
  let upperCaseCheck = passwordUppercaseRegex.exec(password);
  let digitCheck = passwordDigitRegex.exec(password);
  let specialCharacterCheck = passwordSpecCharRegex.exec(password);

  if (password.length < 10) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Password needs to be at least 10 characters long.</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  if (lowerCaseCheck === null) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Password must contain at least one lower case character.</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  if (upperCaseCheck === null) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Password must contain at least one upper case character.</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  if (digitCheck === null) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Password must contain at least one digit.</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  if (specialCharacterCheck === null) {
    $('#ServerResponse').append("<div class='red-text text-darken-2'>Password must contain at least one special character. Ex: (!@#\$%\^&)</div>");
    $('#ServerResponse').show();
    validLogin = false;
  }

  // Don't process an AJAX call
  if (!validLogin) {
    return;
  }
  
  $.ajax({
   url: '/users/register',
   type: 'POST',
   contentType: 'application/json',
   data: JSON.stringify({email:email, fullName:fullName, password:password}),
   dataType: 'json'
  })
    .done(registerSuccess)
    .fail(registerError);
}

function registerSuccess(data, textStatus, jqXHR) {
  if (data.success) {  
    window.location = "index.html";
  }
  else {
    $('#ServerResponse').html("<div class='red-text text-darken-2'>Error: " + data.message + "</div>");
    $('#ServerResponse').show();
  }
}

function registerError(jqXHR, textStatus, errorThrown) {
  if (jqXHR.statusCode == 404) {
    $('#ServerResponse').html("<div class='red-text text-darken-2'>Server could not be reached.</div>");
    $('#ServerResponse').show();
  }
  else {
    $('#ServerResponse').html("<div class='red-text text-darken-2'>Error: " + jqXHR.responseJSON.message + "</div>");
    $('#ServerResponse').show();
  }
}

$(function () {
  $('#signup').click(sendRegisterRequest);
});

