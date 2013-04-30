// CoinChat bot

var io = require("socket.io-client");
var started = false;
var users = [];
var chatBuffer = [];
var chance = 20;
var payout = 1.2;
var lastWinner = null;
var socket = io.connect("http://192.155.86.153:8888/");
console.log('Connecting');
socket.on("connect", function() {
    console.log('Connected');
    socket.on("message", function(msg) {
	console.log('SERVER MESSAGE: ' + msg.message);
    });
    function chat(room, msg, color) {
	chatBuffer.push({room: room, message: msg, color: color});
    }
    function tip(obj) {
	chatBuffer.push({tipobj: obj});
    }
    setInterval(function() {	
	if (chatBuffer[0]) {
            socket.emit("getcolors", {});
	    if (chatBuffer[0].tipobj) {
		socket.emit("tip", chatBuffer[0].tipobj);
	    }
	    else {
		socket.emit("chat", chatBuffer[0]);
	    }
	    chatBuffer.splice(0, 1);
	}
    }, 800);
    socket.on("chat", function(data) {
	console.log(data.room + ' | ' + data.user + ' | ' +  data.message);
	
        if (data.message.substring(0, 57) === "<span class='label label-success'>has tipped WhiskDiceBot") {
	    if (started === true) {		    
                var rand = Math.floor(Math.random() * 101);
		if (rand === 0) {
		    rand = 1;
		}
		if (rand >= chance) {
		    console.log('Won!');
		    console.log('Sending');
		    var totip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1) * payout);
		    chat('botgames', data.user + ': You win! Sending ' + totip + ' (' + rand + '/' + chance + ')', "090");
		    lastWinner = data.user;
		    console.log('Emitting');
		    tip({user: data.user, room: 'botgames', tip: totip});
		}
		else {
		    
		    console.log('Lost');
		    chat('botgames', data.user + ': Not a winner, sorry! (Rolled: ' + rand + ', required: over ' + chance + ')', "505");
		    rand = Math.floor(Math.random() * 4);
		    if (rand === 3 && lastWinner) {
                        chat('botgames', lastWinner + ': You won this payment!', "090");
                        totip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1));
			tip({user: lastWinner, room: 'botgames', tip: totip});
			
			
		    }
		}
		
                socket.emit("getbalance", {});
		
            }
	    else {
                chat('botgames', '/bold Game not enabled!', "505");
                totip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1));
                tip({user: data.user, room: 'botgames', tip: totip});
	    }
        }
        if (data.message === "!start" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
	    chat('botgames', '/bold Initializing WhiskDice game (!help for info)', "505");
	    socket.emit("getbalance", {});
	    started = true;
	    
        }
        if (data.message === "!stop" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
	    chat('botgames', '/bold Stopping WhiskDice game (!help for info)', "505");
	    socket.emit("getbalance", {});
	    started = false;
	    
        }
        if (data.message.substring(0, 4) === "!set" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
	    var newOpts = data.message.split(' ');
	    if (newOpts[1] > 0 && newOpts[2] > 0) {
		chance = newOpts[1];
		payout = newOpts[2];
                chat('botgames', '/bold CHANGING PAYOUT/CHANCE! New chance: ' + chance + '% | New payout: ' + payout + 'x' , "505");
	    }
	}
        if (data.message.substring(0, 4) === "!get" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
            tip({user: data.user, room: 'botgames', tip: data.message.split(' ')[1]});
        }
        if (data.message === "!fixbugs" && data.room === "botgames") {
            socket.emit('getcolors', {});
	    chat('botgames', 'Fixed bugs!', "090");
        }
        if (data.message === "!lastwinner" && data.room === "botgames") {
            chat('botgames', 'Last winner: ' + lastWinner, "090");
        }
        if (data.message === "!users" && data.room === "botgames") {
	    socket.emit("joinroom", {room: "botgames"});
            
            chat('botgames', '/bold ' + users.length + ' online users!', "090");
            
        }
        if (data.message === "!bots" && data.room === "botgames") {
            
            chat('botgames', 'Bots | WhiskDiceBot: A clone of SatoshiDice. !help for info. | moobot: lordsonkit\'s fun bot, with cow tipping! !moo help for info.', "090");
            
        }
	if (data.message.substring(0, 4) === "!moo") {
            chat('botgames', data.user + ': Invoked Moobot, expect a PM...', "090");
	}
        if (data.message === "!help" && data.room === "botgames") {
            chat('botgames', data.user + ': Check !state for chance and payout. Tip this bot to play.', "090");
            chat('botgames', data.user + ': Commands: !state to check bot info, !users to list online users, !bots to list bots and how to use them, !lastWinner to see last winner', "090");
            socket.emit("getbalance", {});
	    
        }
        if (data.message === "!state" && data.room === "botgames") {
	    if (started) {
                chat('botgames', data.user + ': Game ready to play! Balance: ' + balance + '| Chance to win: ' + chance + '% | Payout: ' + payout + 'x', "090");
		if (balance < 0 || balance === 0) {
                    chat('botgames', data.user + '/bold Alert: Negative or zero balance detected. Betting may result in monetary loss. Stopping WhiskDice game...', "505");
		    started = false;
		}
	    }
	    else {
                chat('botgames', data.user + ': Game disabled. Don\'t bet!', "505");
	    }
            socket.emit("getbalance", {});
        }
	
    });
    var balance = 0;
    
    
    socket.on("balance", function(data) {
        if (data.change) {
            balance = balance + data.change;
        }
        else {
            balance = data.balance;
        }
        console.log('NEW BALANCE: ' + balance);
        //chat('botgames', '/topic Bot Games - !help for help. | Bot balance: ' + balance + '| Game enabled state: ' + started, "000");
        //chat('botgames', 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), "505");
	if (balance >= 15.25) {
	    setTimeout(function() {
		socket.emit('tip', {user: 'whiskers75', room: 'botgames', tip: balance - 15});
	    }, 30000);
	}
    });
    socket.emit("accounts", {action: "login", username: 'WhiskDiceBot', password: process.env.whiskbotpass});
    socket.on("loggedin", function(data) {
	var username = data.username;
	socket.on("joinroom", function(data) {
	    if (data.room === "botgames") {
		users = data.users;
	    }
	});
	socket.emit('joinroom', {join: 'botgames'});
        socket.emit("quitroom", {room: "main"});
	
	socket.on("newuser", function(data) {
	    users.push(data.username);
	});
	chat('botgames', '/bold WhiskDiceBot initialized! (!help for info)', "090");
	socket.emit("getbalance", {});
        socket.emit('getcolors', {});
        chat('botgames', '/topic Bot Games - !help for help. | !state to check bot state.', "000");
        started = true;
	
	
    });
    
    process.on('SIGTERM', function() {
        
        chat('botgames', '/bold Stopping WhiskDice game and shutting down. No more bets until another WhiskDice game begins!', "505");
        
        
        chat('botgames', '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game currently shut down, no more bets please!', "000");
	
        console.log('Shutting down...');
        process.exit(0);
    });
});
socket.on('error', function(err) {
    console.log('Failed to start');
    console.log(err);
    process.exit(1);
});

