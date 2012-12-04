//CHAGNETHIS: Address to server
//var address = 'http://76.125.178.2:3000/';
var address = 'http://128.237.242.111:3000/';
var socket;

//Page and Canvas Statics
var HEIGHT= 800;
var CANVASHEIGHT= 800;
var WIDTH = 1200;
var CANVASWIDTH = 800;
var CONTROL_RADIUS = 50;
var SCALE;

//Player Statics
var MAXSPEED = 10;
var MAG_EPSILON = 0.0001;
//Weapon Statics
var PISTOL = 0;
var PISTOLBULLETSPEED = 5;
var PISTOLSHOOTINGSPEED = 300;

//Map Objects Statics
var HORIZONTAL = 'horizontal';
var VERTICAL = 'vetical'
var WALL_THICKNESS = 20;

 /********
 * Game
 ********/
 var Game = function(playerType, otherPlayer) {
   socket = io.connect(address);
   socket.emit('updateAvailableCharacters', playerType);
   this.playerType = playerType;
   this.otherPlayerType = otherPlayer;
   this.setup();
   window.util.deltaTimeRequestAnimationFrame(this.draw.bind(this));
}

Game.prototype.setup = function(){
   window.util.patchRequestAnimationFrame();
   window.util.patchFnBind();
   this.initCanvas();
   this.map = new Map(this.page, this.player);
   this.map.initializeObjectArray();
   
   this.player = new Player(this.playerType, this.page, this.map);
   this.otherPlayer = new Player(this.otherPlayerType, this.page, this.map);
   this.otherPlayer.x = 300;
   this.otherPlayer.y = 300;
   socket.on('updateWithServerPosition', this.otherPlayer.updateWithServerLocation.bind(this.otherPlayer));
   this.controller = new Control(this.page, this.player);
   
   
   this.body.append($('<div id = "txtmsg">Hello</div>'));
}
Game.prototype.initCanvas = function(){
    this.body = $(document.body);
    this.body.width(document.body.offsetWidth);
    this.body.height(window.innerHeight);
    CANVASHEIGHT = (this.body.height()/this.body.width())*CANVASWIDTH;
    this.width = CANVASWIDTH;
    this.height = CANVASHEIGHT;
    this.canvas = window.util.makeAspectRatioCanvas(this.body, this.width/this.height);
    $(this.canvas).css("z-index","-1");
    this.page = new ScaledPage(this.canvas, this.width);
    SCALE = this.canvas.width() / this.width;
    HEIGHT = this.canvas.height();
    WIDTH = this.canvas.width();
    var canvasInfo = {
         CANVASWIDTH : CANVASWIDTH,
         CANVASHEIGHT: CANVASHEIGHT,
    };
    socket.emit('updateCanvasInfo', canvasInfo);
};

/*********
* Drawing
*********/
Game.prototype.draw = function(timeDiff){
    /*var stepInfo = {
      timeDiff: timeDiff,
      player: this.player.player
    };
    socket.emit('stepPlayerPosition',stepInfo);*/

    this.clearPage();
    this.updatePlayer(timeDiff);

    
    this.otherPlayer.draw();
    this.otherPlayer.weapon.drawBullets();
    
    this.map.drawObjects();
}

Game.prototype.clearPage = function(){
    this.page.fillRect(0, 0, this.width, this.height, '#eee');
}

