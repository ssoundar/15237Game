//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
var socket;
$(document).ready(function() {
   socket = io.connect(address);
   socket.emit('toggleSendAvailableCharacters', true);
   socket.on('getAvailableCharacters', function(data) {
       if(data.indexOf('black') >= 0){
          $("#blackButton").hide();
       }
       if(data.indexOf('blue') >= 0){
          $("#blueButton").hide();
       }
       if(data.length >=2){
          $( "#popupdiv" ).html("No More Player Slots");
          $( "#popupdiv" ).popup();
          $( "#popupdiv" ).popup("open");

          window.setTimeout(function(){
            $( "#popupdiv" ).popup("close");
          },2000);
       }
    });
 });
function setUserID(playerType){
   if(playerType === 'black'){
      window.playerType = 'black';
   }
   if(playerType === 'blue'){
      window.playerType = 'blue';
   }
}

