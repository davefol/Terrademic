---
author: David Folarin
version: 1.0
title: Terrademic: clone of Pandemic board game
---

# Terrademic ReadMe

## Intro
Hey y'all. This is my implementation of the popular board game Pandemic.
I made this for fun over two weeks off on and off programming. I'm not an experienced 
javascript programmer and the architecure and hygiene is pretty bad but thats something I'm
looking forward to improving as time goes on. If you'd like to contribute, 
please make a pull request and I'll be happy to look at it. 
I'd love bugfix pull requests. 

## Getting started
To play, clone the repo, and run the commands `npm install` and `npm start`.
That will download all the necessary libraries for the server side and
start the server. The client side uses socket.io and plain HTML5 canvas manipulation. 

Once started the server will serve a single webpage on port 5000 on the computer.
Visit `localhost:5000` to start playing. Other players can join by visiting `yourComputersIP:5000`.
You should also be able to connect through hamachi or some other LAN simulator.

## Rules
At least 2 players and not more than 4 need to click ready for the game to start.

### Setup
Before the first turn, 3 cities will be infected with 1 infection, 
3 with 2 infections, and 3 with 3 infections and all players will be given some cards.
With 2 players each gets 4 cards, with 3, 3 cards and with 4 2 cards. 

### Action Points
All players start with 4 action points. These can be used to move around the board,
build research stations, discover cures, and treat diseases.

### Movement
Players are represented by small colored circles. All players start in Atlanta.
All movement actions use one action point.

#### Drive/Ferry and shuttle fligtht
Click a city to select it and click a selected city to move to it, using up one action.
If the city is a connected to the city you are in, you will __drive/ferry__ to it.
If the city has a research station and the destination city also has a research station
you will __shuttle flight__ to it.

#### Charter flight
If you have the card that matches the city you are in, you can select any city then click
__charter flight__ in order to move directly to that city, using up an action point and 
discarding the card in the process.

#### Direct Flight
You can click on a city card that is in your hand to __direct flight__ moving to that city, 
using up an action point and discarding the card in the process.

#### Operation expert shuttle
If you are the opperations expert, you can move from to any city as long as you
are in a city that has a research station by discarding a card.

#### Dispatcher abilities
If you are the dispatcher, you can move any other pawn as if they were your own. 
Action points will be taken from you, as it is your turn. You can also move
players from any city to a city that has another player in it.

#### Airlift event card
By clicking on an airlift event card in your hand, you can move any player to any location,
discarding the event card but not using an action point. 

### Building research stations
You can spend an action point and discard a card that matches the city you are in order
to build a research station in it. There can be up to 6 reserach stations on the board, 
however you can transfer a research station from another city if you have reached the limit.

#### Operations Expert
You do not need to discard a card if you are the operations expert.

#### Government Grant
By clicking on a government grant card in your hand, you can build a research station anywhere,
discarding the card but not using an action point.


### Treating Disease
Click on the correspoding color square under 'treat disease' in order to remove
one disease of that color from the city you are in. 

#### Medic
If you are the medic, all diseases of that color will be removed. Also,
diseases that are cured will be automatically removed in whatever city you are in.

### Discovering Cures
Click on the vial with the same color as the disease you want to cure (bottom left of control pannel)
and select 5 cards of the same color as the diseease in order to discover a cure. Discovering a cure using one action
and discards all the cards selected.
Discovering all 4 cures means you have won the game.

#### Scientist
If you are the scientist you only need 4 cards of the same color as the disease in order to discover a cure.


### Giving and receiving cards from other players
Players must be in the same city to share cards. Sharing cards uses one action per card shared.
To share a card, select the players name then click give/take card, then select the card in your/their hand.
The card must match the city you are in. 

#### Researcher
If you are the researcher, you can __give__ a card that **does not match** the city that you are in.
Other players make also __take__ a card from you that **does not match** the city you are in.

### Drawing cards
When a player uses all 4 action points, their turn is over. They will autmatically draw 2 cards and
the infection phase will begin. If there are less than 2 cards when its time to draw, you have lost the game.
If you have more than 7 cards, you will be prompted to discard a card until you have 7. This also
applies after receiving cards from other players. 

#### Epidemic
If you draw an epidemic card, the infection rate increases, the bottom card of the infection deck is drawn, 
and all of the discarded infection cards are shuffled and placed on top of the infection deck.

### Infections
After drawing cards, the number of cards equal to the current infection rate will be draw, and each city
drawn will get a new infection matching its color. If the total amount of infections for any color exceeds
24, you have lost the game. 

### Forecast Event card
You can click on a forecast card in your hand to rearrange the top 6 cards of the infection deck,
discarding the forecast card in the process.

### One quiet night Event card
Clicking a one quiet night card in your hand will skip the next infection phase, discarding the 
card in the process.

### Resilient Population Event Card
Clicking the resilient population card in your hand will prompt you to remove one infection card
from the infection discard pile from the game. 

#### Outbreaks
If a city exceeds 3 infections of any color, an outbreak occurs and each of its neighboring cities will have 
one infection of the original cities color added. These outbreaks can chain together but a city can only be infected
once during a chain of outbreaks. 

If 8 outbreaks occur you have lost the game. 

#### Quarantine specialist
Prevents outbreaks and infection in their location and all connected cities. Does not affect initial placement of infections.


### Contingency Planner
Can take any event card from the discard pile and place in their hand, using an action point. Ignores max hand limit.