Game.prototype.updatePlayer = function(timeDiff){
    this.player.weapon.updateBulletsLocation(timeDiff);
    this.player.updateLocation(timeDiff);
    this.player.draw();
    this.player.weapon.drawBullets();
}


 
 /********
 * Player
 ********/
 
 var Player = function(playerType, page, map) {
    this.player = playerType;
    this.page = page;
    this.x = 200;
    this.y = 200;
    this.velX = 0;
    this.velY = 0;
    this.weapon = new Weapon(this.page, this);
    this.facingDirection = {xVel: 0.0, yVel: 0.0};
    this.radius = 50;
    this.map = map;
 }
 
 Player.prototype.sendInfo = function(){
    return {
       player: this.player,
       position: {x: this.x, y:this.y,},
       direction: {velX: this.velX, velY: this.velY},
       bullets: this.weapon.bullets,
    };
 }
 
 Player.prototype.updateVelocity = function(x,y){
    this.velX = x;
    this.velY = y;
 }
 
 Player.prototype.updateLocation = function(timeDiff){
    var oldx = this.x;
    var oldy = this.y;
    this.x += this.velX*(timeDiff/20);
    
    var radius = this.radius;
    if(this.x < radius)
      this.x = radius;
    if(this.x > CANVASWIDTH - radius)
      this.x = CANVASWIDTH - radius;  
    if(this.map.checkCollision(this.boundingCircle())){
        this.x = oldx;
    }
    
    this.y += this.velY*(timeDiff/20);
    if(this.y < radius)
      this.y = radius;
    if(this.y > CANVASHEIGHT - radius)
      this.y = CANVASHEIGHT - radius;
    if(this.map.checkCollision(this.boundingCircle())){
        this.y = oldy;
    }
    socket.emit('updatePlayerInfo', this.sendInfo());
 }
 Player.prototype.updateWithServerLocation = function(data){   
    if(data.player == this.player){ 
       this.x = data.position.x;
       this.y = data.position.y;  
       this.weapon.bullets = data.bullets;
       var radius = 50;
       if(this.x < radius)
         this.x = radius;
       if(this.x > CANVASWIDTH - radius)
         this.x = CANVASWIDTH - radius;
       if(this.y < radius)
         this.y = radius;
       if(this.y > CANVASHEIGHT - radius)
         this.y = CANVASHEIGHT - radius;
    }
 }
 
 Player.prototype.draw = function(){
    this.page.fillCircle(this.x, this.y, 50, this.player);
 }
 
 Player.prototype.boundingCircle = function(){
    var circle = {
        x: this.x,
        y: this.y,
        radius : this.radius,
    };
    return circle;
 }
 
 /*******************
 * Weapon
 ******************/
 var Weapon = function(mainPage, mainPlayer){
     this.page = mainPage;
     this.player = mainPlayer;
     this.type = PISTOL;
     this.bullets = new Array();
     this.bulletSpeed = PISTOLBULLETSPEED;
     this.shootingSpeed = PISTOLSHOOTINGSPEED;
     if(this.player.player == 'black')
        this.bulletColor = 'red';
     if(this.player.player == 'blue')
        this.bulletColor = 'green';
 }

 Weapon.prototype.shoot = function(){
     var direction = this.player.facingDirection;
     if(this.type === PISTOL){
        var bullet = {
           x: this.player.x,
           y: this.player.y,
           direction: direction,
        };
        this.bullets.push(bullet);     
     }
 }
 
 Weapon.prototype.drawBullets = function(){
      for(var i = 0; i < this.bullets.length; i++){
         this.page.fillCircle(this.bullets[i].x, this.bullets[i].y, 15, this.bulletColor);
      }
 }
 
 Weapon.prototype.updateBulletsLocation = function(timeDiff){
      for(var i = 0; i < this.bullets.length; i++){
         var bullet = this.bullets[i];
         bullet.x += this.bulletSpeed*bullet.direction.xVel*(timeDiff/20);
         bullet.y += this.bulletSpeed*bullet.direction.yVel*(timeDiff/20);
         if(bullet.x < 0 || bullet.y < 0 || bullet.x > CANVASWIDTH || bullet.y > CANVASHEIGHT)
            this.bullets.splice(i,1);
      }
 }
 
 
 /*******************
 * Movement Control
 *******************/
 
 var Control = function(mainPage, mainPlayer) {
    this.player = mainPlayer;
    this.page = mainPage;
    this.shootingID;
    this.setup();
 }
 
