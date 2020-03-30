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

let MESSAGE_LOG = [];

let MAX_DISEASE_COUNT = 24;
let MAX_OUTBREAKS = 8;
let TURN, OUTBREAKS, DISEASES, PLAYER_DECK, INFECTION_DECK, INFECTION_RATE, INFECTION_RATE_RACK, INFECTION_DISCARD_PILE;
let PLAYER_DISCARD_PILE, GAME_PAUSED, PAUSE_OBJECT, PLAYER_DISCARDING;
let SKIP_INFECTION_PHASE = false;

let players = {};
let numPlayers = 0;
let maxPlayers = 4;

let maxResearchStations = 6;
let numResearchStations = 0;

INFECTION_RATE_RACK = [2, 2, 2, 3, 3, 4, 4]
INFECTION_RATE = 0;

let pickedPawns = []
let pickedRoles = [];

let tickInterval = setInterval(function() {
	io.sockets.emit('players', players);
	io.sockets.emit('cities', cities);
}, 1000 / 5);

let GAME_STARTED = false;

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

function info(message, socket=null) {
	if (socket) {
		socket.emit('info', {from: 'server', message: message});
	} else {
		io.sockets.emit('info', {from:'server', message: message});
		MESSAGE_LOG.push({from: 'server', message: message})
		console.log(message);
	}
}

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

