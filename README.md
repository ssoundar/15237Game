Sid Soundararajan (ssoundar)

To Run This Game, run the server using node server.js.

Edit the following files:
game.js + choosePlayer.js: change the address variable to point to server location.
index.html : change line 7 to point to server location.

Problems: Many browsers do not support Websockets yet, including Cordova, default android browsers,
and firefox beta. Chrome is currently the only one I think implements it well. Due to this, the position
of the other players, with respect to who ever is playing the game, will always be a stuttery. This is due 
to the xhr-polling that is done in place of the sockets. I was not able to implement a solution that would
ensure smoothness, while also keeping the position of the players relatively accurate.

Design:
I started with an initial game idea. I can the concept of having two controllers
to control movement, and shooting, as well as the ego-centric camera. 
I started by first implementing those three things, then I proceeded to implement a
second player, and used websockets to synchronize them. Next I added enemies, and 
synchonized them as well. After than I added bullets, and collision detection between
all objects, and synchronized those events as well. At every stage, I tested the game
with a friend to ensure the implementations worked.

This project implements:
1) Javascript: All of the enemies, and objects on the map are inherited from a base
         object, then specialized. (game.js: Look of everything after MapObjects)
    
2) Canvas: The game is run on Canvas, and many of the things are drawn using 
         canvas primitives. (game.js: search for all draw functions, ScaledPage.js, Util.js)

3) DOM Manipulation: I create the two control interfaces, using pure DOM
         Manipulation. (game.js: Look at the Control object)

4) jQuery: The majority of the code is written using jQuery. (All .js files)

5) node.js: The server side is done using node.js. (server.js)

6) websockets: The communication between the players and the server is
         handled using websockets. (server.js + game.js: search for socket)

7) jQuery Mobile or Sencha Touch or equivalent: The controllers were all made by
         manipulating addTappableJQPlugin.js. Also look at the object Control in game.js, 
         this has all the code for the custom UI.

8) CSS: The styling for the login as well as selection pages. Code in choosePlayer.css.

9) HTML: Multiple Divs used for positioning the page, along with CSS. Form to log in 
         validated at server with passport.

10) Local Storage: The client side stores level and health information for the player.