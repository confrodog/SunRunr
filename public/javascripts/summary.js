var weekdays = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
var months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Augu",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var long = 0;
var lat = 0;

function getUserInfo() {
	$.ajax({
		url: "/users/account",
		type: "GET",
		headers: { "x-auth": window.localStorage.getItem("authToken") },
		dataType: "json"
	})
		.done((data, textSatus, jqXHR) => {
			long = data.longitude;
			lat = data.latitude;
		})
		.fail((jqXHR, textStatus, errorThrown) => {
			console.log("Failed to get User Information");
    })
    .then(populateWeather);
}

function getUVIndex(day, month, year, i) {
	var dt = [year, month, day].join('-');

	$.ajax({
		type: "GET",
		dataType: "json",
		beforeSend: function(request) {
			request.setRequestHeader(
				"x-access-token",
				"661bce55d3b38e9e58c4a4507c0ec01f"
			);
		},
		url:
			"https://api.openuv.io/api/v1/uv?lat=" +
			lat +
			"&lng=" +
			long +
			"&dt=" +
			dt,
		success: function(response) {
			$("#fc_" + i)
					.find(".fcuv")
					.html(response.result.uv);
		},
		error: function(response) {
			console.log("Failed to get UV information");
		}
	});
}

function populateWeather() {
	$("#main").show();
	$(".collapsible").collapsible();
	$.ajax({
		url:
			"http://api.openweathermap.org/data/2.5/forecast?lat=32.2328&lon=-110.9607&units=imperial&APPID=1ac5b46230b1f3ae861be919195faa05",
		type: "GET",
		dataType: "json",
		success: function(result) {
			var allfc = [];
			var d = new Date(result.list[0].dt_txt);
			var temp = 0;
			var cnt = 0;
			for (i of result.list) {
				var fcast = new Object();
				var iDate = new Date(i.dt_txt);
				if (iDate.getDate() == d.getDate()) {
					temp += i.main.temp;
					cnt++;
				} else {
					fcast.month = d.getMonth();
					fcast.day = d.getDate();
					fcast.year = d.getFullYear();
					fcast.temp = temp / cnt;
					allfc.push(fcast);
					d = iDate;
					temp = i.main.temp;
					cnt = 1;
				}
			}
			for (i in allfc) {
        getUVIndex(allfc[i].day, allfc[i].month, allfc[i].year, i);
				$("#fc_" + i)
					.find(".fcdate")
					.html(
						months[allfc[i].month] +
							" " +
							allfc[i].day +
							", " +
							allfc[i].year
					);
				$("#fc_" + i)
					.find(".fctemp")
					.html(allfc[i].temp.toFixed(2) + "&#8457;");
			}
		},
		error: function(response) {
			console.log("Failed to get weather information");
		}
	});

}

$(document).ready(function() {
  getUserInfo();
});
