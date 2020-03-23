if (!Array.prototype.flat)
{
    Object.defineProperty(Array.prototype, 'flat',
    {
        value: function(depth = 1, stack = [])
        {
            for (let item of this)
            {
                if (item instanceof Array && depth > 0)
                {
                    item.flat(depth - 1, stack);
                }
                else {
                    stack.push(item);
                }
            }

            return stack;
        }
    });
}

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

function newPlayer(name, socket) {
	// Returning players get the socket id changed to their new socket id
	let returningPlayer = false;

	Object.entries(players).forEach(([playerSocketId, player]) => {
		if (player.name === name) {
			Object.defineProperty(players, socket.id, Object.getOwnPropertyDescriptor(players, playerSocketId));
			delete players[playerSocketId];
			io.to(socket.id).emit('your name is', players[socket.id].name);
			io.to(socket.id).emit('cities', cities);
			returningPlayer = true;
		}
	})

	// After maxPlayers have joined make new players spectators
	if (!returningPlayer) {
		if (numPlayers >= maxPlayers) {
			io.to(socket.id).emit('you are a spectator');
		} else {
			// Otherwise create a new player
			players[socket.id] = {
				name: name,
				cards: [],
				location: "Atlanta",
				readyToStart: false,
				playerOrder: numPlayers++,
				role: getRole(),
				pawn: getPawn(),
				actionPoints: 0
			}
			io.to(socket.id).emit('your name is', players[socket.id].name)
			io.to(socket.id).emit('cities', cities);
		}
	}
}



function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}


function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

function chunkify(a, n, balanced) {
	if (n < 2)
		return [a];
	var len = a.length, out = [], i = 0, size;
	if (len % n === 0) {
		size = Math.floor(len / n);
		while (i < len) {
			out.push(a.slice(i, i += size));
		}
	}
	else if (balanced) {
		while (i < len) {
			size = Math.ceil((len - i) / n--);
			out.push(a.slice(i, i += size));
		}
	}
	else {
		n--;
		size = Math.floor(len / n);
		if (len % size === 0)
			size--;
		while (i < size * n) {
			out.push(a.slice(i, i += size));
		}
		out.push(a.slice(size * n));
	}
	return out;
}


