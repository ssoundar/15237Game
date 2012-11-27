//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
var socket;
$(document).ready(function() {
   socket = io.connect(address);
   socket.emit('updateAvailableCharacters', window.playerType);
   $("#add").html(window.playerType);
 });
 
 
 
 /********
 * Player
 ********/
 
 var Player = function() {

 }
 
