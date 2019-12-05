var weekdays = ["Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Augu", "Sep", "Oct", "Nov", "Dec"];

function createFirstDiv(a){
  var fdiv = document.createElement("div");
  var d = new Date(0);
  d.setUTCSeconds(a.began);
  var datediv = document.createElement("div");
  datediv.innerHTML = "<strong>Date: </strong>" + months[d.getMonth()] + ". " + d.getDate() + ", " + d.getFullYear();
  
  var durdiv = document.createElement("div");
  var seconds = parseInt(a.ended - a.began);
  var hours = Math.floor((seconds % 86400) / 3600);
  var min = Math.floor(((seconds % 86400) % 3600) / 60);
  var sec = ((seconds % 86400) % 3600) % 60;
  durdiv.innerHTML = ("<strong>Duration: </strong>" + hours + ":" + ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2));
  
  var caldiv = document.createElement("div");
  //CALCULATE CALORIES
  var calBurn = 0;
  if(a.activityType == 'walk'){
    calBurn = 344 * (seconds%86400)/3600;
  }
  else if(a.activityType == 'run'){
    calBurn = 672 * (seconds%86400)/3600;
  }
  else if(a.activityType == 'bike'){
    calBurn = 600 * (seconds%86400)/3600;
  }
  caldiv.innerHTML = "<strong>Calories Burned: </strong>" + Math.round(calBurn);
  fdiv.append(datediv);
  fdiv.append(durdiv);
  fdiv.append(caldiv);
  return fdiv;
}

function createSecDiv(a){
  var sdiv = document.createElement("div");
  var uvdiv = document.createElement("div");
  var uv = 0;
  for(uvs of a.activity){
    uv += uvs.uv;
  }
  uvdiv.innerHTML = "<strong>UV Exposure: </strong>" + (uv/ a.activity.length);
  var tempdiv = document.createElement("div");
  tempdiv.innerHTML = "<strong>Temperature: </strong> 100&#8457;" ;
  var humdiv = document.createElement("div");
  humdiv.innerHTML = "<strong>Humidity: </strong> 341";
  //CALCULATE CALORIES
  sdiv.append(uvdiv);
  sdiv.append(tempdiv);
  sdiv.append(humdiv);
  return sdiv;
}

function createContent(a, i){
  var div = document.createElement("div");
  var sel = document.createElement("select");
  sel.name = "activitytype";
  sel.id = i + "_acttype";
  sel.classList.add("activityType");
  var label = document.createElement("label");
  label.htmlFor = "activitytype";
  label.innerText = "Activity Type: ";
  div.append(label);
  var ow = document.createElement("option");
  var or = document.createElement("option");
  var ob = document.createElement("option");
  ow.value = "walk";
  or.value = "run";
  ob.value = "bike";
  ow.innerText = "Walking";
  or.innerText = "Running";
  ob.innerText = "Biking";
  sel.append(ow);
  sel.append(or);
  sel.append(ob);
  sel.value = a.activityType;
  div.append(sel);

  div.append(createChart(a));

  return div;

}

function sum7days(acts){
  var today = new Date();
  var last = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  last.setHours(0,0,0,0);
  var totActDuration = 0;
  var totCalBurned = 0;
  var totUV = 0;

  for(var a of acts){
    var b = new Date(0);
    b.setUTCSeconds(a.began)
    var e = new Date(0);
    e.setUTCSeconds(a.ended);
    var dur = a.ended - a.began;
    //if(b >= last){
      totActDuration += (dur);
      if(a.activityType == 'walk'){
        totCalBurned += 344 * (dur%86400)/3600;
      }
      else if(a.activityType == 'run'){
        totCalBurned += 672 * (dur%86400)/3600;
      }
      else if(a.activityType == 'bike'){
        totCalBurned += 600 * (dur%86400)/3600;
      }
      for(var u of a.activity){
        totUV += u.uv;
      }
    //}
  }

  //console.log(totUV);
  var sec = parseInt(totActDuration);
  var days = Math.floor(sec / 86400);
  var hours = Math.floor((sec % 86400) / 3600);
  var min = Math.floor(((sec % 86400) % 3600) / 60);
  var sec = ((sec % 86400) % 3600) % 60;
  $('#totactdur').html(days + ':' + ("0" + hours).slice(-2) + ':' + ("0" + min).slice(-2) + ':' + ("0" + sec).slice(-2));
  $('#totcalbur').html(Math.round(totCalBurned));
  $('#totuvexp').html(totUV);
  $('.loader').hide();
  console.log("");
}