Control.prototype.setup = function(){
    //if ('ontouchstart' in document.documentElement){
      this.initControllerBackground();
      this.initShootingControllerBackground();
      //this.initControllerStick();
    //}
    //else{
    //  alert("No Touch Device Found, use arrow keys and mouse instead");
    //}
 }

Control.prototype.initControllerBackground = function(){
    var controlCoords = {x: 0, y: 0,};
    controlCoords.x = 20;
    controlCoords.y = HEIGHT - 2*CONTROL_RADIUS - 20;
    var radius = CONTROL_RADIUS;
    var controller = $('<div class="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var down = this.finalControllerDown.bind(this); 

    var up = this.finalControllerUp.bind(this); 
    var tap = function(){
       //alert("tap");
    };
    var move = this.finalControllerMove.bind(this); 

    controller.ontap(down, up, tap, move, this);
    $('body').append(controller);
 }
 
 Control.prototype.movePlayer = function(x,y){
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);

       var minX = 20;
       var minY = HEIGHT - 2*CONTROL_RADIUS - 20;
       var maxX = minX + 2*CONTROL_RADIUS;
       var maxY = minY + 2*CONTROL_RADIUS;
       /*if(x < minX)
          x = minX;
       if(y < minY)
          y = minY;
       if(x > maxX)
          x = maxX;
       if(y > maxY)
          y = maxY;*/
       if(x < minX || x > maxX || y < minY || y > maxY)
         return;
    
       center.x = 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       
       var velX = ((x - center.x));
       var velY = ((y - center.y));
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       if(mag < MAG_EPSILON){
         velX = 0;
         velY = 0;
       }
       else{
          velX = MAXSPEED*((x - center.x)/mag);
          velY = MAXSPEED*((y - center.y)/mag);
       }
       
       this.player.updateVelocity(velX, velY);
    }
 Control.prototype.stopPlayer = function(){
       var controlCoords = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);
    
       controlCoords.x = 20 + CONTROL_RADIUS - radius;
       controlCoords.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       this.movePlayer(controlCoords.x, controlCoords.y);
    }
    
    
    
 /*******************
 * Shooting Control
 *******************/
 

 Control.prototype.initShootingControllerBackground = function(){
    var controlCoords = {x: 0, y: 0,};
    controlCoords.x = WIDTH - 2*CONTROL_RADIUS - 20;
    controlCoords.y = HEIGHT - 2*CONTROL_RADIUS - 20;
    var radius = CONTROL_RADIUS;
    var controller = $('<div class="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var down = this.finalControllerDown.bind(this); 

    var up = this.finalControllerUp.bind(this); 
    var tap = function(){
       //alert("tap");
    };
    var move = this.finalControllerMove.bind(this);  

    controller.ontap(down, up, tap, move, this.player);
    $('body').append(controller);
 }
 
 Control.prototype.startShooting = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
      if(this.shootingID !== undefined) 
         clearInterval(this.shootingID);
      this.shootingID = setInterval(this.player.weapon.shoot.bind(this.player.weapon), this.player.weapon.shootingSpeed);
 }
 Control.prototype.changeFacingDirection = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
 }
 Control.prototype.getFacingDirection = function(x,y){
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);

       var minX = WIDTH - 2*CONTROL_RADIUS - 20;
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

    
       center.x = WIDTH - 2*CONTROL_RADIUS - 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       

       var velX = ((x - center.x));
       var velY = ((y - center.y));
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       if(mag < MAG_EPSILON){
         velX = 0;
         velY = 0;
       }
       else{
          velX = ((x - center.x)/mag);
          velY = ((y - center.y)/mag);
       }
       
       return {xVel: velX, yVel: velY};
       
    }
 Control.prototype.stopShooting = function(){
       clearInterval(this.shootingID);
    }
 
 /*******************
 *  Combined Controls
 *******************/
  Control.prototype.finalControllerDown = function(x,y){
    if(x < WIDTH/2)
      this.movePlayer(x,y);
    if(x > WIDTH/2)
      this.startShooting(x,y); 
 }
 
 Control.prototype.finalControllerMove = function(x,y){
    if(x < WIDTH/2)
      this.movePlayer(x,y);
    if(x > WIDTH/2)
      this.changeFacingDirection(x,y); 
 }
 
 Control.prototype.finalControllerUp = function(){
    this.stopPlayer();
    this.stopShooting(); 
 }
 /*******************
 * Map
 *******************/
 var Map = function(mainPage, mainPlayer){
     this.page = mainPage;
     this.player = mainPlayer;
     this.objects = new Array();
     this.mapWidth = 5000;
     this.mapHeight = 5000;
 }
 
 Map.prototype.initializeObjectArray = function(){
     var wall1 = new Wall(this.page, 0, 0, HORIZONTAL, CANVASWIDTH, 'yellow');
     var wall2 = new Wall(this.page, 0, CANVASHEIGHT - WALL_THICKNESS, HORIZONTAL, CANVASWIDTH, 'yellow');
     var wall3 = new Wall(this.page, 0, 0, VERTICAL, CANVASHEIGHT, 'yellow');
     var wall4 = new Wall(this.page, CANVASWIDTH - WALL_THICKNESS, 0, VERTICAL, CANVASHEIGHT, 'yellow');
     this.objects.push(wall1);
     this.objects.push(wall2);
     this.objects.push(wall3);
     this.objects.push(wall4);
 }
 
 Map.prototype.adjustToEgoCentric = function(x,y){
     var xOffset = x - this.player.x;
     var yOffset = y - this.player.y;
     var centerOfCanvas = {x: CANVASWIDTH/2, y: CANVASHEIGHT/2,};
     return {x: centerOfCanvas.x + xOffset, y: centerOfCanvas.y + yOffset};
 }
 
 Map.prototype.drawObjects = function(){
      for(var i = 0; i < this.objects.length; i++){
           this.objects[i].draw();
      }
 }
 
 Map.prototype.checkCollision = function(circle){
      for(var i = 0; i < this.objects.length; i++){
           if(this.objects[i].isCollision(circle) && !this.objects[i].passable)
               return true;
      }
      return false;
 }
 /*****************
 *  Map Objects
 *****************/
 
