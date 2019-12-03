var weekdays = ["Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Augu", "Sep", "Oct", "Nov", "Dec"];

function createFirstDiv(a){
  //var fdiv = document.createElement("div");
  var fdiv = $('<div></div>');
  var d = new Date(0);
  d.setUTCSeconds(a.began);
  //var datediv = document.createElement("div");
  var datediv = $('<div></div>')
  datediv.html("<strong>Date: </strong>" + months[d.getMonth()] + ". " + d.getDate() + ", " + d.getFullYear());
  
  //var durdiv = document.createElement("div");
  var durdiv = $('<div></div>');
  var seconds = parseInt(a.ended - a.began);
  var hrs   = Math.floor(seconds / 3600);
  seconds  -= hrs*3600;
  var mnts = Math.floor(seconds / 60);
  seconds  -= mnts*60;
  durdiv.html("<strong>Duration: </strong>" + hrs + " hours, " + mnts + " mins, " + seconds + " seconds");
  
  //var caldiv = document.createElement("div");
  var caldiv = $('<div></div>');
  caldiv.html("<strong>Calories Burned: </strong> 100");
  //CALCULATE CALORIES
  fdiv.append(datediv);
  fdiv.append(durdiv);
  fdiv.append(caldiv);
  return fdiv;
}

function createSecDiv(a){
  var sdiv = document.createElement("div");
  
  var uvdiv = document.createElement("div");
  uvdiv.innerHTML = "<strong>UV Exposure: </strong>" + a.activity[0].uv;
  
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

function createContent(){
  var sel = $('<select name="activitytype" id="activitytype"></select>')
  var ow = $('<option value="walk" selected>Walking</option>');
  var or = $('<option value="run">Running</option>');
  var ob = $('<option value="bike">Bikeing</option>');
  sel.append(ow);
  sel.append(or);
  sel.append(ob);

  return sel;

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
    for(var a of data.activities){
      console.log(a);
      var li = $('<li></li>')
      //var li = document.createElement("li");
      var coldiv = $('<div class="collapsible blue"></div>')
      //var coldiv = document.createElement("div");
      //coldiv.classList.add("collapsible");
      //coldiv.classList.add("blue");
      var fdiv = createFirstDiv(a);
      //var sdiv = createSecDiv(a);
      coldiv.append(fdiv);
      //coldiv.append(sdiv);
      var i = $('<i class="material-icons collapsible-secondary>arrow_drop_down</i>')
      //var i = document.createElement("i");
      //i.classList.add("material-icons");
      //i.classList.add("collapsible-secondary");
      //i.innerText = "arrow_drop_down";
      coldiv.append(i);
      li.append(coldiv);
      //var con = document.createElement("div");
      var con = $('<div class="content"></div>');
      con.append(createContent());
      //console.log(createContent());
      //con.classList.add("content");
      li.append(con);
      $('#activities ul').append(li);

    }
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

});