function getRole() {
	let roles = [
		{
			name: "Medic",
			description: "Remove all cubes of a single color when you treat a city.\nAdminister known cures for free."
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
		if (numPlayers >= maxPlayers && GAME_STARTED === true) {
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
				actionPoints: 0,
				contingencyCard: null
			}
			io.to(socket.id).emit('your name is', players[socket.id].name)
			io.to(socket.id).emit('cities', cities);
		}
	}
	if (GAME_STARTED) {
		io.sockets.emit('game started');
	}
	if (GAME_PAUSED) {
		socket.emit('paused', PAUSED_OBJECT);
	}
	if (PLAYER_DISCARDING === name) {
		socket.emit('force discard card');
	}
	if (TURN) {
		socket.emit('turn', TURN);
	}
	if (OUTBREAKS) {
		socket.emit('outbreaks', OUTBREAKS);
	}
	if (DISEASES) {
		socket.emit('diseases', DISEASES);
	}
	if (INFECTION_RATE_RACK) {
		socket.emit('infection rate', INFECTION_RATE_RACK[INFECTION_RATE])
	}
	if (PLAYER_DECK) {
		socket.emit('player deck N', PLAYER_DECK.length);
	}
	for (let message of MESSAGE_LOG) {
		info(message.message, socket);
	}
	if (INFECTION_DISCARD_PILE) {
		socket.emit('infection discard pile', INFECTION_DISCARD_PILE);
	}
	if (PLAYER_DISCARD_PILE) {
		socket.emit('player discard pile', PLAYER_DISCARD_PILE);
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

function chunkify(a, n) {
    if (n < 2)
        return [a];
    var len = a.length,
            out = [],
            i = 0,
            size;
		while (i < len) {
				size = Math.ceil((len - i) / n--);
				out.push(a.slice(i, i += size));
		}
    return out;
}

function startGame(socket) {
	GAME_STARTED = true;
	socket.emit('game started');

	init();

	socket.emit("turn", TURN);
	socket.emit("outbreaks", OUTBREAKS);
	socket.emit("diseases", DISEASES);
	socket.emit('infection rate', INFECTION_RATE_RACK[INFECTION_RATE]);

	function init() {
		PLAYER_DECK = [];
		INFECTION_DECK = []
		INFECTION_RATE = 0;
		INFECTION_DISCARD_PILE = [];
		io.sockets.emit('infection discard pile', INFECTION_DISCARD_PILE);
		PLAYER_DISCARD_PILE = [];
		io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
		GAME_PAUSED = false;
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
		
		info('Shuffling deck.');
		newDeck();

		info('Drawing player cards.');
		// Draw player cards
		for (let player of Object.values(players)) {
			let cardsToDraw = {2: 4, 3: 3, 4: 2};
			Array.from(Array(cardsToDraw[numPlayers])).forEach(() => drawCard(player));
		}

		info('Adding epidemic cards to deck.');
		let chunkedDeck = chunkify(PLAYER_DECK, 4);

		chunkedDeck.forEach(deck => {deck.splice(randomInt(0, deck.length - 1), 0, {
			name: "Epidemic", 
			type: "Epidemic",
			description: "Increase infection rate.\nDraw bottom card from infection deck, put 3 cubes on that city and discard.\nShuffle infection discard pile and place on top of infection deck.",
		})});
		PLAYER_DECK = chunkedDeck.flat();

				
		
		function draw3Infect(amountToInfect) {
			let first3InfectedCities = Array.from(Array(3)).map(() => INFECTION_DECK.shift());
			first3InfectedCities.forEach(infectionCard => {
				let city = cities.find(city => city.name === infectionCard.name);
				city.diseaseCounts[city.color] += amountToInfect;
				info(`city: ${city.name} ${amountToInfect} new infections.`);
			})
			Array.prototype.push.apply(INFECTION_DISCARD_PILE, first3InfectedCities);
			io.sockets.emit('infection discard pile', INFECTION_DISCARD_PILE);
		}

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

}

function executeEventCard(socket, data) {
	let hasAirlift = players[socket.id].cards.map(card=>card.name).includes('Airlift');
	let hasAirliftCont = players[socket.id].contingencyCard === 'Airlift';
	let hasQuiet = players[socket.id].cards.map(card=>card.name).includes('One quiet night');
	let hasQuietCont = players[socket.id].contingencyCard === 'One quiet night';
	let hasForecast = players[socket.id].cards.map(card=>card.name).includes('Forecast');
	let hasForecastCont = players[socket.id].contingencyCard === 'Forecast';
	let hasGrant = players[socket.id].cards.map(card=>card.name).includes('Government Grant');
	let hasGrantCont = players[socket.id].contingencyCard === 'Government Grant';
	let hasPopulation = players[socket.id].cards.map(card=>card.name).includes('Resilient Population');
	let hasPopulationCont = players[socket.id].contingencyCard === 'Resilient Population';

	switch(data.name) {
		case 'Airlift':
			if (hasAirlift || hasAirliftCont) {
				Object.values(players).find(player=>player.name===data.target).location = data.city;
				medicLocationCheck(Object.values(players).find(player=>player.name===data.target));
				 
				if (hasAirlift) {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === 'Airlift');
					PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(cardIndex,1)[0]);
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
				} else {
					players[socket.id].contingencyCard = null;	
				}

				info(`${players[socket.id].name} airlifted ${data.target} to ${data.city}.`);
				socket.emit('airlift succesful');
			} else {
				info('You do not have the Airlift card.', socket)
			}
			break;
		case 'One quiet night':
			if (hasQuiet || hasQuietCont) {
				SKIP_INFECTION_PHASE = true;	
				if (hasQuiet) {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === 'One quiet night');
					PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(cardIndex,1)[0]);
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
				} else {
					players[socket.id].contingencyCard = null;	
				}
				info(`${players[socket.id].name} used the "One quiet night" card, skipping the next infection phase.`);
			} else {
				info('You do not have the One quiet night card.', socket)
			}
			break;
		case 'Forecast':
			if (hasForecast || hasForecastCont) {
				INFECTION_DECK = data.cards.concat(INFECTION_DECK.slice(start=6));

				if (hasForecast) {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === 'Forecast');
					PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(cardIndex,1)[0]);
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
				} else {
					players[socket.id].contingencyCard = null;	
				}

				info(`${players[socket.id].name} rearranged the top 6 cards of the infection deck to be: ${data.cards.map(card=>card.name).toString()}.`);
			} else {
				info('You do not have the Forecast card.', socket)
			}
			break;
		case 'Goveplayers[socket.id].cards.splice(cardIndex,1);rnment Grant':
			//TODO: Government Grant
			if (cities.find(city=>city.name===data.target).researchStationState === 'built') {
				info(`${data.city} already has a research station in it.`, socket);
			} 
			else if (hasGrant || hasGrantCont) {
				cities.find(city=>city.name===data.target).researchStationState = 'built';
				info(`${players[socket.id].name} build a research station in ${data.target}.`);
				if (data.fromCity) {
					cities.find(city=>city.name===data.fromCity).researchStationState = 'not built';
					info(`${players[socket.id].name} removed a research station from ${data.fromCity}`);
				}
				if (hasGrant) {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === 'Government Grant');
					PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(cardIndex,1));
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE)[0];
				} else {
					players[socket.id].contingencyCard = null;	
				}
			} else {
				info('You do not have the Government Grant card.', socket);
			}
			
			break;
		case 'Resilient Population':
			//TODO: Resilient Population
			if (hasPopulation || hasPopulationCont) {
				INFECTION_DISCARD_PILE.splice(INFECTION_DISCARD_PILE.findIndex(card=>card.name===data.card), 1);
				info(`${players[socket.id].name} removed the infection card ${data.card} from the game.`);

				if (hasPopulation) {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === 'Resilient Population');
					PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(cardIndex, 1)[0]);
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
				} else {
					players[socket.id].contingencyCard = null;	
				}
			} else {
				info('You do not have the Resilient Population card.', socket);
			}
			break;
	}
}

