//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
var socket;

//Page and Canvas Statics
var HEIGHT= 800;
var CANVASHEIGHT= 800;
var WIDTH = 1200;
var CANVASWIDTH = 800;
var CONTROL_RADIUS = 50;
var SCALE;

//Player Statics
var MAX_SPEED = 10;

//Weapon Statics
var PISTOL = 0;
var PISTOLBULLETSPEED = 25;
var PISTOLSHOOTINGSPEED = 100;

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
   this.player = new Player(this.playerType, this.page);
   this.otherPlayer = new Player(this.otherPlayerType, this.page);
   this.moveController = new MoveControl(this.page, this.player);
   this.shootController = new ShootingControl(this.page, this.player);
   this.map = new Map(this.page, this.player);
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
};

/*********
* Drawing
*********/
Game.prototype.draw = function(timeDiff){
    this.clearPage();
    this.player.updateLocation(timeDiff);
    this.player.weapon.updateBulletsLocation(timeDiff);
    this.player.draw();
    this.player.weapon.drawBullets();
}

Game.prototype.clearPage = function(){
    this.page.fillRect(0, 0, this.width, this.height, '#eee');
}


 
 /********
 * Player
 ********/
 
 var Player = function(playerType, page) {
    this.player = playerType;
    this.page = page;
    var playerLocation = page.pageToCanvas(0,0);
    this.x = playerLocation.x;
    this.y = playerLocation.y;
    this.velX = 0;
    this.velY = 0;
    this.weapon = new Weapon(this.page, this);
    this.facingDirection = {xVel: 0.0, yVel: 0.0};
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
    if(this.x > CANVASWIDTH - radius)
      this.x = CANVASWIDTH - radius;
    if(this.y < radius)
      this.y = radius;
    if(this.y > CANVASHEIGHT - radius)
      this.y = CANVASHEIGHT - radius;
 }
 
 Player.prototype.draw = function(){
    this.page.fillCircle(this.x, this.y, 50, 'red');
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
         this.page.fillCircle(this.bullets[i].x, this.bullets[i].y, 5, 'green');
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
    var controller = $('<div class="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var down = this.movePlayer.bind(this); 

    var up = this.stopPlayer.bind(this);
    var tap = function(){
       //alert("tap");
    };
    var move = this.movePlayer.bind(this); 

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
 
 MoveControl.prototype.movePlayer = function(x,y){
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);

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

    
       center.x = 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       
       var velX = MAX_SPEED * ((x - center.x)/CONTROL_RADIUS);
       var velY = MAX_SPEED * ((y - center.y)/CONTROL_RADIUS);
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       var speed = MAX_SPEED * mag/CONTROL_RADIUS;
       
       this.player.updateVelocity(velX, velY);
    }
 MoveControl.prototype.stopPlayer =function(){
       var controlCoords = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);
    
       controlCoords.x = 20 + CONTROL_RADIUS - radius;
       controlCoords.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       this.movePlayer(controlCoords.x, controlCoords.y);
    }
    
    
    
 /*******************
 * Shooting Control
 *******************/
 
 var ShootingControl = function(mainPage, mainPlayer) {
    this.player = mainPlayer;
    this.page = mainPage;
    this.shootingID;
    this.setup();
 }
 
 ShootingControl.prototype.setup = function(){
    //if ('ontouchstart' in document.documentElement){
      this.initControllerBackground();
      //this.initControllerStick();
    //}
    //else{
    //  alert("No Touch Device Found, use arrow keys and mouse instead");
    //}
 }

 ShootingControl.prototype.initControllerBackground = function(){
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
    
    var down = this.startShooting.bind(this); 

    var up = this.stopShooting.bind(this);
    var tap = function(){
       //alert("tap");
    };
    var move = this.changeFacingDirection.bind(this); 

    controller.ontap(down, up, tap, move, this.player);
    $('body').append(controller);
 }
 
 ShootingControl.prototype.initControllerStick = function(){
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
 ShootingControl.prototype.startShooting = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
      $("#txtmsg").text(this.player.weapon.shootingSpeed);
      this.shootingID = setInterval(this.player.weapon.shoot.bind(this.player.weapon), this.player.weapon.shootingSpeed);
 }
 ShootingControl.prototype.changeFacingDirection = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
 }
 ShootingControl.prototype.getFacingDirection = function(x,y){
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
       velX = ((x - center.x)/mag);
       velY = ((y - center.y)/mag);
       
       return {xVel: velX, yVel: velY};
       
    }
 ShootingControl.prototype.stopShooting = function(){
       clearInterval(this.shootingID);
    }
    
 /*******************
 * Map
 *******************/
 var Map = function(mainPage, mainPlayer){
     this.page = mainPage;
     this.player = mainPlayer;
 }
 
 Map.prototype.adjustToEgoCentric = function(x,y){
     
 }