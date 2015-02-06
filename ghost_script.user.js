// ==UserScript==
// @name          Ghost Mario
// @version       0.1
// @include       http://*.koalabeast.com:*
// @include       http://*.jukejuice.com:*
// @include       http://*.newcompte.fr:*
// @grant		  GM_setValue
// @grant 		  GM_getValue
// @grant 		  GM_deleteValue
// ==/UserScript==


//--------------------------------------//
// This section records data each match //
//--------------------------------------//

// Function to easily create array of null values
function createNullArray(N) {
    return (Array.apply(null, {length: N}).map(Number.call, function () {
        return (null);
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
	if(typeof currentBest === 'undefined' || JSON.parse(currentBest).time >= time) {
		winnerData = {
            positions : positions['player'+id],
            time : time
		};
		
		GM_setValue('currentBestData', JSON.stringify(winnerData));
	};

}

// function to start recording
function recordGhostData() {
	var positions = {};			// this object holds all position data 
	var fps = 60;				// how frequently we record player position data (e.g., 60 times per second)
	var saveDuration = 180;		// save data for maximum of 3 minutes
	
	// function to save game data
    saveGhostData = function () {
    	
    	// create player objects within positions objects for any player not already represented
        var currentPlayers = tagpro.players;
        for (player in currentPlayers) {
            if (!positions['player' + player]) {
                positions['player' + player] = {
                    x: 		createNullArray(saveDuration * fps),
                    y: 		createNullArray(saveDuration * fps),
                    //name: 	new Array(saveDuration * fps),
                    //dead: 	new Array(saveDuration * fps),
                    //auth: 	new Array(saveDuration * fps),
                    //degree:	new Array(saveDuration * fps),
                    //flair: 	new Array(saveDuration * fps)
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
    var recordInterval = setInterval(saveGhostData, 1000 / fps);

	// set up listener for mario grabbed event
	// this will fire the storeData function and stop the saveGameData interval
	tagpro.socket.on('mario', function (mario) {
    	storeData(positions, mario.id, mario.name, mario.time);
    	clearInterval(recordInterval);
    });
    
};




//----------------------------------------------//
// This section plays recorded data as a shadow //
//----------------------------------------------//

// function to get stored data and clean it.
function getStoredData() {
	var dat = GM_getValue('currentBestData');
	if(!dat) return
    dat = JSON.parse(dat);
    if(!dat.positions) { GM_deleteValue('currentBestData'); return}
	for(var i=0; i < dat.positions.x.length; i++) {
		if(dat.positions.x[i] === null) {
			dat.positions.x.shift();
			dat.positions.y.shift();
			i--
		}
	}
	return(dat)
}

// function to start ghost animation
function animateGhost(dat) {
	if(!dat) return
	var i = 0;
	interval = setInterval(function(){
		tagpro.renderer.drawSpawn(dat.positions.x[i],dat.positions.y[i],0,1000/60);
		tagpro.renderer.drawSpawn(dat.positions.x[i],dat.positions.y[i],0,1000/60);
		i++;
		if(i >= dat.positions.x.length) clearInterval(interval);
	}, 1000/60)
}
		


//--------------------------------------------//
// Actually start the recording and animation //
//--------------------------------------------//

// actually start recording
$(document).ready(function() {
    tagpro.ready(function() {
        var dat = getStoredData();
        tagpro.socket.on('time', function(time) {
            if(time.state === 1) {
                recordGhostData();
				animateGhost(dat);
			};
		});
	});
});
