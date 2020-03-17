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
	let gameData = {};

	// Show position of mouse on click to aid with city creation
	canvas.addEventListener('click', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		var message = '{\n\t\tname:,\n\t\txPos: '+mousePos.x+',\n\t\tyPos: '+mousePos.y+',\n\t\tcolor:'+'\n\t}'
		console.log(message)
	}, false);

	init();

	socket.on('cities', function(cities) {
		gameData.cities = cities;
		console.log(cities);
		draw();
	});

	function draw() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		drawCityEdges();
		drawCities();
	}

	function init() {
		initPlayer();
	}

	function initPlayer() {
		socket.emit('new player');

	}

	function drawCities() {
	gameData.cities.forEach(city=>{
			context.beginPath();
			context.arc(city.xPos, city.yPos, 10, 0, 2 * Math.PI);
			context.stroke();
			context.fillStyle = city.color;
			context.fill();

			context.font = "11px Arial";
			context.miterLimit = 2;
			context.strokeStyle = "black";
			context.lineWidth = 4;
			context.strokeText(city.name, city.xPos - 5, city.yPos - 13 )
			context.fillStyle = "white"
			context.fillText(city.name, city.xPos - 5, city.yPos - 13 )
		});
	}	

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

	function getMousePos(cavas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}
}
