//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
//var address = 'http://128.237.238.78:3000/';

$(document).ready(function() {
   window.util.patchFnBind();
   
   if(hasSessionCookie()){
      $('#login').hide();
      $('#choosePlayer').show();
      var sessId = getUserId();
      var socket;
      socket = io.connect(address);
      socket.emit('toggleSendAvailableCharacters', true);
      socket.on('getAvailableCharacters', function(characterData) {
          var data = characterData.availableCharacters;
          var idCheck = characterData.sessIdToType;
          if(idCheck[sessId] === 'blue'){
            $("#blackButton").hide();
            $("#blueButton").hide();
            $("#contBlack").hide();
            $("#contBlue").show();
            $("#message").html("<h2>Please click to continue.<h2>");
            return;
          }
          if(idCheck[sessId] === 'black'){
            $("#blackButton").hide();
            $("#blueButton").hide();
            $("#contBlue").hide();
            $("#contBlack").show();
            $("#message").html("<h2>Please click to continue.<h2>");
            return;
          }
          $("#contBlack").hide();
          $("#contBlue").hide();
          if(data.indexOf('black') >= 0){
             $("#blackButton").hide();
          }
          if(data.indexOf('blue') >= 0){
             $("#blueButton").hide();
          }
          if(data.length >= 2 && data.indexOf('black') >= 0 && data.indexOf('blue') >= 0){
             $("#message").html("<h2>All Players Assigned.<h2>");
          }
      });
   }
 });
function setUserID(playerType, otherPlayer, toSet){
   $('body').html("");
   if(toSet){
      var socket;
      socket = io.connect(address);
      var sessId = getUserId();
      var userName = getUserName();
      var userInfo = {
         player: userName,
         sessId: sessId,
         playerType: playerType,
      };
      socket.emit('setPlayer', userInfo);
   }
   
   new Game(playerType, otherPlayer);
}

function register(){
   var username = $("#username").val();
   var password = $("#password").val();
   var valid = false;
   var data = {
      username: username,
      password: password,
   };
   var problems = '';
   if(username.length > 20){
      problems += ' Username is too long,';
   }
   if(password.length > 20){
      problems += ' Password is too long,';
   }
   problems += '.';
   if(valid){
      var socket;
      socket = io.connect(address);
      socket.emit('registerUser', data);
      $("#message").html('');
      $("#message").html('<h2>Registered, refresh to log in.</h2>');
   }else{
      $("#message").html('<h2>There is a problem:'+problems+'</h2>');
   }
}

function resetUsers(){
   var socket;
   socket = io.connect(address);
   socket.emit('updateAvailableCharacters', 'reset');
   location.reload();
}



