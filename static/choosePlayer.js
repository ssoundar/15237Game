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
       if(data.length >= 2 && data.indexOf('black') >= 0 && data.indexOf('blue') >= 0){
          $("#resetButton").show();
          $("#message").text("All Players Assigned, click to reassign players.");
       }
    });
 });
function setUserID(playerType, otherPlayer){
   $('body').html("");
   new Game(playerType, otherPlayer);
}

function resetUsers(){
   socket.emit('updateAvailableCharacters', 'reset');
   location.reload();
}

