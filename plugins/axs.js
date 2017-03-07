var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require('../startbot.js');
var request = require("request");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var AxSServer = amazejs.getAxSId();
var config = amazejs.getConfig();

exports.commands = {
	curmatch: {
		permission: "axs.host.curmatch",
		description: "This will set the multiplayer match for yourself. This is used for the command \"calculate\".",
		usage: "curmatch [mproomID] [Team 1 name] [Team 2 name]",
		examples: ["curmatch 25200157 1_Miss_Gods Never_Give_Up", "curmatch 30870075 wesley_is_the_best sartan_is_the_best"],
		func: function(argsm, context, reply) {

		}
	},
	calculate: {
		permission: "axs.host.calculate",
		description: "This will calculate the scores of a multiplayer game with the AxS score system.",
		usage: "calculate",
		examples: ["calculate"],
	    func: function(argsm, context, reply) {

		}
	}
};

function addDot(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
}

// Return _ALL_ match details
function getMatchJSON(mp_id, team1, team2, callback) {
    request({
        url: "https://osu.ppy.sh/api/get_match?k=" + config.apiKeys.osu + "&mp=" + mp_id
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(JSON.parse(body), mp_id, team1, team2);
        } else {
            console.error("Failed!");
            callback([]);
        }
    });
}

// Return the beatmap artist title and difficulty
function getBeatmapJSON(beatmap_id, callback) {
    request({
        url: "https://osu.ppy.sh/api/get_beatmaps?k=" + config.apiKeys.osu + "&b=" + beatmap_id
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            returnjson = JSON.parse(body);

            callback(returnjson[0].artist + " - " + returnjson[0].title + " [" + returnjson[0].version + "]");
        } else {
            console.error("Failed");
            callback([]);
        }
    });
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}
