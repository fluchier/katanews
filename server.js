// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var session      = require('express-session');
var jwt          = require('jsonwebtoken'); // used to create, sign, and verify tokens

// load up the models
var User       = require('./app/models/user');
var Game       = require('./app/models/game');

// configuration ===============================================================
mongoose.connect("mongodb://localhost/passport"); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'API_WS_SECRET_TOKEN_345GDYEE5EDH' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

/* S'il n'y a pas de todolist dans la session,
on en crée une vide sous forme d'array avant la suite */
app.use(function(req, res, next){
  if (typeof(req.session.todolist) == 'undefined') {
      req.session.todolist = [];
  }
  next();
})

//////// API

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

  // show the home page (will also have our login links)
  apiRoutes.get('/', function(req, res) {
      res.render('api.ejs', { message: req.flash('apiLoginMessage') });
  });

  // show the help page
  apiRoutes.get('/help', function(req, res) {
    res.render('api-help.ejs', { message: req.flash('apiLoginMessage') });
  });

  apiRoutes.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({
        "local.email": req.body.email
    }, function(err, user) {
        
      //if (err) throw err;

      if (!user || !user.validPassword(req.body.password)) {
        res.json({ success: false, message: 'Authentication failed. User/password not found.' });
      } 
      else {

        // if user is found and password is right
        // create a token with RS256, none, ...
        var token = jwt.sign(user, 'API_WS_SECRET_TOKEN_345GDYEE5EDH', {
            expiresIn: 1440 // expires in 24 hours (60x24=1440)
        });

        // record token
        User.update({_id: user._id}, {"token": token}, function (err, result) {
            if (err) return next(err);
        });

        // return the information including token as JSON
        res.json({
            success: true,
            message: 'Enjoy your token!',
            yourID: user._id,
            username: user.local.username,
            token: token
        });       
      }
    
    });
  });

  // route middleware to verify a token
  apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, 'API_WS_SECRET_TOKEN_345GDYEE5EDH', function(err, decoded) {      
        if (err) {
          return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });    
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;  
          next();
        }
      });

    } else {

      // if there is no token
      // return an error
      return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
      });
      
    }
  });

  // --- Games ---

  // get games
  apiRoutes.get('/games', function (req, res) {
    Game.find({}, function(err, games) {
      if (games)
        res.json({success: true, games: games});
      else
        return res.status(403).send({ 
          success: false, 
          message: 'No game found' 
        });
    });
  });

  // delete ALL GAMES TODO: protect
  apiRoutes.delete('/games/', function (req, res) {
    Game.remove({}, function (err) {
      //if (err) { throw err; }
        res.json({
          success: true,
          message: 'All games deleted.'
        }); 
      });
  });

  // new game
  apiRoutes.post('/game', function (req, res) {

    User.findById(req.params.id, 'local.username', function (err, user) {
      //if (err) { throw err; };
      console.log(user);
      var username = user && user.local && user.local.username ? user.local.username : "Player 1";
      var game = new Game({ 
        name: 'Les colons de Catane',
        startDate: new Date(),
        players: [{ id: req.decoded.$__.scope._id, username: username}],
        status: { code: 1, shortname: "waiting-new-player", description: "Waiting new player…" },
        nextCommands: [{name: "joinGame"}, {name: "cancelGame"}]
      });
      game.save(function (err) {
        //if (err) { throw err; }
        res.json({success: true, game: game});
      });
    });

  });

  // get game
  apiRoutes.get('/game/:id', function (req, res) {
    Game.findById(req.params.id, function (err, game) {
      //if (err) { throw err; }
      res.json(game);
    });
  });

  // update game
  apiRoutes.put('/game/:id', function (req, res) {

    if (req.body.command==null || typeof(req.body.command) == 'undefined')
      return res.status(403).send({ 
        success: false, 
        message: 'Missed command.' 
      });

    var checkCommand = function (game, command) {
      var allowed = false;
      game.nextCommands.forEach(function(allowedCommand) { 
        if (command===allowedCommand.name.toLowerCase()) {allowed = true;}
      });
      if (!allowed) 
        return res.status(403).send({ 
          success: false, 
          message: 'Command non allowed.' 
        });
    };

    // get game
    Game.findById(req.params.id, function (err, game) {
      if (err) 
        return res.status(405).send({ 
          success: false, 
          message: 'Are you lost?' 
        });
      // check if player is not already registered
      var playerAlreadyInGame = false;
      game.players.forEach(function(player) { 
        if (player.id===req.decoded.$__.scope._id) {
          playerAlreadyInGame = true;
        }
      });
      var command = req.body.command.toLowerCase();
      switch (command) {
        case "joingame":
          // check if command is allowed
          checkCommand(game, "joingame");
          // check if player in not already registred in the game
          if (playerAlreadyInGame)
            return res.status(403).send({ 
              success: false, 
              message: 'Player already registered as '+player.username+'.'
            });
          // add player
          Game.update({_id: game._id}, 
            {
              $pushAll: {
                players:[
                  {id: req.decoded.$__.scope._id, username: req.body.username}
                ]
              }
            }, 
            {upsert:true},
            function(err, result) {
              if (err) 
                return res.status(403).send({ 
                  success: false, 
                  message: 'An error occured.' 
                });
              Game.findById(req.params.id, function (err, game) {
                if (err)
                  return res.status(403).send({ 
                    success: false, 
                    message: 'An error occured.' 
                  });
                res.json({success: true, game: game});
              });
            }
          );
          break;
        case "quitgame":
          // check if command is allowed
          checkCommand(game, "cancelgame");
          // check if player in not already registred in the game
          if (!playerAlreadyInGame)
            return res.status(403).send({ 
              success: false, 
              message: 'You are not in this game!'
            });
          // cancel is possible only if the logged user is the alone player in game
          if (game.players.length===1) // if only one player…
            if (game.players[0].id==req.decoded.$__.scope._id) {// …and if he's requester
              // delete game
              //res.redirect("/api/game")
              Game.remove({ _id : game._id }, function (err) {
                if (err)
                  return res.status(403).send({ 
                    success: false, 
                    message: 'Game not deleted: an error occured.' 
                  });
                res.json({
                  success: true,
                  message: 'Game deleted.'
                }); 
              });
            }
            else { // if more than one player
              // check if player is registred in the game
              /*for (var t=1; t<game.players.length; t++) {
                var player = game.players[t];
                if (game.players[t].id==req.decoded.$__.scope._id)
                  game.update(
                    { _id : game._id }, 
                    { $pull: {players : { id : req.decoded.$__.scope._id }} },
                    { safe: true },
                    function (err) {
                      if (err)
                        return res.status(403).send({ 
                          success: false, 
                          message: 'You did not leave the game an error occured.' 
                        });
                      else
                        res.json({
                          success: true,
                          message: 'You left the game.'
                        }); 
                    }
                  );
              }*/
            }
            break;
        default:
          return res.status(403).send({ 
            success: false, 
            message: 'Unknown command.' 
          });
      }
    });
  });

  // delete game
  apiRoutes.delete('/game/:id', function (req, res) {
    Game.remove({ _id : req.params.id }, function (err) {
      if (err)
        return res.status(403).send({ 
          success: false, 
          message: 'Game not deleted.' 
        });
      else
        res.json({
          success: true,
          message: 'Game deleted.'
        }); 
      });
  });

  // --- Users ---

  // get users
  apiRoutes.get('/users', function (req, res) {
    User.find({}, '_id local.username', function(err, users) {
      res.json({success: true, users: users});
    });
  });

  // get user
  apiRoutes.get('/user/:id', function (req, res) {
   User.findById(req.params.id, 'local.username', function (err, user) {
      //if (err) { throw err; };
      res.json(user);
   });
  });

  // delete user TODO: protect
  apiRoutes.delete('/user/:id', function (req, res) {
    User.remove({ _id : req.params.id }, function (err) {
      if (err) 
        return res.status(403).send({ 
          success: false, 
          message: 'User not deleted: an error occured.' 
        });
      res.json({
        success: true,
        message: 'User deleted.'
      }); 
    });
  });

  // update user
  apiRoutes.put('/user/:id', function (req, res) {

    if (!req.body.username)
      return res.status(403).send({ 
        success: false, 
        message: 'Incorrect fieldname.' 
      });

    if (req.params.id != req.decoded.$__.scope._id)
      return res.status(403).send({ 
        success: false, 
        message: 'You have not the right to modify another user.' 
      });

    var next = function() {
      User.update({_id: req.params.id}, {"local.username": req.body.username}, function (err, result) {
        if (err) 
          return res.status(403).send({ 
            success: false, 
            message: 'User not updated: an error occured.' 
          });
        if (result && result.ok===1 && result.n===1 /*&& result.nModified===1*/)
          return res.send({ 
            success: true, 
            message: 'User updated.'
          });
        return res.status(403).send({ 
          success: false, 
          message: 'User not updated: user do not exist or you do not have the right to change the profile of this user'
        });
      });
    }

    User.findOne({"local.username": req.body.username}, function (err, user) {
      if (err)
        return res.status(403).send({ 
          success: false, 
          message: 'User not updated: an error occured.'
        });
      if (user) {
        if (user._id == req.decoded.$__.scope._id)
          return res.status(403).send({ 
            success: false, 
            message: 'User not updated: sended username and saved username are equals.'
          });
        else 
          return res.status(403).send({ 
            success: false, 
            message: 'Username '+req.body.username+' already exists.'
          });
      }
      else next();
    });

  });



  // DEV: get session

  apiRoutes.get('/session/', function (req, res) {
    if (req.session)
      res.json(req.session);

    return res.status(403).send({ 
      success: false, 
      message: 'No session found.' 
    });
  });

  apiRoutes.all('/?*', function (req, res) {
    return res.status(405).send({ 
      success: false, 
      message: 'Are you lost?' 
    });
  });

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);


// routes ======================================================================
require('./app/routes.js')(app, passport, urlencodedParser); // load our routes and pass in our app and fully configured passport


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
