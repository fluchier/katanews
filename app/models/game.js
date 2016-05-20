// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var gameSchema = mongoose.Schema({

    name        : String,
    status      : { code: Number, shortname: String, description: String },
    nextCommands: [{ name: String }],
    startDate   : Date,
    creator  	: String,
    players     : [{ id: String, username: String }],
    options     : [{ key: String, value: String }]

});

// create the model for games and expose it to our app
module.exports = mongoose.model('Game', gameSchema);



/* 
# Status

- 0 - created
- 1 - waiting-new-player

*/