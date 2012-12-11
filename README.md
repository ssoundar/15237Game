Sid Soundararajan (ssoundar)

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