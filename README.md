# katanews - Katana Web Service

## API


### Authentificate

#### POST /api/authentificate

	email
	password
	
Response:

	200
	{
	  success: true,
	  message: 'Enjoy your token!',
	  token: 'USER_TOKEN'
	}
	
__FOR THE FOLLOW, YOU ALLWAYS NEED YOUR TOKEN__

Else the response will be (403):

	{ 
	  success: false, 
	  message: 'No token provided.' 
	}
	
And if the token is not valide, the response will be (403): 

	{
	  success: false,
	  message: 'Failed to authenticate token.'
	}
	
### Users

#### GET /api/users
	
Response (200):

	[
	  {
	    _id: 'PLAYER_1_ID',
	    local: {
	      username: 'PLAYER_1_USERNAME'
		 }
	  },
	  {
	    _id: 'PLAYER_2_ID',
	    local: {
	      username: 'PLAYER_2_USERNAME'
		 }
	  },
	  {
	    _id: 'PLAYER_3_ID',
	    local: {
	      username: 'PLAYER_3_USERNAME'
		 }
	  }
	]

### User

#### GET /api/user/:id

Response (200):

	{
	  _id: 'PLAYER_ID',
	  local: {
	   username: 'PLAYER_USERNAME'
	  }
	}

#### PUT /api/user/:id

	username

Response (200):

	{ 
	  success: true, 
	  message: 'User updated.'
	}

If the field 'username' is missing, the response will be (403):

	{ 
	  success: false, 
	  message: 'Incorrect fieldname.' 
	}
      
If the username already exists, the response will be (403):

	{
	  success: false,
	  message: 'Username toto already exists.'
	}
	

### Games

#### GET /api/games

Response (200):

	[
	  {
	    _id: 'GAME_1_ID',
	    ...
	  },
	  {
	    _id: 'GAME_2_ID',
	    ...
	  },
	  {
	    _id: 'GAME_3_ID',
	    ...
	  }
	]

### Game

#### POST /api/game

The player who create the game is automatically added !

Response (200):

	{
	  name: 'Les colons de Catane',
	  startDate: '2016-05-20T12:15:10.478Z',
	  _id: 'GAME_ID',
	  options: [],
	  players: [
	    {
	      id: 'PLAYER_1_ID',
	      username: 'toto',
	    }
	  ],
	  nextCommands: [
	    { name: 'addPlayer' },
	    { name: 'cancelGame' }
	  ],
	  status: {
	    code: 1,
	    shortname: 'waiting-new-player',
	    description: 'Waiting new player'
	  }
	}

#### GET /api/game/:id

Response (200):

	{
	  name: 'Les colons de Catane',
	  startDate: '2016-05-20T12:15:10.478Z',
	  _id: 'GAME_ID',
	  options: [],
	  players: [
	    {
	      id: 'PLAYER_1_ID',
	      username: 'toto',
	    },
	    {
	      id: 'PLAYER_2_ID',
	      username: 'toto',
	    }
	  ],
	  nextCommands: [
	    { name: 'addPlayer' },
	    { name: 'quitGame' }
	  ],
	  status: {
	    code: 1,
	    shortname: 'waiting-new-player',
	    description: 'Waiting new player'
	  }
	}

#### PUT /api/game/:id

	command
	
	
##### Cancel game

command = 'cancelGame'

Response (200):

	TODO
	
##### Add player

command = 'addplayer'

Response (200):

	TODO
	
##### Quit game

command = 'quitGame'

Response (200):

	TODO
	
	

#### DELETE /api/game/:id

Response (200):
	
	{
	  success: true,
	  message: 'Game deleted'
	}