function medicLocationCheck(player) {
	let isMedic = player.role.name === "Medic";
	if (isMedic) {
		for (let [color, value] of Object.entries(DISEASES)){
			if (value.cured) {
				cities.find(city=>city.name === player.location).diseaseCounts[color] = 0;
				info(`${player.name} wiped out ${color} disease in ${player.location}.`);
			}
		}
	}

}

function executeAction(socket, action) {
	if (!GAME_STARTED) {
		return;
	}
	if (players[socket.id].name === TURN.player) {
		let isMedic = players[socket.id].role.name === "Medic";
		let isScientist = players[socket.id].role.name === "Scientist";
		switch(action.type) {
			case 'drive/ferry':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points.', socket);
				} else if (!cities.find(city => city.name === players[socket.id].location).neighbors.includes(action.city)) {
					info(`You cannot drive/ferry to this city (not an adjacent city).`, socket);
				} else {
					players[socket.id].location = action.city;
					medicLocationCheck(players[socket.id]);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} drove/ferried to ${action.city}.`);
				}
				break;
				
			case 'direct flight':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points.', socket);
				} else if (!players[socket.id].cards.map(card => card.name).includes(action.city)) {
					info('You do not have a city card that matches the city you want to fly to.', socket);
				} else {
					players[socket.id].location = action.city;
					medicLocationCheck(players[socket.id]);
					players[socket.id].cards.splice(players[socket.id].cards.findIndex(card => card.name === action.city), 1);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} took a direct flight to ${action.city}.`)
				}
				break;

			case 'charter flight':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points.', socket);
				} else if (!players[socket.id].cards.map(card => card.name).includes(players[socket.id].location)){
					info(`You do not have the card that matches the city you are in.`, socket);
				} else {
					players[socket.id].location = action.city;
					medicLocationCheck(players[socket.id]);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} chartered a flight to ${action.location}`);
				}
				break;

			case 'shuttle flight':
				let playerAtStation = cities.find(city => city.name === players[socket.id].location).researchStationState === 'built';
				let destinationHasStation = cities.find(city => city.name === action.city).researchStationState === 'built';
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points.', socket);
				} else if (!playerAtStation) {
					info('No research station at your location.', socket);
				} else if (!destinationHasStation) {
					info('No research station at the destination.', socket);
				} else {
					players[socket.id].location = action.city;
					medicLocationCheck(players[socket.id]);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} took a shuttle flight to ${action.city}.`)
				}
				break;

			case 'operations expert shuttle':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points.', socket);
				} else if (!playerAtStation) {
					info('No research station at your location.', socket);
				} else {
					let cardIndex = players[socket.id].cards.findIndex(card=>card.name===action.card);
					players[socket.id].cards.splice(cardIndex, 1);
					players[socket.id].location = action.city;
					medicLocationCheck(players[socket.id]);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} took a shuttle flight to ${action.city}.`)
				}
				break;

			case 'build research station':
				if (players[socket.id].actionPoints <= 0) {
					io.sockets.to(socket.id).emit('result', {success: false, reason: 'Not enough action points.'});
				} else if (players[socket.id].location !== action.city) {
				info('You must be in a city to build a research station in it',socket);
				} else {
					if (action.removeFromCity) {
						if (cities.find(city => city.name === action.city).researchStationState !== 'built') {
							info('Cannot move research station from a city that does not have a research station.', socket);
						} else {
							let cityCard = players[socket.id].cards.findIndex(card=>card.name===action.city);
							if (players[socket.id].role.name==="Operations Expert") {
								cities.find(city => city.name === action.removeFromCity).researchStationState = 'not built'
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
							} else if (typeof cityCard !== 'undefined') {
								cities.find(city => city.name === action.removeFromCity).researchStationState = 'not built'
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
								players[socket.id].cards.splice(cityCard, 1);
							} else {
								info('You must have the card that matches the city you are in to build a research station there.', socket);
							}
						}
					} else {
						if (numResearchStations >= maxResearchStations) {
							info('Max 6 research stations allowed. You can move a research station however', socket);
						} else {
							let cityCard = players[socket.id].cards.findIndex(card=>card.name===action.city);
							if (players[socket.id].role.name==="Operations Expert") {
								numResearchStations++;
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
							}  else if (typeof cityCard !== 'undefined') {
								numResearchStations++;
								cities.find(city => city.name === action.city).researchStationState = 'built';
								players[socket.id].actionPoints--;
								players[socket.id].cards.splice(cityCard, 1);
							} else {
								info('You must have the card that matches the city you are in to build a research station there.', socket);
							}
						}
					}
				}
				break;

			case 'treat disease':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else {
					if (DISEASES[action.color].cured) {
						cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.color] = 0;
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} treated ${action.color} disease in ${players[socket.id].location}.`);
					} else if (cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.color] <= 0) {
						info(`The city you are in has no ${action.color} diseases.`);
					} else {
						if (isMedic) {
							cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.color] = 0;
						} else {
							cities.find(city => city.name === players[socket.id].location).diseaseCounts[action.color]--;
						}
						players[socket.id].actionPoints--;
					}
				}
				break;

			case 'give city card':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else if (players[socket.id].location !== Object.values(players).find(player=>player.name===action.otherPlayer).location) {
					info('You must be in the same city as the other player to give a card.', socket);
				} else {
					let cardIndex = players[socket.id].cards.findIndex(card => card.name === players[socket.id].location);
					if (typeof cardIndex === 'undefined') {
						info('You must have the card that matches the city you are in to share it.', socket);
					} else {
						let card = players[socket.id].cards.splice(cardIndex, 1)[0];
						Object.values(players).find(player => player.name === action.otherPlayer).cards.push(card);
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} gave the card ${card.name} to ${action.otherPlayer}`);
						if (Object.values(players).find(player => player.name === action.otherPlayer).cards.length > 7) {
							let otherPlayerSocketID = Object.keys(players).find(key=> players[key].name === action.otherPlayer);
							forceDiscardCard(otherPlayerSocketID);
						}
					}
				}
				break;

			case 'take city card':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else if (players[socket.id].location !== Object.values(players).find(player=>player.name===action.otherPlayer).location) {
					info('You must be in the same city as the other player to take a card.', socket);
				} else {
					let otherPlayersSocket = Object.keys(players).find(key => players[key].name === action.otherPlayer);
					let cardIndex = players[otherPlayersSocket].cards.findIndex(card => card.name === players[socket.id].location);
					if (typeof cardIndex === 'undefined') {
						info('The other player must have the card that matches the city you are in to take it.', socket);
					} else {
						let card = players[otherPlayersSocket].cards.splice(cardIndex, 1)[0];
						players[socket.id].cards.push(card);
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} took the card ${card.name} from ${action.otherPlayer}`);
						if (players[socket.id].cards.length > 7) {
							forceDiscardCard(socket.id);
						}
					}
				}
				break;

			case 'discover cure':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else if (cities.find(city => city.name === players[socket.id].location).researchStationState === 'not built') {
					info('You are not in a city with a research station.', socket);
				} else if (!((action.cards.length == isScientist ? 4 : 5) && action.cards.every(card=>card.color === action.color))) {
					info('You must select 5 cards of the same color in order to discover a cure, 4 if a scientist.', socket);
				} else if (DISEASES[action.color].cured === true) {
					info('This disease has already been cured.');
				} else {
					for (let card of action.cards) {
						let cardIndex = players[socket.id].cards.findIndex(pCard=> pCard.name === card.name);
						players[socket.id].cards.splice(cardIndex, 1);
					}
					DISEASES[action.color].cured = true;
					players[socket.id].actionPoints--;
					io.sockets.emit('diseases', DISEASES);
					info(`${players[socket.id].name} discovered a cure for the ${action.color} disease.`);
				}
				break;

			case 'researcher special action give':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else if (players[socket.id].location !== Object.values(players).find(player=>player.name===action.otherPlayer).location) {
					info('You must be in the same city as the other player to give a card.', socket);
				} else {
					let otherPlayer = Object.values(players).find(player=>player.name===action.otherPlayer);
					let cardIndex = players[socket.id].cards.findIndex(card=>card.name===action.card);
					let card = players[socket.id].cards.splice(cardIndex, 1)[0];
					otherPlayer.cards.push(card);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} gave the card ${card.name} to ${action.otherPlayer}`);
					let otherPlayerSocketID = Object.keys(players).find(key=> players[key].name === action.otherPlayer);
					if (otherPlayer.cards.length > 7) {
						forceDiscardCard(otherPlayerSocketID);
					}
				}
				break;

			case 'researcher special action take':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else if (players[socket.id].location !== Object.values(players).find(player=>player.name===action.otherPlayer).location) {
					info('You must be in the same city as the other player to take a card.', socket);
				} else {
					let otherPlayer = Object.values(players).find(player=>player.name===action.otherPlayer);
					let cardIndex = otherPlayer.cards.findIndex(card=>card.name===action.card);
					let card = otherPlayer.cards.splice(cardIndex, 1)[0];
					players[socket.id].cards.push(card);
					players[socket.id].actionPoints--;
					info(`${players[socket.id].name} took the card ${card.name} from ${action.otherPlayer}`);
					if (players[socket.id].cards.length > 7) {
						forceDiscardCard(socket.id);
					}
				}
				break;

			case 'dispatcher special action':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else {
					//{
					//	fromPlayer,
					//	toLocation,
					//	card: optional
					//}
					let fromPlayer = Object.values(players).find(player=>player.name===action.fromPlayer);
					let fromLocation = fromPlayer.location;
					let fromNeighbors = cities.find(city=>city.name===fromLocation).neighbors;
					let fromHasResearchStation = cities.find(city=>city.name===fromLocation).researchStationState === 'built';
					let toHasResearchStation = cities.find(city=>city.name===action.toLocation).researchStationState === 'built';
					let toLocationHasOtherPlayer = typeof Object.values(players).find(player=>player.location===action.toLocation) !== 'undefined';
					if (toLocationHasOtherPlayer) {
						fromPlayer.location = toLocation;
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} dispatched ${fromPlayer.name} to ${action.toLocation}.`);
					} else if (fromNeighbors.includes(action.toLocation)) {
						//TODO: drive/ferry
						fromPlayer.location = action.toLocation;	
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} dispatched ${fromPlayer.name} to ${action.toLocation}.`);
					} else if (action.card !== fromLocation) {
						//TODO: direct flight (discard card and go to location)
						let cardIndex = players[socket.id].cards.findIndex(card=>card.name===action.card);
						players[socket.id].cards.splice(cardIndex,1);
						fromPlayer.location = action.toLocation;
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} dispatched ${fromPlayer.name} to ${action.toLocation}.`);

					} else if (action.card === fromLocation) {
						//TODO: charter flight (discard card and go to any location)
						let cardIndex = players[socket.id].cards.findIndex(card=>card.name===action.card);
						players[socket.id].cards.splice(cardIndex,1);
						fromPlayer.location = action.toLocation;
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} dispatched ${fromPlayer.name} to ${action.toLocation}.`);
					} else if (fromHasResearchStation && toHasResearchStation) {
						//TODO: shuttle flight (go from research station to research station)
						fromPlayer.location = action.toLocation;
						players[socket.id].actionPoints--;
						info(`${players[socket.id].name} dispatched ${fromPlayer.name} to ${action.toLocation}.`);
					} else {
						info(`No valid movement`, socket);
					}
				}
				break;

			case 'contingency special action':
				if (players[socket.id].actionPoints <= 0) {
					info('Not enough action points', socket);
				} else {
					cardIndex = PLAYER_DISCARD_PILE.findIndex(card=>card.name===action.card);
					players[socket.id].contingencyCard = PLAYER_DISCARD_PILE.splice(cardIndex, 1)[0];
					io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
				}
				
				break;
		}
		info(`You have ${players[socket.id].actionPoints} actions left.`, socket);
	} else {
		info('It is not your turn.', socket);
	}

	if (TURN.player === players[socket.id].name && players[socket.id].actionPoints <= 0) {
		if (PLAYER_DECK.length <= 2) {
			gameOver('As your team blows past all the WHO deadlines confidence dries up. Your funding has been removed and no governments recognize your authority.');
		}
		drawCard(players[socket.id]);
		checkEpidemic(socket);
		drawCard(players[socket.id]);
		checkEpidemic(socket);
		if (players[socket.id].cards.length > 7) {
			forceDiscardCard(socket.id);
		}

		TURN.N++;
		TURN.player = Object.entries(players).find(([socketId, player])=>TURN.N % numPlayers === player.playerOrder)[1].name;
		Object.values(players).find(player => player.name === TURN.player).actionPoints = 4;
		socket.emit('turn', TURN);
		info(`It is now turn ${TURN.N} (${TURN.player})`);

		if (SKIP_INFECTION_PHASE) {
			SKIP_INFECTION_PHASE = false;
		} else {
			for (let i = 0; i < INFECTION_RATE_RACK[INFECTION_RATE]; i++) {
				let infectedCity = INFECTION_DECK.shift();
				let city = cities.find(city => city.name === infectedCity.name);

				let quarantineSpecialist = Object.values(players).find(player=>player.role.name==="Quarantine Specialist");
				let quarantineSpecialistEffect = [];
				if (typeof quarantineSpecialist !== 'undefined') {
					let quarantineCity = qurantineSpecialist.location;
					quarantineSpecialistEffect.push(quarantineCity);
					cities.find(city=>city.name===quarantineCity).neighbors.forEach(neighbor=>quarantineSpecialistEffect.push(neighbor));
				}

				if (!quarantineSpecialistEffect.includes(city.name)) {
					city.diseaseCounts[city.color]++;
					info(`${city.name} has a new case of ${city.color} disease.`)
					if (city.diseaseCounts[city.color] > 3) {
						city.diseaseCounts[city.color] = 3;
						checkMaxDiseaseCount();
						outbreak(city, city.color, [city.name]);
					}
				}
				INFECTION_DISCARD_PILE.push(infectedCity);
				io.sockets.emit('infection discard pile', INFECTION_DISCARD_PILE);
			}
		}
	}
}

function checkEpidemic(socket) {
	if (players[socket.id].cards.map(card => card.name).includes("Epidemic")) {
		players[socket.id].cards.splice(players[socket.id].cards.findIndex(card => card.name === "Epidemic"),1);
		io.sockets.emit('epidemic');
		INFECTION_RATE++;	
		io.sockets.emit('infection rate', INFECTION_RATE_RACK[INFECTION_RATE]);
		let infectedCity = INFECTION_DECK.pop();

		let quarantineSpecialist = Object.values(players).find(player=>player.role.name==="Quarantine Specialist");
		let quarantineSpecialistEffect = [];
		if (typeof quarantineSpecialist !== 'undefined') {
			let quarantineCity = qurantineSpecialist.location;
			quarantineSpecialistEffect.push(quarantineCity);
			cities.find(city=>city.name===quarantineCity).neighbors.forEach(neighbor=>quarantineSpecialistEffect.push(neighbor));
		}
		if (!DISEASES[infectedCity.color].cured) {
			if (!quarantineSpecialistEffect.includes(infectedCity.name)){
				let city = cities.find(city => city.name === infectedCity.name);
				if (city.diseaseCounts[city.color] > 0) { // Outbreak occured
					outbreak(city, city.color, [city.name]);
				}
				city.diseaseCounts[city.color] = 3;
				checkMaxDiseaseCount();
			}
			
			INFECTION_DISCARD_PILE.push(infectedCity);
			shuffle(INFECTION_DISCARD_PILE);
			INFECTION_DECK = INFECTION_DISCARD_PILE.concat(INFECTION_DECK);
			INFECTION_DISCARD_PILE = [];
			io.sockets.emit('infection discard pile', INFECTION_DISCARD_PILE);
		}
	}
}

function checkMaxDiseaseCount() {
	['blue', 'yellow', 'red', 'black'].forEach(color => {
		let sumColor = cities
			.map(city => city.diseaseCounts[color])
			.reduce((a, b) => a + b, 0);
		if (sumColor > MAX_DISEASE_COUNT) {
			gameOver('Worldwide infections spread past the point of no return. Resources previously used to fight it have been focused elsewhere.');
		}
	});

}

function outbreak(city, color, citiesAlreadyInfected){
	info(`There has been an outbreak of ${color} disease in ${city.name}.`)
	OUTBREAKS++;
	io.sockets.emit('outbreaks', OUTBREAKS);
	if (OUTBREAKS > MAX_OUTBREAKS) {
		gameOver('Panic sets in worldwide has more than 8 outbreaks have been reported. International cooperation has ceased has governments struggle to contain massive riots.');
	}

	city.neighbors.forEach(neighborName => {
		if (!citiesAlreadyInfected.includes(neighborName)){
			let neighbor = cities.find(c => c.name === neighborName);
			neighbor.diseaseCounts[color]++;
			info(`${neighbor.name} has a new case of ${color} disease.`);
			checkMaxDiseaseCount();
			if (neighbor.diseaseCounts[color] > 3) {
				neighbor.diseaseCounts[color] = 3;
				outbreak(neighbor, color, citiesAlreadyInfected = city.neighbors.concat(citiesAlreadyInfected));
			}
		}
	});	
}

function forceDiscardCard(playerKey) {
	//TODO: there is a bug here when a player joins while a player is being forced to discard a card.
	PLAYER_DISCARDING = players[playerKey].name;
	io.sockets.to(playerKey).emit('force discard card');
	PAUSE_OBJECT = {playersNotIncluded: [players[playerKey].name], message:`${players[playerKey].name} is discarding a card.`};
	GAME_PAUSED = true;
	io.sockets.emit('pause', PAUSE_OBJECT);
}

function drawCard(player) {
	player.cards.push(PLAYER_DECK.shift());
	io.sockets.emit('player deck N', PLAYER_DECK.length);
	info(`${player.name} drew the card ${player.cards[player.cards.length - 1].name}`)
}

function gameOver(message) {
	clearInterval(tickInterval);
	io.sockets.emit('game over', {
		message: message
	});
}

io.on('connection', function(socket) {
	socket.on('new player', (name) => newPlayer(name, socket));
	
	socket.on('player ready', function() {
		players[socket.id].readyToStart = true;
		io.sockets.emit('players', players);
		let allReadyToStart = Object.values(players)
			.map(player => player.readyToStart)
			.every(ready=>ready === true);
		if (allReadyToStart && Object.values(players).length >= 2) {
			startGame(socket);
		}
	});

	socket.on('action', action => executeAction(socket, action));
	socket.on('event card played', data => executeEventCard(socket, data));

	socket.on('give card', data => {
		Object.values(players).find(player=>player.name === data.player).cards.push(data.card);
	});


	socket.on('give contingency card', data => {
		Object.values(players).find(player=>player.name === data.player).contingencyCard = data.card;
	});

	socket.on('set role', data => {
		Object.values(players).find(player=>player.name === data.player).role.name = data.role;
	});
	socket.on('set disease', data => {
		DISEASES[data.color].cured = data.cured;
		io.sockets.emit('diseases', DISEASES);
	});

	socket.on('force discard card complete', function(discardedCard) {
		PLAYER_DISCARD_PILE.push(players[socket.id].cards.splice(
			players[socket.id].cards.findIndex(pCard => pCard.name === discardedCard),
			1));
		io.sockets.emit('player discard pile', PLAYER_DISCARD_PILE);
		GAME_PAUSED = false;
		PLAYER_DISCARDING = false;
		io.sockets.emit('unpause');
		io.sockets.emit('players', players);
		if (players[socket.id].cards.length > 7){
			forceDiscardCard(socket.id);
		}
	});

	socket.on('request forecast data', function(fn) {
		fn(INFECTION_DECK.slice(0,6));
	});
});
