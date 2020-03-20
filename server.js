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
let maxPlayers = 4;

let maxResearchStations = 6;
let numResearchStations = 0;




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
		neighbors: ["London", "Paris", "Milan", "St. Petersburg"]
	},
  {
		name: "Miami",
		xPos: 251.5,
		yPos: 291,
		color: "yellow",
		neighbors: ["Washington", "Atlanta", "Mexico City", "Bogotá"]
	},
	{
		name: "St. Petersburg",
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
		neighbors: ["Los Angeles", "Miami", "Chicago", "Bogotá", "Lima"]
	},
	{
		name: "Bogotá",
		xPos: 229.5,
		yPos: 405,
		color: "yellow",
		neighbors: ["Miami", "Mexico City", "Lima", "Buenos Aires", "São Paulo"]
	},
	{
		name: "Paris",
		xPos: 488,
		yPos: 213,
		color: "blue",
		neighbors: ["Milan", "Essen", "London", "Madrid", "Algiers", "Istanbul"]
	},
	{
		name: "Madrid",
		xPos: 432,
		yPos: 239,
		color: "blue",
		neighbors: ["London", "Paris", "New York", "Algiers", "São Paulo"]
	},
	{
		name:"Milan",
		xPos: 545,
		yPos: 210,
		color: "blue",
		neighbors: ["Essen", "Paris", "Istanbul"]
	},
	{
		name:"Moscow",
		xPos: 611,
		yPos: 204,
		color: "blue",
		neighbors: ["Tehran", "St. Petersburg", "Istanbul"]
	},
	{
		name:"Istanbul",
		xPos: 569,
		yPos: 240,
		color: "black",
		neighbors: ["Milan", "St. Petersburg", "Moscow", "Baghdad", "Cairo", "Algiers"]
	},
	{
		name: "Tehran",
		xPos: 660,
		yPos: 228,
		color: "black",
		neighbors: ["Moscow", "Delhi", "Karachi", "Baghdad"]
	},
	{
		name: "Baghdad",
		xPos: 613,
		yPos: 266,
		color: "black", 
		neighbors: ["Tehran", "Istanbul", "Cairo", "Riyadh"]
	},
	{
		name: "Cairo",
		xPos: 564,
		yPos: 291,
		color: "black",
		neighbors: ["Algiers", "Istanbul", "Baghdad", "Riyadh", "Khartoum"]
	},
	{
		name: "Algiers",
		xPos: 487,
		yPos: 284,
		color: "black",
		neighbors: ["Madrid", "Paris", "Istanbul", "Cairo"]
	},
	{
		name:"Karachi",
		xPos: 688,
		yPos: 293,
		color: "black",
		neighbors: ["Tehran", "Delhi", "Riyadh", "Mumbai"]
	},
	{
		name:"Riyadh",
		xPos: 626,
		yPos: 334,
		color: "black",
		neighbors: ["Cairo", "Baghdad", "Karachi"]
	},
	{
		name:"Delhi",
		xPos: 735,
		yPos: 269,
		color: "black",
		neighbors: ["Tehran", "Karachi", "Kolkata", "Chennai", "Mumbai"]
	},
	{
		name:"Kolkata",
		xPos: 784,
		yPos: 284,
		color: "black",
		neighbors: ["Delhi", "Hong Kong", "Bangkok", "Chennai"]
	},
	{
		name:"Mumbai",
		xPos: 699,
		yPos: 351,
		color:"black",
		neighbors: ["Chennai", "Karachi", "Delhi"]
	},
	{
		name: "Chennai",
		xPos: 747,
		yPos: 368,
		color: "black",
		neighbors: ["Mumbai", "Jakarta", "Kolkata", "Delhi"]
	},
	{
		name:"Hong Kong",
		xPos: 836,
		yPos: 319,
		color: "red",
		neighbors: ["Kolkata", "Shanghai", "Taipei", "Bangkok", "Ho Chi Minh City", "Manila"]
	},
	{
		name:"Shanghai",
		xPos: 821,
		yPos: 268,
		color: "red",
		neighbors: ["Beijing", "Seoul", "Tokyo", "Taipei", "Hong Kong"]
	},
	{
		name:"Beijing",
		xPos: 794,
		yPos: 215,
		color: "red",
		neighbors: ["Shanghai", "Seoul"]
	},
	{
		name: "Seoul",
		xPos: 864,
		yPos: 220,
		color: "red",
		neighbors: ["Beijing", "Tokyo", "Shanghai"]
	},
	{
		name:"Tokyo",
		xPos: 911,
		yPos: 240,
		color:"red",
		neighbors: ["Seoul", "Shanghai", "Osaka", "San Francisco"]
	},
	{
		name:"Osaka",
		xPos: 896,
		yPos: 263,
		color:"red",
		neighbors: ["Tokyo", "Taipei"]
	},
	{
		name:"Taipei",
		xPos: 892,
		yPos: 305,
		color: "red",
		neighbors: ["Shanghai", "Osaka", "Hong Kong", "Manila"]
	},
	{
		name: "Bangkok",
		xPos: 805,
		yPos: 340,
		color: "red",
		neighbors: ["Kolkata", "Hong Kong", "Ho Chi Minh City", "Jakarta"]
	},
	{
		name: "Jakarta",
		xPos: 819,
		yPos: 426,
		color: "red",
		neighbors: ["Chennai", "Bangkok", "Ho Chi Minh City", "Sydney"]
	},
	{
		name: "Ho Chi Minh City",
		xPos: 853,
		yPos: 382,
		color: "red",
		neighbors: ["Hong Kong", "Bangkok", "Jakarta", "Manila"]
	},
	{
		name: "Manila",
		xPos: 936,
		yPos: 384,
		color: "red",
		neighbors: ["Sydney", "San Francisco", "Hong Kong", "Taipei", "Ho Chi Minh City"]
	},
	{
		name: "Sydney",
		xPos: 940,
		yPos: 518,
		color: "red",
		neighbors: ["Los Angeles", "Manila", "Jakarta"]
	},
	{
		name:"Khartoum",
		xPos: 587,
		yPos: 362,
		color: "yellow",
		neighbors: ["Cairo", "Lagos", "Kinshasa", "Johannesburg"]
	},
	{
		name:"Lagos",
		xPos: 475,
		yPos: 369,
		color: "yellow",
		neighbors: ["Khartoum", "São Paulo", "Kinshasa"]
	},
	{
		name:"Kinshasa",
		xPos: 526,
		yPos: 421,
		color: "yellow",
		neighbors: ["Lagos", "Khartoum", "Johannesburg"]
	},
	{
		name:"Johannesburg",
		xPos: 563,
		yPos: 505,
		color: "yellow",
		neighbors: ["Khartoum", "Kinshasa", "Buenos Aires"]
	},
	{
		name:"São Paulo",
		xPos: 342,
		yPos: 473,
		color: "yellow",
		neighbors: ["Madrid", "Lagos", "Bogotá", "Buenos Aires"]
	},
	{
		name:"Buenos Aires",
		xPos: 307,
		yPos: 517,
		color:"yellow",
		neighbors: ["São Paulo", "Bogotá", "Santiago", "Johannesburg"]
	},
	{
		name: "Santiago",
		xPos: 226,
		yPos: 555,
		color:"yellow",
		neighbors: ["Buenos Aires", "Lima"]
	},
	{
		name:"Lima",
		xPos: 206,
		yPos: 468,
		color:"yellow",
		neighbors: ["Los Angeles", "Mexico City", "Bogotá", "Santiago"]
	}	
]

