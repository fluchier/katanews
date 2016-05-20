// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '285529341793726', // your App ID
        'clientSecret'    : 'fafcb6f3bd44b675f8ad32c107ee5960', // your App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'vQ7jzSICQa32QaeRK7BSpM2y0',
        'consumerSecret'     : 'lpPQZHOlEoMHzLsiYNZ2GhPWnjwji962WuyBLtUFzn5vhUSQtT',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : 'AIzaSyCc3ghbBpwiFQrrDnwE0JbSuD8OuILD7gs ',
        'clientSecret'     : 'your-client-secret-here',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
