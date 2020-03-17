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
	
	// Show position of mouse on click to aid with city creation
	canvas.addEventListener('click', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		var message = '{\n\t\tname:,\n\t\txPos: '+mousePos.x+',\n\t\tyPos: '+mousePos.y+',\n\t\tcolor:'+'\n\t}'
		console.log(message)
	}, false);

	init();

	function init() {
		drawCityEdges();
		drawCities();
	}

	function drawCities() {
		cities.forEach(city=>{
			context.beginPath();
			context.arc(city.xPos, city.yPos, 10, 0, 2 * Math.PI);
			context.stroke();
			context.fillStyle = city.color;
			context.fill();

			context.font = "11px Arial";
			context.strokeStyle = "black";
			context.lineWidth = 4;
			context.strokeText(city.name, city.xPos - 5, city.yPos - 13 )
			context.fillStyle = "white"
			context.fillText(city.name, city.xPos - 5, city.yPos - 13 )
		});
	}	

	function drawCityEdges() {
		let edges = cities.map(city=>
			city.neighbors.map(neighbor=>
				[city.name, neighbor]
			)
		).flat();

		edges.forEach(edge=>{
			try {
				let city1 = cities.find(city => city.name === edge[0]);
				let city2 = cities.find(city => city.name === edge[1]);
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
