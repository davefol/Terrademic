var express = require('express');
var cookieParser = require('cookie-parser');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
app.use(cookieParser());
var server = http.Server(app);
var io = socketIO(server);app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
	console.log(request.cookies)
});// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
io.on('connection', function(socket) {
});

let players = {};
let numPlayers = 0;
let cities = [
	{
		name: "San Francisco",
		xPos: 109,
		yPos: 234,
		color: "blue",
		neighbors: ["Tokyo", "Manila", "Los Angeles", "Chicago"]
	},
	{
		name: "Chicago",
		xPos: 193.5,
		yPos: 191,
		color: "blue",
		neighbors: ["San Francisco", "Mexico City", "Atlanta", "Montréal"]
	},
	{
		name: "Montréal",
		xPos: 253.5,
		yPos: 201,
		color: "blue",
		neighbors: ["Chicago", "Washington", "New York"]
	},
	{
		name: "New York",
		xPos: 302.5,
		yPos: 218,
		color: "blue",
		neighbors: ["Montréal", "Washington", "London", "Madrid"]
	},
	{
		name: "Atlanta",
		xPos: 188.5,
		yPos: 251,
		color: "blue",
		neighbors: ["Chicago", "Washington", "Miami", ]
	},
	{
		name: "Washington",
		xPos: 290.5,
		yPos: 260,
		color: "blue",
		neighbors: ["New York", "Montréal", "Atlanta", "Miami"]
	},
	{
		name: "London",
		xPos: 442.5,
		yPos: 181,
		color: "blue",
		neighbors: ["Essen", "Paris", "Madrid", "New York"]
	},
	{
		name: "Essen",
		xPos: 525.5,
		yPos: 175,
		color: "blue",
		neighbors: ["London", "Paris", "Milan", "St, Petersburg"]
	},
  {
		name: "Miami",
		xPos: 251.5,
		yPos: 291,
		color: "yellow",
		neighbors: ["Washington", "Atlanta", "Mexico City", "Bogata"]
	},
	{
		name: "St, Petersburg",
		xPos: 652.5,
		yPos: 156,
		color: "blue",
		neighbors: ["Essen", "Istanbul", "Moscow"]
	},
	{
		name: "Los Angeles",
		xPos: 97.5,
		yPos: 309,
		color: "yellow",
		neighbors: ["Sydney", "Mexico City", "Lima", "San Francisco", "Chicago"]
	},
	{
		name: "Mexico City",
		xPos: 166.5,
		yPos: 330,
		color: "yellow",
		neighbors: ["Los Angeles", "Miami", "Chicago", "Bogata", "Lima"]
	},
	{
		name: "Bogata",
		xPos: 229.5,
		yPos: 405,
		color: "yellow",
		neighbors: ["Miami", "Mexico City", "Lima", "Buenos Aires", "São Paulo"]
	}
]


function getName(pickedNames) {
	let adjectives = ["tested", "obsequious", "technical", "steady", "courageous", "quixotic", "sneaky", "gifted"];
	let birds = ["woodpecker", "hummingbird", "cardinal", "goldfinch", "eagle", "grouse", "oriole"];
	let uniqueName = false;
	let newName = ''
	while (!uniqueName) {
		let adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
		let bird = birds[Math.floor(Math.random() * birds.length)]
		newName = adjective + ' ' + bird;
		if (typeof pickedNames.find(name => name === newName) == 'undefined') {
			uniqueName = true;
		}
	}
	return newName;
}



io.on('connection', function(socket) {
	socket.on('new player', function() {
		players[socket.id] = {
			name: getName(Object.entries(players).map(player=>player[1].name)),
			cards: [],
			location: undefined,
			ready_to_start: false,
			player_order: ++numPlayers
		}
		io.to(socket.id).emit('your name is', players[socket.id].name)
		io.to(socket.id).emit('cities', cities);
	});

	socket.on('player ready', function() {
		players[socket.id].ready_to_start = true;
	});

	setInterval(function() {
		io.sockets.emit('players', players);
	}, 1000 / 5);
})