function startGame(socket) {
	let TURN, OUTBREAKS, DISEASES, PLAYER_DECK, INFECTION_DECK, INFECTION_RATE, INFECTION_RATE_RACK, INFECTION_DISCARD_PILE;
	let PLAYER_DISCARD_PILE;

	init();
	game(socket);

	socket.emit("turn", TURN);
	socket.emit("outbreaks", OUTBREAKS);
	socket.emit("diseases", DISEASES);

	function game(socket) {
		socket.on("action", action => executeAction(socket, action));
	}

	function executeAction(socket, action) {
		if (players[socket.id].name === TURN.player) {
			switch(action.type) {
				case 'drive/ferry':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else if (cities.find(city => city.name === players[socket.id].location).neighbors.includes(action.city)) {
						players[socket.id].location = action.city;
						players[socket.id].actionPoints--;
						socket.emit('info', {from:'server', message:`${players[socket.id].name} moved to ${action.city}.`});
					}
					break;
					
				case 'direct flight':
					if (players[socket.id].actionPoints <= 0) {
						socket.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else if (!players[socket.id].cards.map(card => card.name).includes(action.city)) {
						socket.to(socket.id).emit('result', {
							success:false, 
							reason: 'You do not have a city card that matches the city you are in'});
					} else {
						players[socket.id].location = action.location;
						players[socket.id].cards.splice(players[socket.id].cards.findIndex(action.card), 1);
						players[socket.id].actionPoints--;
					}
					break;

				case 'charter flight':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else if (players[socket.id].location === action.card) {
						players[socket.id].location = action.location;
						players[socket.id].actionPoints--;
					}
					break;

				case 'shuttle flight':
					let playerAtStation = cities.find(city => city.name === players[socket.id].location).researchStationState === 'built';
					let destinationHasStation = cities.find(city => city.name === action.city).researchStationState === 'built';
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
						break;
					} else if (!playerAtStation) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'No research station at your location.'});
						break;
					} else if (!destinationHasStation) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'No research station at your destination'});
						break;
					} else {
						players[socket.id].location = action.city;
						players[socket.id].actionPoints--;
						break;
					}

				case 'build research station':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else {
						if (action.removeFromCity) {
							if (cities.find(city => city.name === action.city).researchStationState !== 'built') {
								io.sockets.to(socket.id).emit('result', {
									success: false, 
									reason: 'Cannot move reasearch station from a city that does not have a research station.'});
							} else {
								cities.find(city => city.name === action.removeFromCity).researchStationState = 'not built'
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
							}
						} else {
							if (numResearchStations >= maxResearchStations) {
								io.sockets.to(socket.id).emit('result', {
									success: false, 
									reason: 'Max 6 research stations allowed on the board at one time. You can move research stations however.'});
							} else {
								numResearchStations++;
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
							}
						}
					}
					break;

				case 'treat disease':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else {
						if (DISEASES[action.disease].cured) {
							cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.disease] = 0;
							players[socket.id].actionPoints--;
						} else {
							cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.disease]--;
							players[socket.id].actionPoints--;
						}
					}
					break;

				case 'give city card':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else {
						let cardIndex = players[socket.id].cards.findIndex(card => card.name === players[socket.id].location);
						let card = players[socket.id].cards.splice(cardIndex, 1)[0];
						Object.values(players).find(player => player.name === action.otherPlayer).cards.push(card);
						players[socket.id].actionPoints--;
						if (Object.values(players).find(player => player.name === action.otherPlayer).cards.length > 7) {
							let otherPlayerSocket = Object.keys(players).find(key => players[key].name === action.otherPlayer);
							io.sockets.to(otherPlayerSocket).emit('force discard card');
							io.socket.emit('pause', {playersNotIncluded: [players[otherPlayersSocket].name]});
							let cardDiscarded = false;
							socket.once('forced card discarded', function(discardedCard) {
								players[otherPlayersSocket].cards.splice(
									players[otherPlayersSocket].findIndex(pCard => pCard.name === discardedCard)
									,1);
								cardDiscarded = true;
							});
							while (!cardDiscarded) {}
							io.socket.emit('unpause');
						}
					}
					break;

				case 'take city card':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
						return;
					} else {
						let otherPlayerSocket = Object.keys(players).find(key => players[key].name === action.otherPlayer);
						let cardIndex = players[otherPlayerSocket].cards.findIndex(card => card.name === players[socket.id].location);
						let card = players[otherPlayersSocket].cards.splice(cardIndex, 1)[0];
						players[socket.id].push(card);
						players[socket.id].actionPoints--;
						if (players[socket.id].cards.length > 7) {
							io.sockets.to(socket.id).emit('force discard card');
							io.socket.emit('pause', {playersNotIncluded: [players[socket.id].name]});
							let cardDiscarded = false;
							socket.once('force card discarded', function(discardedCard) {
								players[socket.id].cards.splice(
									players[socket.id].findIndex(pCard => pCard.name === discardedCard)
									,1);
								cardDiscarded = true;
							});
							while (!cardDiscarded) {}
							io.socket.emit('unpause');
						}
					}
					break;

				case 'discover cure':
					if (players[socket.id].actionPoints <= 0) {
						io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
					} else if (cities.find(city => city.name === players[socket.id].location).researchStationState === 'not built') {
						io.sockets.to(socket.id).emit('response', {success: false, reason: "Not in a city with a research station."});
					} else {
						DISEASES[cities.find(city => city.name === players[socket.id].location).color].cured = true;
						players[socket.id].actionPoints--;
					}
					break;

			}
		} else {
			io.sockets.to(socket.id).emit('result', {success: false, reason: 'It is not your turn.'});
		}

		if (players[socket.id].actionPoints <= 0) {
			drawCard(players[socket.id]);
			drawCard(players[socket.id]);

			//infect cities
			TURN.N++;
			TURN.player = Object.entries(players).find(([socketId, player])=>player.playerOrder === 0)[1].name;
		}
	}



	function init() {
		PLAYER_DECK = [];
		INFECTION_DECK = []
		INFECTION_RATE = 0;
		INFECTION_RATE_RACK = [2, 2, 2, 3, 3, 4, 4]
		INFECTION_DISCARD_PILE = [];
		PLAYER_DISCARD_PILE = [];
		TURN = {
			N: 0,
			player: Object.entries(players).find(([socketId, player])=>player.playerOrder === 0)[1].name
		};
		players[Object.keys(players).find(key=>players[key].name === TURN.player)].actionPoints = 4;
		OUTBREAKS = 0;
		DISEASES = {
			blue: {
				cured: false
			},
			yellow: {
				cured: false
			},
			red: {
				cured: false
			},
			black: {
				cured: false
			}
		}
		
		console.log('Shuffling deck.');
		newDeck();

		console.log('Drawing player cards.');
		// Draw player cards
		for (let player of Object.values(players)) {
			let cardsToDraw = {2: 4, 3: 3, 4: 2};
			Array.from(Array(cardsToDraw[numPlayers])).forEach(() => drawCard(player));
		}

		console.log("Adding epidemic cards to deck.");
		let chunkedDeck = chunkify(PLAYER_DECK, 4, true);
		chunkedDeck.forEach(deck => {deck.splice(randomInt(0, deck.length - 1, 0, {
			name: "Epidemic", 
			type: "Epidemic",
			description: "Increase infection rate.\nDraw bottom card from infection deck, put 3 cubes on that city and discard.\nShuffle infection discard pile and place on top of infection deck.",
		}))});
		PLAYER_DECK = Array.prototype.flat(chunkedDeck);

				
		
		function draw3Infect(amountToInfect) {
			let first3InfectedCities = Array.from(Array(3)).map(() => INFECTION_DECK.shift());
			first3InfectedCities.forEach(infectionCard => {
				let city = cities.find(city => city.name === infectionCard.name);
				city.diseaseCounts[city.color] += amountToInfect;
				console.log(`city: ${city.name} ${amountToInfect} new infections.`);
			})
			Array.prototype.push.apply(INFECTION_DISCARD_PILE, first3InfectedCities);
		}

		console.log("Infecting initial cities.");
		[3,2,1].forEach(N => draw3Infect(N));
	}

	function newDeck() {
		PLAYER_DECK = [
			{
				name: "Airlift",
				description: "Move a pawn to any city. You must have the player's permission.",
				type: "event",
			},
			{
				name: "One quiet night",
				description: "Skip the next infection phase.",
				type: "event"
			},
			{
				name: "Forecast",
				description: "Rearange the top 6 cards in the infection pile.",
				type: "event"
			},
			{
				name: "Government Grant",
				description: "Add a research station to any city for free.",
				type: "event"
			},
			{
				name: "Resilient Population",
				description: "Take a card from the infection discard pile and remove it from the game."
			}
		];
		cities.forEach(city => {
			PLAYER_DECK.push({
				type: 'city',
				name: city.name,
				color: city.color
			});
			INFECTION_DECK.push({
				name: city.name,
				color: city.color
			})
		});

		shuffle(PLAYER_DECK);
		shuffle(INFECTION_DECK) 
	}

	function drawCard(player) {
		player.cards.push(PLAYER_DECK.shift());
	}
}

io.on('connection', function(socket) {
	socket.on('new player', (name) => newPlayer(name, socket));
	
	socket.on('player ready', function() {
		players[socket.id].readyToStart = true;
		io.sockets.emit('players', players);
		
		let allReadyToStart = Object.values(players).map(player => player.readyToStart).every(ready=>ready === true);
		if (allReadyToStart) {
			startGame(socket);
		}

	});

	setInterval(function() {
		io.sockets.emit('players', players);
		io.sockets.emit('cities', cities);
	}, 1000 / 5);
})
