//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
var socket;
var HEIGHT= 800;
var CANVASHEIGHT= 800;
var WIDTH = 1200;
var CONTROL_RADIUS = 60;
var SCALE;
var MAX_SPEED = 10;
 /********
 * Game
 ********/
 var Game = function(playerType) {
   socket = io.connect(address);
   socket.emit('updateAvailableCharacters', playerType);
   this.playerType = playerType;
   this.setup();
   window.util.deltaTimeRequestAnimationFrame(this.draw.bind(this));
}

Game.prototype.setup = function(){
   window.util.patchRequestAnimationFrame();
   window.util.patchFnBind();
   this.initCanvas();
   this.player = new Player(this.playerType, this.page);
   this.moveController = new MoveControl(this.page, this.player);
   this.body.append($('<div id = "txtmsg">Hello</div>'));
}
Game.prototype.initCanvas = function(){
    this.body = $(document.body);
    this.body.width(document.body.offsetWidth);
    this.body.height(window.innerHeight);
    CANVASHEIGHT = (this.body.height()/this.body.width())*WIDTH;
    this.width = WIDTH;
    this.height = CANVASHEIGHT;
    this.canvas = window.util.makeAspectRatioCanvas(this.body, this.width/this.height);
    $(this.canvas).css("z-index","-1");
    this.page = new ScaledPage(this.canvas, this.width);
    SCALE = this.canvas.width() / this.width;
    HEIGHT = this.canvas.height();
};

/*********
* Drawing
*********/
Game.prototype.draw = function(timeDiff){
    this.clearPage();
    this.player.updateLocation(timeDiff);
    this.player.draw();
}

Game.prototype.clearPage = function(){
    this.page.fillRect(0, 0, this.width, this.height, '#eee');
}

/*******************
 * Movement Control
 *******************/
 
 var MoveControl = function(mainPage, mainPlayer) {
    this.player = mainPlayer;
    this.page = mainPage;
    this.setup();
 }
 
 MoveControl.prototype.setup = function(){
    //if ('ontouchstart' in document.documentElement){
      this.initControllerBackground();
      //this.initControllerStick();
    //}
    //else{
    //  alert("No Touch Device Found, use arrow keys and mouse instead");
    //}
 }

 MoveControl.prototype.initControllerBackground = function(){
    var controlCoords = {x: 0, y: 0,};
    controlCoords.x = 20;
    controlCoords.y = HEIGHT - 2*CONTROL_RADIUS - 20;
    var radius = CONTROL_RADIUS;
    var controller = $('<div id="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var movePlayer = function(x,y,player){
       $("#txtmsg").text(x + ", " + y);
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);
    
       center.x = 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       
       var velX = MAX_SPEED * ((x - center.x)/CONTROL_RADIUS);
       var velY = MAX_SPEED * ((y - center.y)/CONTROL_RADIUS);
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       var speed = MAX_SPEED * mag/CONTROL_RADIUS;
       
       player.updateVelocity(velX, velY);
    }
    movePlayer.bind(this)
    var down = function(x,y,player){
       movePlayer(x,y,player);
    };
    var up = function(player){
       var controlCoords = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);
    
       controlCoords.x = 20 + CONTROL_RADIUS - radius;
       controlCoords.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       movePlayer(controlCoords.x, controlCoords.y,player);
    };
    var tap = function(){
       //alert("tap");
    };
    var move = function(x,y,player){
       var minX = 20;
       var minY = HEIGHT - 2*CONTROL_RADIUS - 20;
       var maxX = minX + 2*CONTROL_RADIUS;
       var maxY = minY + 2*CONTROL_RADIUS;
       if(x < minX)
          x = minX;
       if(y < minY)
          y = minY;
       if(x > maxX)
          x = maxX;
       if(y > maxY)
          y = maxY;
       movePlayer(x,y,player);
    };
    controller.ontap(down, up, tap, move, this.player);
    $('body').append(controller);
 }
 
 MoveControl.prototype.initControllerStick = function(){
    var controlCoords = {x: 0, y: 0,};
    var radius = CONTROL_RADIUS * (1/10);
    
    controlCoords.x = 20 + CONTROL_RADIUS - radius;
    controlCoords.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
    
    var stick = $('<div id="stick"></div>');
    stick.css("left", controlCoords.x);
    stick.css("top", controlCoords.y);
    stick.css("border-radius", radius);
    stick.css("-webkit-border-radius", radius);
    stick.css("-moz-border-radius", radius);
    stick.css("height", radius*2);
    stick.css("width", radius*2);
    $('#controller').append(stick);
 }
 
 
 /********
 * Player
 ********/
 
 var Player = function(playerType, page) {
    this.player = playerType;
    this.page = page;
    var playerLocation = page.canvasToPage(200,200);
    this.x = playerLocation.x;
    this.y = playerLocation.y;
    this.velX = 0;
    this.velY = 0;
 }
 
 Player.prototype.updateVelocity = function(x,y){
    this.velX = x;
    this.velY = y;
 }
 Player.prototype.updateLocation = function(timeDiff){
    this.x += this.velX*(timeDiff/20);
    this.y += this.velY*(timeDiff/20);
    var radius = 50;
    if(this.x < radius)
      this.x = radius;
    if(this.x > WIDTH-radius)
      this.x = WIDTH - radius;
    if(this.y < radius)
      this.y = radius;
    if(this.y > CANVASHEIGHT - radius)
      this.y = CANVASHEIGHT - radius;
 }
 Player.prototype.draw = function(){
    this.page.fillCircle(this.x, this.y, 50, 'red');
 }
 
 
 
