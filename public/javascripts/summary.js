var weekdays = ["Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Augu", "Sep", "Oct", "Nov", "Dec"];
$(document).ready(function(){
  $('#main').show();  
  $('.collapsible').collapsible();
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