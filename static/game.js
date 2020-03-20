var socket = io();
socket.on('message', function(data) {
  console.log(data);
});



window.addEventListener("load", eventWindowLoaded, false);
function eventWindowLoaded() {
	pandemicGame();
}
function pandemicGame(){
	let canvas = document.getElementById('game-canvas');
	let context = canvas.getContext('2d');
	let gameData = {my_player: '', cities: [], players: {}, uiElements: {}, selectedUiElement: ''};
	
	socket.on("your name is", function(name) {
		gameData.my_player = name;
		gameData.selectedUiElement = `PLAYER_TEXT: ${gameData.my_player}`
		console.log(gameData);
	});

	function getMyPlayerKey() {
		return Object.keys(gameData.players).find(playerKey => gameData.players[playerKey].name === gameData.my_player);
	}

	function getMyPlayer() {
		return gameData.players[getMyPlayerKey()];
	}

	socket.on("you are a spectator", function() {
		gameData.my_player = "Spectator";
	});

	// Show position of mouse on click to aid with city creation
	canvas.addEventListener('click', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		var message = '{\n\t\tname:,\n\t\txPos: '+mousePos.x+',\n\t\tyPos: '+mousePos.y+',\n\t\tcolor:'+'\n\t}'
		console.log(message)
	}, false);

	canvas.addEventListener('click', function(evt) {
		let mousePos = getMousePos(canvas, evt);
		for (let [name, path] of Object.entries(gameData.uiElements)) {
			if (context.isPointInPath(path, mousePos.x, mousePos.y)) {
                handleClick(name);
			}
		}
    });

    function handleClick(uiElementKey) {
        console.log(uiElementKey);
        if (uiElementKey.startsWith("CITY: ")) {
					gameData.selectedUiElement = uiElementKey;
					draw();

        } else if (uiElementKey.startsWith("PLAYER_TEXT:")) {
					gameData.selectedUiElement = uiElementKey;
					draw();
        } else if (uiElementKey.startsWith("READY_BUTTON")) {
					socket.emit("player ready");	
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
					context.globalAlpha = 0.2;
					context.stroke();
					context.globalAlpha = 1;
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
				if (gameData.selectedUiElement === cityKey) {
					context.strokeStyle = "green";
				} else {
					context.strokeStyle = "black";
				}
				context.stroke(gameData.uiElements[cityKey]);
				context.fillStyle = city.color;
				context.fill(gameData.uiElements[cityKey]);

				context.font = "10px Arial";
				context.miterLimit = 2;
				context.lineWidth = 4;
				context.strokeText(city.name, city.xPos - 20, city.yPos - 13 )
				context.fillStyle = "white"
				context.fillText(city.name, city.xPos - 20, city.yPos - 13 )
				});
		}

		function drawUI() {
			try {
				drawReadyButton();
			}
			catch(error) {
			}
			
			drawPlayers();
			drawInfoPane();

			function drawReadyButton() {
				if (getMyPlayer().readyToStart === false) {
					let readyButton = new Path2D();
					let x = 583;
					let y = 565;

					readyButton.rect(x, y, 100, 40);
					context.fillStyle = "red";
					context.fill(readyButton);
					gameData.uiElements['READY_BUTTON'] = readyButton;

					context.fillStyle = "black";
					context.fillText("Click to ready up.",x, y)
				}
			}

			function drawPlayers() {
				let playerInfo = { 
					x: 399,
					y: 655,
					width: 200,
					height: 200,
					lineHeight: 14,
					fontFace: "arial",
					padLeft: 10,
					padTop: 0
				}

				let currentLine = 1;
				let lineHeight = 12;
				Object.entries(gameData.players).forEach(playerArr=>{
					let player = playerArr[1]
									let playerTextKey = `PLAYER_TEXT: ${player.name}`
					gameData.uiElements[playerTextKey] = new Path2D();

					context.font = `${playerInfo.lineHeight}px ${playerInfo.fontFace}`
					context.fillStyle = "black";
					context.fillText(
						player.name,
						playerInfo.x + playerInfo.padLeft,
						playerInfo.y + currentLine * playerInfo.lineHeight + playerInfo.padTop
					)
					gameData.uiElements[playerTextKey].rect(
											playerInfo.x + playerInfo.padLeft,
											playerInfo.y + ((currentLine-1) * playerInfo.lineHeight),
											context.measureText(player.name).width,
											playerInfo.lineHeight
									)
					if (gameData.selectedUiElement === playerTextKey) {
						context.fillStyle = "green"
						context.globalAlpha = 0.2;
						context.fill(gameData.uiElements[playerTextKey])
						context.globalAlpha = 1;
					}

					currentLine += 1;
				})
			}

			function drawInfoPane() {
				if (gameData.selectedUiElement.startsWith("CITY:")) {
					drawCityInfo();
				} else if (gameData.selectedUiElement.startsWith("PLAYER_TEXT:")) {
					drawPlayerInfo();
				}

				function drawCityInfo() {
					let cityName = gameData.selectedUiElement.split("CITY: ")[1];
					let city = gameData.cities.find(city=>city.name === cityName);

					drawDiseaseCounts();
					drawResearchStationStatus();
					drawCityName();

					function drawDiseaseCounts() {
						let x = 627;
						let y = 745;
						for (let [color, count] of Object.entries(city.diseaseCounts)) {
							context.font = "16px Arial";
							context.fillStyle = color;
							context.miterLimit = 2;
							context.lineWidth = 2;
							context.strokeText(count, x, y);
							context.fillText(count, x, y);
							x+= 60;
						}
					}

					function drawResearchStationStatus() {
						let x = 623;
						let y = 700;
						context.font = "14px Arial";
						context.fillStyle = "black";
						context.lineWidth = 1;
						
						context.fillText(`Research Station: ${city.researchStationState}`, x, y);
					}

					function drawCityName() {
						let x = 622;
						let y = 671;
						context.font = "22px Arial";
						context.fillStyle = city.color;
						context.miterLimit = 2;
						context.lineWidth = 3;
						if (city.color === "yellow") {
							context.strokeText(city.name, x, y);
						}
						context.fillText(city.name, x, y);
					}
				}

				function drawPlayerInfo() {
				}
			}
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
