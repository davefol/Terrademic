var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

socket.on('your name is', function(name) {
	console.log("my name is", name)
});



window.addEventListener("load", eventWindowLoaded, false);
function eventWindowLoaded() {
	pandemicGame();
}
function pandemicGame(){
	let canvas = document.getElementById('game-canvas');
	let context = canvas.getContext('2d');
	let gameData = {cities: [], players: [], uiElements: {}};

	// Show position of mouse on click to aid with city creation
	canvas.addEventListener('click', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		var message = '{\n\t\tname:,\n\t\txPos: '+mousePos.x+',\n\t\tyPos: '+mousePos.y+',\n\t\tcolor:'+'\n\t}'
		console.log(message)
	}, false);

	canvas.addEventListener('click', function(evt) {
		let mousePos = getMousePos(canvas, evt);
		for (let [name, path] of Object.entries(gameData.uiElements)) {
			if context.isPointInPath(path, mousePos.x, mousePos.y) {
				console.log(name);
			}
		}
	}

	

	init();

	socket.on('cities', function(cities) {
		gameData.cities = cities;
		draw();
	});

	socket.on('players', function(players) {
		gameData.players = players;
		draw();
	});

	

	function draw() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		drawCityEdges();
		drawCities();
		drawUI();

		function drawCityEdges() {
			let edges = gameData.cities.map(city=>
				city.neighbors.map(neighbor=>
					[city.name, neighbor]
				)
			).flat();

			edges.forEach(edge=>{
				try {
					let city1 = gameData.cities.find(city => city.name === edge[0]);
					let city2 = gameData.cities.find(city => city.name === edge[1]);
					context.beginPath();
					context.moveTo(city1.xPos, city1.yPos);
					context.lineTo(city2.xPos, city2.yPos);
					context.stroke();
				}
				catch(err) {
				}
			})
		}

		function drawCities() {
			gameData.cities.forEach(city=>{
				let cityKey = `CITY: ${city.name}`
				gameData.uiElements[cityKey] = new Path2D();
				gameData.uiElements[cityKey].arc(city.xPos, city.yPos, 10, 0, 2 * Math.PI);
				context.stroke(gameData.uiElements[cityKey]);
				context.fillStyle = city.color;
				context.fill(gameData.uiElements[cityKey]);

				context.font = "11px Arial";
				context.miterLimit = 2;
				context.strokeStyle = "black";
				context.lineWidth = 4;
				context.strokeText(city.name, city.xPos - 5, city.yPos - 13 )
				context.fillStyle = "white"
				context.fillText(city.name, city.xPos - 5, city.yPos - 13 )
				});
		}	

		function drawUI() {
			let playerInfo = {
				x: 3,
				y: 440,
				width: 200,
				height: 200,
				lineHeight: 14,
				fontFace: "arial",
				padLeft: 10,
				padTop: 10
			}

			context.fillStyle = 'white';
			context.strokeStyle = "black";
			context.fillRect(playerInfo.x, playerInfo.y, playerInfo.width, playerInfo.height);
			context.beginPath();
			context.rect(playerInfo.x, playerInfo.y, playerInfo.width, playerInfo.height);
			context.stroke();

			let currentLine = 1;
			let lineHeight = 12;
			Object.entries(gameData.players).forEach(playerArr=>{
				let player = playerArr[1]
				gameData.uiElements[`PLAYER_TEXT: ${player.name}`] = new Path2D();

				context.font = `${playerInfo.lineHeight}px ${playerInfo.fontFace}`
				context.fillStyle = "black";
				context.fillText(
					player.name, 
					playerInfo.x + playerInfo.padLeft, 
					playerInfo.y + currentLine * playerInfo.lineHeight + playerInfo.padTop
				)
				gameData.uiElements[player.name].rect(playerInfo.x + playerInfo.padLeft, playerInfo.y + currentLine * playerInfo.lineHeight + playerInfo.padTop, playerInfo.padLeft, context.measureText(player.name).width, playerInfo.lineHeight) 
				currentLine += 1;
			})
		}

	}

	function init() {
		initPlayer();
	}

	function initPlayer() {
		socket.emit('new player');

	}


	function getMousePos(cavas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}
}