function createChart(a){
  var curr = 15;
  var x = [0];
  var speedy = [0]
  var uvy = [0];
  for(var act of a.activity){
    x.push(curr);
    speedy.push(act.speed);
    uvy.push(act.uv);
    curr+=15;
  }
  var ctx = document.createElement("canvas");
  ctx.classList.add("chart");
  var myLineChart = new Chart(ctx, {
    type: 'line',
    data: 
    {
      labels: x,
      datasets: [
        {
          label: 'Speed',
          data: speedy,
          borderColor:'#8e5ea2',
          fill: false
        },
        {
          label: 'UV',
          data: uvy,
          borderColor: '#3e95cd',
          fill: false
        }
      ]
    },
    options: {
      scales: {
          xAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Time (seconds)'
            }
          }]
      }
  }
});

return ctx;
}

function collap(){
  var coll = document.getElementsByClassName("collapsible");
  var i;
  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      } 
    });
  }
}

function populateDeviceActivity(){
  $('#activityItemList').html('');
  $.ajax({
    url: '/users/activities',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    dataType: 'json'
  }).done(function(data){
    var d = data.activities;
    console.log(d);
    sum7days(d);
    for(var a in d){
      console.log();
      var li = document.createElement("li");
      li.id = a + "_activity";
      var coldiv = document.createElement("div");
      coldiv.classList.add("collapsible");
      coldiv.classList.add("blue");
      var fdiv = createFirstDiv(d[a]);
      var sdiv = createSecDiv(d[a]);
      coldiv.append(fdiv);
      coldiv.append(sdiv);
      var i = document.createElement("i");
      i.classList.add("material-icons");
      i.classList.add("collapsible-secondary");
      i.innerText = "arrow_drop_down";
      coldiv.append(i);
      li.append(coldiv);
      var con = document.createElement("div");
      con.append(createContent(d[a], a));
      con.classList.add("content");
      li.append(con);
      $('#activities ul').append(li);

    }
    collap();
    $('.activityType').change(function(e){
      var id = e.target.id;
      //CHANGE ON DATABASE ON ID
    });
  })
}



$(document).ready(function(){
  $('#main').show();  
  populateDeviceActivity(); 
  $.ajax({
    url: 'http://api.openweathermap.org/data/2.5/forecast?lat=32.2328&lon=-110.9607&units=imperial&APPID=1ac5b46230b1f3ae861be919195faa05',
    type: 'GET',
    dataType: 'json',
    success: function(result){
      var allfc = [];
      var d = new Date(result.list[0].dt_txt);
      var temp = 0;
      var cnt = 0;
      for(i of result.list){
        var fcast = new Object();
        var iDate = new Date(i.dt_txt);
        if(iDate.getDate() == d.getDate()){
          temp += i.main.temp;
          cnt++;
        }
        else{
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
      fcast.month = d.getMonth();
      fcast.day = d.getDate();
      fcast.year = d.getFullYear();
      fcast.temp = temp / cnt;
      allfc.push(fcast);
      for(i in allfc){
        $('#fc_' + i).find('.fcdate').html(months[allfc[i].month] + " " + allfc[i].day + ", " + allfc[i].year);
        $('#fc_' + i).find('.fctemp').html(allfc[i].temp.toFixed(2) + '&#8457;');
      }
    }
  })
  .fail(console.log("FAIL"));




});