// Set disease counts and research station for each city
cities.forEach(city => {
	city.diseaseCounts = {
		blue: 0,
		yellow: 0,
		red: 0,
		black: 0
	};
	city.researchStationState = "not built";
})

placeResearchStation("Atlanta");


function placeResearchStation (cityName) {
	cityIndex = cities.findIndex(city => city.name === cityName);
	if (numResearchStations > maxResearchStations) {
		return {result: "failure", reason: "Research Station limit reached"}
	}

	if (cities[cityIndex].researchStationState === "built") {
		return {result: "failure", reason: "Research station already built"}
	}

	cities[cityIndex].researchStationState = "built";
	numResearchStations++;
	return {result: "success", reason: ""}
}


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

let pickedRoles = [];
function getRole() {
	let roles = [
		{
			name: "Medic",
			description: "Remove all cubes of a single color when you treat a city.\n-Administer known cures for free."
		},
		{
			name: "Researcher",
			description: "You may give a player cards from your hand for 1 action per card.\nBoth of your pawns must be in the same city, but it doesn't matter which city you are in."
		},
		{
			name: "Scientist",
			description: "You only need 4 cards of the same color to discover a cure."
		},
		{
			name: "Dispatcher",
			description: "Move your fellow players' pawns on your turn as if they were your own.\nMove any pawn to another city containing a pawn for 1 action."
		},
		{
			name: "Operations Expert",
			description: "You may build a Research Station in your current city for one action.\nCan move from a station to any city by discarding a card."
		},
		{
			name: "Quarantine Specialist",
			description: "Prevents placement of cubes, and outbreaks in her city and neighboring ones."
		},
		{
			name: "Contingency Planner",
			description: "Can take and re-use (once) discarded events."
		}
	]
	let uniqueRole = false;
	let newRole = undefined
	while (!uniqueRole) {
		newRole = roles[Math.floor(Math.random() * roles.length)];
		console.log(pickedRoles);
		if (typeof pickedRoles.find(role => role.name == newRole.name) == 'undefined') {
			uniqueRole = true;
		}
	}
	pickedRoles.push(newRole);
	return newRole;
}

let pickedPawns = []
function getPawn() {
	let pawnColors = ["WhiteSmoke","SkyBlue","Orange","SpringGreen","SeaGreen", "Brown", "Pink"]
	let newPawn = undefined;
	let uniquePawn = false;
	while(!uniquePawn) {
		newPawn = pawnColors[Math.floor(Math.random() * pawnColors.length)];
		if (typeof pickedPawns.find(pawn => pawn === newPawn) == 'undefined') {
			uniquePawn = true;
		}
	}
	pickedPawns.push(newPawn);
	return newPawn;
}

function addNewPlayer(socket) {
	if (numPlayers >= maxPlayers) {
		io.to(socket.id).emit('you are a spectator');
		io.to(socket.id).emit('cities', cities);
		return;
	}

	players[socket.id] = {
		name: getName(Object.entries(players).map(player=>player[1].name)),
		cards: [],
		location: "Atlanta",
		readyToStart: false,
		player_order: ++numPlayers,
		role: getRole(),
		pawn: getPawn()
	}


	io.to(socket.id).emit('your name is', players[socket.id].name)
	io.to(socket.id).emit('cities', cities);
}



io.on('connection', function(socket) {
	socket.on('new player', () => addNewPlayer(socket));
	
	socket.on('player ready', function() {
		players[socket.id].ready_to_start = true;
	});

	setInterval(function() {
		io.sockets.emit('players', players);
	}, 1000 / 5);
})
