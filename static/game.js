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
	function wrapText(text, x, y, maxWidth, lineHeight) {
		var words = text.split(' ');
		var line = '';

		for(var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + ' ';
			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				context.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			}
			else {
				line = testLine;
			}
		}
		context.fillText(line, x, y);
	}
	let gameData = {
		my_player: '', 
		cities: [], 
		players: {}, 
		uiElements: {}, 
		selectedUiElement: '', 
		gameStarted:false,
		isDiscardingCard: false,
		isPaused: false,
		pauseMessage: '',
		turn: {N:0, player: null},
		outbreaks: null,
		infectionRate: null,
		playerDeckN: null,
		diseases: null,
		switchingResearchStation: false,
		addToCityResearchStation: null,
		isGivingCard: false,
		isTakingCard: false,
		isAirliftingPlayer: false,
		airliftTarget: false,
		isUsingGovernmentGrant: false,
		governmentGrantTargetCity: false,
		isChoosingGovernmentGrantFromCity: false,
		infectionDiscardPile: [],
		isDispatching: false,
		dispatchTarget: false,
		playerDiscardPile: []
	};

	getPlayerName();
	function getPlayerName() {
		let validPlayerName = false;
		let playerName = "";
		while (!validPlayerName) {
			playerName = prompt("Enter your name. If you are a returning player, enter the same name.");
			if (playerName !== null && playerName !== "") {
				validPlayerName = true;
			}
		}
		socket.emit("new player", playerName);
	}
	
	socket.on("your name is", function(name) {
		gameData.my_player = name;
		gameData.selectedUiElement = `PLAYER_TEXT:${gameData.my_player}`
		console.log(gameData);
	});
	
	let messageList = document.getElementById("message-list");
	let messageListContainer = document.getElementById("message-list-container");
	socket.on('info', info => {
		let newMessage = document.createElement('li');
		newMessage.appendChild(document.createTextNode(`${info.from}: ${info.message}`));
		messageList.appendChild(newMessage);
		messageListContainer.scrollTop = messageListContainer.scrollHeight;
	});
	socket.on('result', result => {console.log(result.reason)});
	socket.on("turn", turn => gameData.turn = turn);
	socket.on("outbreaks", outbreaks => gameData.outbreaks = outbreaks);
	socket.on("diseases", diseases => {gameData.diseases = diseases; draw()});
	socket.on('game started', () => {gameData.gameStarted = true;});
	socket.on('airlift succesful', () => {gameData.isAirliftingPlayer = false; gameData.airliftTarget = false;});

	socket.on('player discard pile', playerDiscardPile=>gameData.playerDiscardPile=playerDiscardPile);

	socket.on('force discard card', () => {
		gameData.isDiscardingCard = true;	
	});

	socket.on('pause', (data) => {
		if (!data.playersNotIncluded.includes(gameData.my_player)) {
			gameData.isPaused = true;
			gameData.pauseMessage = gameData.message
		}
	});

	socket.on('player deck N', playerDeckN => gameData.playerDeckN = playerDeckN);
	socket.on('infection rate', infectionRate => gameData.infectionRate = infectionRate);
	socket.on('infection discard pile', infectionDiscardPile=>gameData.infectionDiscardPile = infectionDiscardPile);

	socket.on('game over', data => gameOver(data));


	function getMyPlayerKey() {
		return Object.keys(gameData.players).find(playerKey => gameData.players[playerKey].name === gameData.my_player);
	}

	function getMyPlayer() {
		return gameData.players[getMyPlayerKey()];
	}

	socket.on("you are a spectator", function() {
		gameData.my_player = "Spectator";
	});

	canvas.addEventListener('click', function(evt) {
		let mousePos = getMousePos(canvas, evt);
		for (let [name, path] of Object.entries(gameData.uiElements)) {
			if (context.isPointInPath(path, mousePos.x, mousePos.y)) {
                handleClick(name);
			}
		}
    });

	function handleClick(uiElementKey) {
			if (uiElementKey.startsWith("CITY:")) {
				console.log(gameData.selectedUiElement, uiElementKey);
				if (gameData.isPaused){
					console.log("Game is paused. Drive/Ferry action unavailable.")
				} else {
					if (gameData.selectedUiElement === uiElementKey) {
						if (gameData.switchingResearchStation) {
							let takeFromCity = uiElementKey.split(':')[1];
								socket.emit('action', {
									type: 'build research station',
									removeFromCity: takeFromCity,
									city: gameData.addToCityResearchStation
								});
							gameData.addToCityResearchStation = null;
							gameData.switchingResearchStation = false;
						} else if (gameData.isAirliftingPlayer) {
							socket.emit('event card played', {
								name: 'Airlift',
								target: gameData.airliftTarget,
								city: uiElementKey.split(':')[1]
							});
						} else if (gameData.isUsingGovernmentGrant) {
							if (gameData.cities.filter(city=>city.researchStationState === 'built').length >= 6) {
								alert('The research station limit has been reached.\nPlease select a city to transfer a research station from.');
								gameData.governmentGrantTarget = uiElementKey.split(':');
								gameData.isUsingGovernmentGrant = false;
								gameData.isChoosingGovernmentGrantFromCity = true;
							} else {
								socket.emit('event card played', {
									name: 'Government Grant',
									fromCity: false,
									target: uiElementKey.split(':')[1]
								});
								gameData.isUsingGovernmentGrant = false;
							}
						} else if (gameData.isChoosingGovernmentGrantFromCity) {
							socket.emit('event card played', {
								name: 'Government Grant',
								fromCity: uiElementKey.split(':')[1],
								target: gameDAta.governmentGrantTarget
							});
							gameData.isChoosingGovernmentGrantFromCity = false;
						} else if (gameData.isDispatching && gameData.dispatchTarget) {
							dispatchLogic(gameData.dispatchTarget, uiElementKey.split(':')[1]);	
						} else {
							let playerLocationHasResearchStation = gameData.cities
								.find(city => city.name === Object.values(gameData.players)
									.find(player => player.name === gameData.my_player).location)
								.researchStationState === 'built';
							let playerDestinationHasResearchStation = gameData.cities
								.find(city => city.name === uiElementKey.split(':')[1])
								.researchStationState === 'built';
							let playerIsOperationsExpert = Object.values(gameData.players)
								.find(player=>player.name===gameData.my_player)
								.role.name === "Operations Expert";
							if (playerLocationHasResearchStation && playerDestinationHasResearchStation) {
								socket.emit('action', {
									type: 'shuttle flight',
									city: uiElementKey.split(':')[1]
								});
							} else if (playerLocationHasResearchStation && playerIsOperationsExpert) {
								operationsExpertShuttleWindow(uiElementKey.split(':')[1]);
							} else {
								socket.emit('action', {
									type: 'drive/ferry',
									city: uiElementKey.split(':')[1]
								});
							}
						}
					}
				}
				gameData.selectedUiElement = uiElementKey;
				draw();

			} else if (uiElementKey.startsWith("PLAYER_TEXT:")) {
				gameData.selectedUiElement = uiElementKey;
				draw();
				if (gameData.isAirliftingPlayer) {
					gameData.airliftTarget = uiElementKey.split(':')[1];
					alert('Please click a city to airlift the player to.');
				} else if (gameData.isDispatching) {
					gameData.dispatchTarget = uiElementKey.split(':')[1];
					alert('Please click on a city to dispatch the player to.');
				}
			} else if (uiElementKey =="READY_BUTTON_FALSE") {
				socket.emit("player ready");	
			} else if (uiElementKey.startsWith('DRIVE/FERRY')) {
				if (gameData.isPaused) {
					console.log("Game is paused. Drive/Ferry action unavailable.")
				} else {
					socket.emit('action', {
						type: 'drive/ferry',
						city: uiElementKey.split(':')[1]
					});
				}
			} else if (uiElementKey.startsWith('CHARTER_FLIGHT')) {
				let toCity = uiElementKey.split(':')[1];
				socket.emit('action', {
					type: 'charter flight',
					city: toCity
				})
				
			} else if (uiElementKey.startsWith('BUILD_RESEARCH_STATION')) {
				if (gameData.isPaused) {
					// TODO: Paused info message

				} else if (gameData.cities.find(city=>city.name===uiElementKey.split(':')[1]).researchStationState === 'built'){
					// TODO: research station already built message

				} else {
					let researchStationCities = gameData.cities.filter(city => city.researchStationState === 'built');
					if (researchStationCities.length >= 6) {
						if (
							confirm('There are 6 research stations already present.\nPress OK to pick a city to remove a research station from.')
						){
							gameData.switchingResearchStation = true;
						}
					} else {
						socket.emit('action', {
							type:'build research station',
							removeFromCity: false,
							city: uiElementKey.split(':')[1]
						});
					}
				}	
			} else if (uiElementKey.startsWith('TREAT_DISEASE')) {
				if (gameData.isPaused) {
					// TODO: Paused message
				} else {
					socket.emit('action', {
						type: 'treat disease',
						color: uiElementKey.split(':')[1]
					});
				}
			} else if (uiElementKey.startsWith('GIVE_CARD')) {
				if (gameData.isPaused) {
					// TODO: Paused message
				} else if (Object.values(gameData.players).find(player=>player.name===gameData.my_player).role.name==="Researcher") {
					researcherWindowGive(uiElementKey.split(':')[1]);
				}else {
					socket.emit('action', {
						type: 'give city card',
						otherPlayer: uiElementKey.split(':')[1]
					});
					//gameData.isGivingCard = uiElementKey.split(':')[1];
					//alert(`Please select a card to give to ${uiElementKey.split(':')[1]}.`);
				}
			} else if (uiElementKey.startsWith('TAKE_CARD')) {
				if (gameData.isPaused) {
					// TODO: Paused message
				} else if (Object.values(gameData.players).find(player=>player.name===uiElementKey.split(':')[1]).role.name==="Researcher") {
					researcherWindowTake(uiElementKey.split(':')[1]);	
				} else {
					socket.emit('action', {
						type: 'take city card', 
						otherPlayer: uiElementKey.split(':')[1]
					});
					//gameData.isTakingCard = uiElementKey.split(':')[1];
					//alert(`Please select a card to take from ${uiElementKey.split(':')[1]}.`);
				}
			} else if (uiElementKey.startsWith('CURE')) {
				if (gameData.isPaused) {
					//TODO: Paused message
				} else {
					discoverCureWindow(uiElementKey.split(':')[1]);
				}
			} else if (uiElementKey.startsWith('DISPATCH')) {
				if (gameData.isPaused) {
					
				} else {
					// TODO: dispatch action	
					gameData.isDispatching = true;
					alert('Click on a players name to select them for dispatch');
				}
			} else if (uiElementKey.startsWith('CARD')) {
				let isInMyHand = Object.values(gameData.players)
					.find(player => player.name === gameData.my_player)
					.cards.map(card=>card.name)
					.includes(uiElementKey.split(':')[1])
				if (gameData.isDiscardingCard) {
					let card = uiElementKey.split(':')[1];
					if (Object.values(gameData.players)
						.find(player => player.name === gameData.my_player)
						.cards
						.map(card => card.name)
						.includes(card)
					){
						socket.emit('force discard card complete', card);
						gameData.isDiscardingCard = false;
					} else {
						alert(`The card: ${card} is not in your hand.`)	
					}
				} else {
					let myLocation = Object.values(gameData.players).find(player => player.name === gameData.my_player).location;
					let isNotACity = typeof gameData.cities.find(city => city.name === uiElementKey.split(':')[1]) === 'undefined';
					if (isNotACity && isInMyHand) {
						// Handle event cards
						//
						switch(uiElementKey.split(':')[1]) {
							case 'Airlift':
								alert('Please click the name of the player you want to airlift.');
								gameData.isAirliftingPlayer = true;
								break;
							case 'One quiet night':
								socket.emit('event card played', {
									name: 'One quiet night'
								});
								break;
							case 'Forecast':
								forecastWindow();
								break;
							case 'Government Grant':
								alert('Please click the name of the city you would like to build a research station in.');
								gameData.isUsingGovernmentGrant = true;
								break;
							case 'Resilient Population':
								resilientPopulationWindow();
								break;
						}
					} else {
						if (uiElementKey.split(':')[1] !== myLocation && !isNotACity && isInMyHand) {
							if (confirm(`Take a direct flight to ${uiElementKey.split(':')[1]}?`)) {
								socket.emit('action', {
									type: 'direct flight',
									city: uiElementKey.split(':')[1] 
								})
							}
						}
					}
				}
			} else if (uiElementKey.startsWith('CONTINGENCY_CARD')) {
				let isInMyHand = Object.values(gameData.players)
					.find(player => player.name === gameData.my_player)
					.cards.map(card=>card.name)
					.includes(uiElementKey.split(':')[1])

				if (isInMyHand) {
					switch(uiElementKey.split(':')[1]) {
						case 'Airlift':
							alert('Please click the name of the player you want to airlift.');
							gameData.isAirliftingPlayer = true;
							break;
						case 'One quiet night':
							socket.emit('event card played', {
								name: 'One quiet night'
							});
							break;
						case 'Forecast':
							forecastWindow();
							break;
						case 'Government Grant':
							alert('Please click the name of the city you would like to build a research station in.');
							gameData.isUsingGovernmentGrant = true;
							break;
						case 'Resilient Population':
							resilientPopulationWindow();
							break;
					}
				}
			} else if (uiElementKey.startsWith('GET_CONTINGENCY_CARD')) {
				contingencyCardWindow();
			}
	}

	function contingencyCardWindow() {
		let cWindow = document.createElement('div');
		cWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(cWindow);
		let title = document.createElement('p');
		title.innerText = `Pick a contingency card. If you already have a contingency card, this will replace it.`;
		cWindow.appendChild(title);
		let eventCardNames = ['Airlift', 'One quiet night', 'Forecast', 'Government Grant', 'Resilient Population'];
		gameData.playerDiscardPile.filter(card=>eventCardNames.includes(card.name)).forEach(card=>{
			let container = document.createElement('div');
			cWindow.appendChild(container);
			let button = document.createElement('button'); 
			button.innerText = '+' 
			button.onclick = () => {
				socket.emit('action', {
					type: 'contingency special action',
					card: card.name
				});
				cWindow.parentNode.removeChild(cWindow);
			};
			container.appendChild(button);
			cardText = document.createElement('span');
			cardText.innerText = card.name;
			container.appendChild(cardText);
		});
		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			gameData.isDispatching = false;
			gameData.dispatchTarget = false;
			cWindow.parentNode.removeChild(cWindow);
		};
		cWindow.appendChild(cancelButton);
	}

	function dispatchLogic(fromPlayer, toLocation) {
		let cards = Object.values(gameData.players).find(player=>player.name===gameData.my_player).cards.map(card=>card.name);
		let fromLocation = Object.values(gameData.players).find(player=>player.name===fromPlayer).location;
		if (cards.includes(toLocation) && cards.includes(fromLocation)) {
			let dWindow = document.createElement('div');
			dWindow.style = `  
				position:absolute; 
				left: 600px; 
				top: 300px; 
				background-color: white; 
				padding:10px; 
				font-family:Arial;
				border: 2px black;
				box-shadow: 2px 2px 5px black;
				border-radius: 8px;`;
			document.body.appendChild(dWindow);

			let title = document.createElement('p');
			title.innerText = `Choose a card to discard in order to dispatch ${fromPlayer} to ${toLocation}.`;
			dWindow.appendChild(title);

			let toElement = document.createElement('div');
			let toElementButton = document.createElement('button');
			toElementButton.innerText = '✘';
			toElementButton.onclick = () => {
				socket.emit('action', {
					type: 'dispatcher special action',
					fromPlayer: fromPlayer,
					toLocation: toLocation,
					card: toLocation
				});
				gameData.isDispatching = false;
				gameData.dispatchTarget = false;
				dWindow.parentNode.removeChild(dWindow);
			};
			toElement.appendChild(toElementButton);
			let toElementText = document.createElement('span');
			toElementText.innerText = `${toLocation} (Direct Flight)`
			toElement.appendChild(toElementText);
			dWindow.appendChild(toElement);

			let fromElement = document.createElement('div');
			let fromElementButton = document.createElement('button');
			fromElementButton.innerText = '✘';
			fromElementButton.onclick = () => {
				socket.emit('action', {
					type: 'dispatcher special action',
					fromPlayer: fromPlayer,
					toLocation: toLocation,
					card: fromLocation
				});
				gameData.isDispatching = false;
				gameData.dispatchTarget = false;
				dWindow.parentNode.removeChild(dWindow);
			};
			fromElement.appendChild(fromElementButton);
			let fromElementText = document.createElement('span');
			fromElementText.innerText = `${fromLocation} (Charter Flight)`
			fromElement.appendChild(fromElementText);
			dWindow.appendChild(fromElement);

			let cancelButton = document.createElement('button');
			cancelButton.innerText = "Cancel";
			cancelButton.onclick = () => {
				gameData.isDispatching = false;
				gameData.dispatchTarget = false;
				dWindow.parentNode.removeChild(dWindow);
			};
			dWindow.appendChild(cancelButton);
		} else {
			socket.emit('action', {
				type: 'dispatcher special action',
				fromPlayer: fromPlayer,
				toLocation: toLocation,
				card: false
			});
			gameData.isDispatching = false;
			gameData.dispatchTarget = false;
		}
	}

	function operationsExpertShuttleWindow(destination) {
		let oWindow = document.createElement('div');
		oWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(oWindow);

		let title = document.createElement('p');
		title.innerText = `Choose a card to discard in order to travel to ${destination}.`;
		oWindow.appendChild(title);

		Object.values(gameData.players).find(player=>player.name===gameData.my_player).cards.filter(card=>card.type==="city").forEach(card=>{
			let container = document.createElement('div');
			oWindow.appendChild(container);
			let button = document.createElement('button');
			button.innerText = '✘';
			button.onclick = () => {
				socket.emit('action', {
					type: 'operations expert shuttle',
					card: card.name,
					city: destination
				});
				oWindow.parentNode.removeChild(oWindow);
			};
			container.appendChild(button);
			let cardName = document.createElement('span');
			cardName.innerText= card.name;
			container.appendChild(cardName);
		});
		
		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			oWindow.parentNode.removeChild(oWindow);
		};
		oWindow.appendChild(cancelButton);
	}

	function researcherWindowTake(otherPlayer) {
		let rWindow = document.createElement('div');
		rWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(rWindow);

		let title = document.createElement('p');
		title.innerText = `Choose a card from ${otherPlayer}'s hand to take.`;
		rWindow.appendChild(title);

		Object.values(gameData.players).find(player=>player.name===otherPlayer).cards.filter(card=>card.type==="city").forEach(card=>{
			let container = document.createElement('div');
			rWindow.appendChild(container);
			let button = document.createElement('button');
			button.innerText = '←';
			button.onclick = () => {
				socket.emit('action', {
					type: 'researcher special action take',
					card: card.name,
					otherPlayer: otherPlayer
				});
				rWindow.parentNode.removeChild(rWindow);
			};
			container.appendChild(button);
			let cardName = document.createElement('span');
			cardName.innerText= card.name;
			container.appendChild(cardName);
		});
		
		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			rWindow.parentNode.removeChild(rWindow);
		};
		rWindow.appendChild(cancelButton);
	}

	function researcherWindowGive(otherPlayer) {
		let rWindow = document.createElement('div');
		rWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(rWindow);

		let title = document.createElement('p');
		title.innerText = `Choose a card from your hand to give to ${otherPlayer}`;
		rWindow.appendChild(title);

		Object.values(gameData.players).find(player=>player.name===gameData.my_player).cards.filter(card=>card.type==="city").forEach(card=>{
			let container = document.createElement('div');
			rWindow.appendChild(container);
			let button = document.createElement('button');
			button.innerText = '→';
			button.onclick = () => {
				socket.emit('action', {
					type: 'researcher special action give',
					card: card.name,
					otherPlayer: otherPlayer
				});
				rWindow.parentNode.removeChild(rWindow);
			};
			container.appendChild(button);
			let cardName = document.createElement('span');
			cardName.innerText= card.name;
			container.appendChild(cardName);
		});
		
		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			rWindow.parentNode.removeChild(rWindow);
		};
		rWindow.appendChild(cancelButton);
	}

	function resilientPopulationWindow() {
		let rWindow = document.createElement('div');
		rWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(rWindow);

		let title = document.createElement('p');
		title.innerText = 'Choose a card from the infection discard pile to remove from the game.';
		rWindow.appendChild(title);

		gameData.infectionDiscardPile.forEach(card => {
			let container = document.createElement('div');
			rWindow.appendChild(container);
			let button = document.createElement('button');
			button.innerText = '✘';
			button.onclick = () => {
				socket.emit('event card played', {
					name: 'Resilient Population',
					card: card.name
				});
				rWindow.parentNode.removeChild(rWindow);
			};
			container.appendChild(button);
			let cardName = document.createElement('span');
			cardName.innerText = card.name;
			container.appendChild(cardName);
		});

		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			rWindow.parentNode.removeChild(rWindow);
		};
		rWindow.appendChild(cancelButton);
	}

	function forecastWindow() {
		socket.emit('request forecast data', function (cards) {
			let fWindow = document.createElement('div');
			fWindow.style = `  
				position:absolute; 
				left: 600px; 
				top: 300px; 
				background-color: white; 
				padding:10px; 
				font-family:Arial;
				border: 2px black;
				box-shadow: 2px 2px 5px black;
				border-radius: 8px;`;
			document.body.appendChild(fWindow);
		
			let infectionCards;
			infectionCards = cards;

			function pushUp(name) {
				let e = infectionEls.find(el=>el.card.name === name).div;
				let infectEl = infectionEls.find(el=>el.card.name === name);
				if (e.previousElementSibling) {
					e.parentNode.insertBefore(e, e.previousElementSibling);
					infectionEls.find(el=>el.order === infectEl.order - 1).order++;
					infectEl.order--;
				}
			}

			function pushDown(name) {
				let e = infectionEls.find(el=>el.card.name === name).div;
				let infectEl = infectionEls.find(el=>el.card.name === name);
				if (e.nextElementSibling) {
					e.parentNode.insertBefore(e.nextElementSibling, e);
					infectionEls.find(el=>el.order === infectEl.order + 1).order--;
					infectEl.order++;
				}
			}
			
			let title = document.createElement('p');
			title.innerText = 'Rearrange the top 6 cards of the infection deck.';
			fWindow.appendChild(title);
			let cardContainer = document.createElement('div');
			fWindow.appendChild(cardContainer);

			let order = 0;
			let infectionEls = infectionCards.map(card=>{
				let container = document.createElement('div');
				cardContainer.appendChild(container);
				let upButton = document.createElement('button');
				upButton.innerText = '↑';
				upButton.onclick = () => {pushUp(card.name)};
				container.appendChild(upButton);
				let downButton = document.createElement('button');
				downButton.innerText = '↓';
				downButton.onclick = () => {pushDown(card.name)};
				container.appendChild(downButton);
				let cardText = document.createElement('span');
				cardText.innerText = card.name;
				container.appendChild(cardText);
				return {
					card: card,
					div: container,
					order: order++
				};
			});


			let okButton = document.createElement('button');
			okButton.innerText = "OK";
			okButton.onclick = () => {
				infectionEls.sort((a, b) => (a.order > b.order) ? 1 : -1);
				socket.emit('event card played', {
					name: 'Forecast',
					cards: infectionEls.map(el => el.card)
				});
				fWindow.parentNode.removeChild(fWindow);
			};
			fWindow.appendChild(okButton);
		});
	}

	function discoverCureWindow(color) {
		let cureWindow = document.createElement('div');
		cureWindow.style = `
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;`;
		document.body.appendChild(cureWindow);


		let cards = Object.values(gameData.players)
			.find(player=>player.name === gameData.my_player)
			.cards.filter(card=>card.color === color);

		let title = document.createElement('p');
		if (cards.length === 0) {
			title.innerText = `You do not have any ${color} city cards.`;
		} else {
			title.innerText = `Select 5 of your cards to cure the ${color} disease.`;
		}
		cureWindow.appendChild(title);

		let checkBoxes = cards.map(card => {
			let cardOption = document.createElement('div');
			let checkBox = document.createElement('input');
			checkBox.setAttribute('type', 'checkbox');
			cardOption.appendChild(checkBox);
			let cardOptionText = document.createElement('span');
			cardOptionText.innerText = card.name;
			cardOption.appendChild(cardOptionText);
			cureWindow.appendChild(cardOption);
			return {
				card: card,
				checkBox: checkBox
			}
		});

		let okButton = document.createElement('button');
		okButton.innerText = "OK";
		okButton.onclick = () => {
			let isScientist = Object.values(gameData.players).find(player=>player.name===gameData.my_player).role.name === "Scientist";
			if (checkBoxes.filter(checkBox=>checkBox.checked) < isScientist ? 4 : 5) {
				alert('5 cards are needed to cure a disease, 4 if a scientist.')
			} else {
				socket.emit('action', {
					type: 'discover cure',
					color: color,
					cards: checkBoxes.filter(checkBox=>checkBox.checkBox.checked).map(checkBox=>checkBox.card) 
				});
				cureWindow.parentNode.removeChild(cureWindow);
			}
		};
		cureWindow.appendChild(okButton);

		let cancelButton = document.createElement('button');
		cancelButton.innerText = "Cancel";
		cancelButton.onclick = () => {
			cureWindow.parentNode.removeChild(cureWindow);
		};
		cureWindow.appendChild(cancelButton);
	}

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

		if (gameData.isPaused) {
			context.fillStyle = "black"
			context.font = "30px Arial"
			context.fillText(gamedata.pauseMessage, 369, 306)
		}

		drawCityEdges();
		drawCities();
		drawDiscardMessage();
		if (gameData.cities.length > 0) {
			drawPlayerIcons();
		}
		drawUI();

		function drawDiscardMessage(){
			if (gameData.isDiscardingCard) {
				context.font = "30px Arial"
				let fatness = context.measureText("Please discard a card.").width; 
				context.fillStyle= "white"
				let tempAlpha = context.globalAlpha; 
				context.globalAlpha = 1;
				context.fillRect(369-5, 306-35, fatness+5, 40)
				context.globalAlpha = tempAlpha;
				context.fillStyle = "black"
				context.fillText("Please discard a card.", 369, 306)
			}
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
					context.globalAlpha = 0.2;
					context.lineWidth = 3;
					context.strokeStyle = 'black';
					context.stroke();
					context.globalAlpha = 1;
				}
				catch(err) {
				}
			})
		}

		function drawCities() {
			gameData.cities.forEach(city=>{
				// TODO: draw research stations
				let cityKey = `CITY:${city.name}`
				gameData.uiElements[cityKey] = new Path2D();
				gameData.uiElements[cityKey].arc(city.xPos, city.yPos, 10, 0, 2 * Math.PI);
				if (gameData.selectedUiElement === cityKey) {
					context.strokeStyle = "green";
				} else {
					context.strokeStyle = "black";
				}
				context.lineWidth = 3;
				context.stroke(gameData.uiElements[cityKey]);
				context.fillStyle = city.color === 'yellow' ? 'gold' : city.color;
				context.fill(gameData.uiElements[cityKey]);


				let diseases = ["red","blue","black","yellow"];
				diseases.forEach((disease, idx)=>{
					for (let i = 0; i < city.diseaseCounts[disease]; i++){
						let wedge = new Path2D();
						wedge.arc(city.xPos, city.yPos, 14+(4*i), idx*Math.PI*0.5, (idx+1)*Math.PI*0.5); 
						context.strokeStyle = disease === 'yellow' ? 'gold' : disease;
						context.lineWidth = 2;
						context.stroke(wedge);
					}

				})

				context.font = "10px Arial";
				context.miterLimit = 2;
				context.lineWidth = 4;
				if (gameData.selectedUiElement === cityKey) {
					context.strokeStyle = "green";
				} else {
					context.strokeStyle = "black";
				}
				context.strokeText(city.name, city.xPos - 20, city.yPos - 13 )
				context.fillStyle = "white"
				context.fillText(city.name, city.xPos - 20, city.yPos - 13 )

				if (city.researchStationState === 'built') {
					let researchStationImage = new Image(20,15);
					researchStationImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAYAAADkmO9VAAABH0lEQVQ4ja2SsU7DMBRFzyMVMFSKMjLSLZ/AWnVjzh+g/ELZGLLA0p38QleypCgbY4dMHSJ5iMTMiJgeAw61rJgWxJWu4uckx8/XRlUZDNwAesDX7j++XdhVHMcfXddpSHVdK2CA8x+BwEUURa9VVQVhg7IsU+AuCAROgZeiKA7CVFX7vtfpdPoOXIaApZ9TSN53T2PAiarmQI6ViOgwNsawWq3w9GyfZyKysZkaYK2qZqzl747atj104r4XE3/5kObzOU3TANx6r5ZAYsf50cA0TWmaBlV9cOdFBODelm9HA3e73QBYOtMJ+/y3QDma4R/9CCQy3J0xicgC2NjS8HXFXM2cDgHKo7cMGD8/u6hhn+Hs5BfAkLZu8R9AV8knZ2NyaJ2jX2YAAAAASUVORK5CYII='
					context.drawImage(researchStationImage, city.xPos + 5, city.yPos - 8)
				}
			});
		}

		function drawPlayerIcons() {
			let offsets = [
				{x: -5, y: -5},
				{x: +5, y: -5},
				{x: -5, y: +5},
				{x: +5, y: +5}
			]
			Object.values(gameData.players).forEach(player => {
				let playerIcon = new Path2D();
				let playerIconOutline = new Path2D();
				let city = gameData.cities.find(city=>city.name === player.location);
				playerIcon.arc(
					city.xPos + offsets[player.playerOrder].x,
					city.yPos + offsets[player.playerOrder].y, 
					4,
					0, 
					2 * Math.PI
				);
				let tempFillStyle = context.fillStyle;
				let tempStrokeStyle = context.strokeStyle;
				let tempLineWidth = context.lineWidth;
				context.fillStyle = player.pawn;
				context.strokeStyle = "white";
				context.lineWidth = 2;
				context.fill(playerIcon);
				context.stroke(playerIcon);
				context.lineWidth = tempLineWidth;
				context.strokeStyle = tempStrokeStyle;
				context.fillStyle = tempFillStyle;
			});
		}

		function drawUI() {
			let elementsToDestroy = [
				'READY_BUTTON_FALSE',
				'READY_BUTTON_TRUE',
				'DRIVE/FERRY',
				'CHARTER_FLIGHT',
				'CARD',
				'BUILD_RESEARCH_STATION',
				'GIVE_CARD',
				'TAKE_CARD',
				'DISPATCH',
				'GET_CONTINGENCY_CARD',
				'CONTINGENCY_CARD'
			];
			for (let key of Object.keys(gameData.uiElements)) {
				if (elementsToDestroy.some(prefix => key.startsWith(prefix))) {
					delete gameData.uiElements[key];
				}
			}

			// Player not initialized in the beginning (or may be spectator) so this will throw undefined
			try {
				drawReadyButton();
			}
			catch(error) {
			}
			
			drawPlayers();
			drawDiseaseActions();
			drawInfoPane();
			drawGamePane();

			function drawButton(text, x, y, textColor, backgroundColor, fontSize, padX=30, padY=20, alpha=1) {
				context.font = `${fontSize}px Arial`;
				let textWidth = context.measureText(text).width;
				let buttonPath = new Path2D();
				buttonPath.rect(x, y, textWidth + padX, fontSize + padY);
				context.fillStyle = backgroundColor;
				context.globalAlpha = alpha;
				context.fill(buttonPath);
				context.globalAlpha = 1;
				context.fillStyle = textColor;
				context.fillText(text, x + padX/2, y + fontSize + padY/2);
				return buttonPath;
			}

			function drawButtonOverlay(x, y, x1, y1) {
				let buttonOverlay = new Path2D();
				buttonOverlay.rect(x, y, x1-x, y1-y);
				context.globalAlpha = 0;
				context.fill(buttonOverlay);
				context.globalAlpha = 1;
				return buttonOverlay;
			}

			function drawReadyButton() {
				let x = 376;
				let y = 565;
				if (gameData.gameStarted === false) {
					if (getMyPlayer().readyToStart === false) {
						gameData.uiElements['READY_BUTTON_FALSE'] = drawButton('Click to ready up.', x, y, "black", "red", 22);
					} else {
						gameData.uiElements['READY_BUTTON_TRUE'] = drawButton('You are ready.', x, y, "white", "green", 22);
					}
				}
			}

			function drawDiseaseActions() {
				gameData.uiElements['TREAT_DISEASE:blue'] = drawButtonOverlay(633, 581, 656, 605);
				gameData.uiElements['TREAT_DISEASE:yellow'] = drawButtonOverlay(679, 581, 701, 605);
				gameData.uiElements['TREAT_DISEASE:red'] = drawButtonOverlay(725, 581, 748, 605);
				gameData.uiElements['TREAT_DISEASE:black'] = drawButtonOverlay(771, 581, 792, 605);

				gameData.uiElements['CURE:blue'] = drawButtonOverlay(131, 735, 165, 775);
				gameData.uiElements['CURE:yellow'] = drawButtonOverlay(189, 735, 224, 775);
				gameData.uiElements['CURE:red'] = drawButtonOverlay(247, 735, 282, 775);
				gameData.uiElements['CURE:black'] = drawButtonOverlay(306, 735, 338, 775);

				context.fillStyle = 'white';
				context.font = "28px Arial";
				if (gameData.diseases) {
					if (gameData.diseases['blue'].cured) {
						context.fillText('✘', 138, 767);
					}
					if (gameData.diseases['yellow'].cured) {
						context.fillText('✘', 196, 767);
					}
					if (gameData.diseases['red'].cured) {
						context.fillText('✘', 254, 767);
					}
					if (gameData.diseases['black'].cured) {
						context.fillText('✘', 312, 767);
					}
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
									let playerTextKey = `PLAYER_TEXT:${player.name}`
					gameData.uiElements[playerTextKey] = new Path2D();

					context.font = `${playerInfo.lineHeight}px ${playerInfo.fontFace}`
					context.fillStyle = "black";
					context.fillText(
						gameData.turn.player === player.name ? '*' + player.name : player.name,
						playerInfo.x + playerInfo.padLeft,
						playerInfo.y + currentLine * playerInfo.lineHeight + playerInfo.padTop
					)
					gameData.uiElements[playerTextKey].rect(
											playerInfo.x + playerInfo.padLeft,
											playerInfo.y + ((currentLine-1) * playerInfo.lineHeight),
											context.measureText(gameData.turn.player === player.name ? '*'+player.name : player.name).width,
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

			function drawGamePane() {
				if (gameData.turn && gameData.gameStarted) {
					context.font = '16px Arial';
					context.fillStyle = 'black';
					context.fillText(gameData.turn.N, 63.5, 568);
				}

				if (gameData.outbreaks && gameData.gameStarted) {
					context.font = '12px Arial';
					context.fillStyle = 'black';
					context.fillText(gameData.outbreaks, 166, 640);
				} else if (gameData.gameStarted) {
					context.font = '12px Arial';
					context.fillStyle = 'black';
					context.fillText(0, 166, 640);
				}

				if (gameData.infectionRate && gameData.gameStarted) {
					context.font = '12px Arial';
					context.fillStyle = 'black';
					context.fillText(gameData.infectionRate, 181, 695);
				}

				if (gameData.playerDeckN && gameData.gameStarted) {
					context.font = '12px Arial';
					context.fillStyle = 'black';
					context.fillText(gameData.playerDeckN, 321, 694);
				}

				if (gameData.diseases && gameData.gameStarted) {
					//context.font '20px Arial';
					//context.fillStyle = 'white';
					//context.fill 
				}
			}

			function drawInfoPane() {
				if (gameData.selectedUiElement.startsWith("CITY:")) {
					drawCityInfo();
				} else if (gameData.selectedUiElement.startsWith("PLAYER_TEXT:")) {
					if (Object.values(gameData.players).length > 0){
						try {
							drawPlayerInfo();
						} catch(error) {
						}
					}
				}

				function drawCityInfo() {
					let cityName = gameData.selectedUiElement.split("CITY:")[1];
					let city = gameData.cities.find(city=>city.name === cityName);

					drawDiseaseCounts();
					drawResearchStationStatus();
					drawCityName();
					drawActions();

					function drawDiseaseCounts() {
						let x = 790;
						let y = 760;
						for (let [color, count] of Object.entries(city.diseaseCounts)) {
							context.font = "16px Arial";
							context.fillStyle = color;
							context.miterLimit = 2;
							context.lineWidth = 2;
							context.strokeStyle = 'black';
							context.strokeText(count, x, y);
							context.fillText(count, x, y);
							x+= 40;
						}
					}

					function drawResearchStationStatus() {
						let x = 583;
						let y = 760;
						context.font = "14px Arial";
						context.fillStyle = "black";
						context.lineWidth = 1;
						
						context.fillText(`Research Station: ${city.researchStationState}`, x, y);
					}

					function drawCityName() {
						let x = 588;
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

					function drawActions() {
						let xPos = 588;
						let yPos = 690;
						gameData.uiElements[`DRIVE/FERRY:${city.name}`] = drawButton("Drive/Ferry", xPos, yPos, "black", "beige", 11);
						gameData.uiElements[`CHARTER_FLIGHT:${city.name}`] = drawButton("Charter flight", xPos + 100, yPos, "black", "beige", 11);
						if (city.researchStationState === 'not built') {
							gameData.uiElements[`BUILD_RESEARCH_STATION:${city.name}`] = drawButton(
								"Build Research Station", 
								xPos + 208, yPos, "black", "beige", 11
							);
						}
					}
				}

				function drawPlayerInfo() {
					let x = 580;
					let y = 656;
					let playerName = gameData.selectedUiElement.split(':')[1]
					Object.values(gameData.players).find(player => player.name === playerName).cards.forEach(card=>{
						gameData.uiElements[`CARD:${card.name}`] = drawButton(card.name, x, y, "black", card.color, 13, padX=1, padY=1, alpha=0.3);
						y += 15;
					});

					let playerObj = Object.values(gameData.players).find(player => player.name === gameData.my_player)
					if (playerObj.contingencyCard && playerName === gameData.my_player) {
						gameData.uiElements[`CONTINGENCY_CARD:${playerObj.contingencyCard}`] = drawButton(playerObj.contingencyCard.name, 716, 685, 'black', playerObj.contingencyCard.color, 13, padX=1, padY=1, alpha=0.3);
					}

					if (playerName === gameData.my_player && playerObj.role.name === 'Contingency Planner') {
						gameData.uiElements[`GET_CONTINGENCY_CARD`] = drawButton('Pick contingency card', 817, 736, 'white', 'MediumSlateBlue', 13, padX=5, padY = 15);
					}

					if (playerName === gameData.my_player) {
						let role = Object.values(gameData.players).find(player=>player.name===gameData.my_player).role;
						context.font = '16px Arial';
						context.fillStyle = 'black';
						context.fillText(`Actions: ${Object.values(gameData.players).find(player=>player.name===playerName).actionPoints}`, 720, 665);
						wrapText(role.name, 817, 665, 130, 16);
						context.font = '11px Arial';
						wrapText(role.description, 817, 695, 130, 11);
					}
					if (playerName !== gameData.my_player) {
						gameData.uiElements[`GIVE_CARD:${playerName}`] = drawButton('Give city card', 837, 665, 'black', 'beige', 11);
						gameData.uiElements[`TAKE_CARD:${playerName}`] = drawButton('Take city card', 837, 705, 'black', 'beige', 11);
					}
					if (Object.values(gameData.players).find(player=>player.name===gameData.my_player).role.name==="Dispatcher" && playerName !==gameData.my_player) {
						gameData.uiElements[`DISPATCH:${playerName}`] = drawButton('Dispatch', 837 , 745, 'white', 'MediumSlateBlue', 11, padX=54, padY=7);
					}
				}
			}
		}

	}

	function getMousePos(cavas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}

	function gameOver(data) {
		socket.off('players');
		socket.off('cities');
		let gWindow = document.createElement('div');
		gWindow.style = `  
			position:absolute; 
			left: 600px; 
			top: 300px; 
			background-color: white; 
			padding:10px; 
			font-family:Arial;
			border: 2px black;
			box-shadow: 2px 2px 5px black;
			border-radius: 8px;
			max-width: 400px;`;
		document.body.appendChild(gWindow);

		let title = document.createElement('h1');
		title.innerText = 'Game Over';
		gWindow.appendChild(title);

		let message = document.createElement('p');
		message.innerText = data.message;
		gWindow.appendChild(message);
	}
}

dragElement(document.getElementById("messages"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "-header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
