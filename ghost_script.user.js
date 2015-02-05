// ==UserScript==
// @name          Ghost Mario
// @version       0.1
// @include       http://*.koalabeast.com:*
// @include       http://*.jukejuice.com:*
// @include       http://*.newcompte.fr:*
// @grant		  GM_setValue
// @grant 		  GM_getValue
// ==/UserScript==


//--------------------------------------//
// This section records data each match //
//--------------------------------------//

// Function to easily create array of zeros
function createZeroArray(N) {
    return (Array.apply(null, {length: N}).map(Number.call, function () {
        return (0);
    }))
}

// function to store data using GM_setValue
// this gets called when a player grabs a mario
// it compares the best time this round to the previously saved best time,
// and if this round's time is better it replaces the data there
function storeData(positions, id, name, time) {
	
	// get currently stored best time
	currentBest = GM_getValue('currentBestData');
	
	// compare this game's best to stored currently stored best time
	// if this game's is better, store this game's instead
	if(typeof currentBest === 'undefined' || JSON.parse(currentBest).time > time) {
		winnerData = {
			positions = positions['player'+id],
			time = time
		};
		
		GM_setValue('currentBestData', JSON.stringify(winnerData));
	};

}

// function to start recording
function recordData() {
	var positions = {};			// this object holds all position data 
	var fps = 60;				// how frequently we record player position data (e.g., 60 times per second)
	var saveDuration = 180;		// save data for maximum of 3 minutes
	
	// function to save game data
    saveGameData = function () {
    	
    	// create player objects within positions objects for any player not already represented
        currentPlayers = tagpro.players;
        for (player in currentPlayers) {
            if (!positions['player' + player]) {
                positions['player' + player] = {
                    x: 		createZeroArray(saveDuration * fps),
                    y: 		createZeroArray(saveDuration * fps),
                    name: 	createZeroArray(saveDuration * fps),
                    dead: 	createZeroArray(saveDuration * fps),
                    auth: 	createZeroArray(saveDuration * fps),
                    degree:	createZeroArray(saveDuration * fps),
                    flair: 	createZeroArray(saveDuration * fps)
                };
            };
        };
        
        // loop through those player attributes, shift each array, and append new values onto array
        // this is what actually records the data
        for (player in positions) {
        	for (i in positions[player]) {
                positions[player][i].shift();
                positions[player][i].push(typeof tagpro.players[player.replace('player', '')] != 'undefined' ? tagpro.players[player.replace('player', '')][i] : null);
            };
        };
    }
    
    // interval for calling saveGameData function at proper frequency
    recordInterval = setInterval(saveGameData, 1000 / fps);

	// set up listener for mario grabbed event
	// this will fire the storeData function and stop the saveGameData interval
    tagpro.socket.on('mario', function (mario) {
    	storeData(positions, mario.id, mario.name, mario.time);
    	clearInterval(recordInterval);
    });
    
};


// actually start recording
tagpro.ready(function() {
	tagpro.socket.on('time', function(time) {
		if(time.state === 1) {
			recordData();
		};
	});
});