function MapObject(mainPage, initX, initY){
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.orientation = 'up';
      this.width = 2;
      this.height = 2;
      this.passable = false;
 }
 
MapObject.prototype.isCollision = function(circle){
      var rect = {x: this.x + this.width/2, y: this.y + this.height/2,};
      var circDist = {x: Math.abs(circle.x - rect.x), y: Math.abs(circle.y - rect.y)};
      if(circDist.x > (this.width/2 + circle.radius))
         return false;
      if(circDist.y > (this.height/2 + circle.radius))
         return false;
      
      if(circDist.x <= (this.width/2))
         return true;
      if(circDist.y <= (this.height/2))
         return true;
      
      var cornerDist = Math.pow((circDist.x - this.width/2),2) + Math.pow((circDist.y - this.height/2),2);
      return (cornerDist <= Math.pow(circle.radius,2));
 }
 
 /**************
 * Wall
 **************/
 function Wall(mainPage, initX, initY, orientation, length, color){
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.orientation = orientation;
      if(orientation == HORIZONTAL){
         this.width = length;
         this.height = WALL_THICKNESS;
      }
      else if(orientation == VERTICAL){
         this.width = WALL_THICKNESS;
         this.height = length;
      }
      
      this.passable = false;
      this.color = color;
 }
 
 Wall.prototype = new MapObject();
 Wall.prototype.constructor = Wall;
 Wall.prototype.draw = function(){
       this.page.fillRect(this.x, this.y, this.width, this.height, this.color);
 }