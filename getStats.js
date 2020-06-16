var scheduler = require('node-schedule');
var fs = require('fs');
var getJSON = require('sync-request');

var apiKey = '1e77bbdd-5969-4d8a-8a4d-43092b6471f8',
guildId = '5e58976f8ea8c9832198e154';

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

//var jobDailyStatSave = scheduler.scheduleJob('* * 6 * * *', function() {
  var statsObj = {"date":"", "stats":[]};
  var playerName = "";
  var skillAvg = "";

  console.log("Calculating date...");
  var today = new Date();
  statsObj.date = today.getDate() + ' ' + monthNames[today.getMonth()] + ' ' + today.getFullYear();

  console.log("Requesting guild members...");
  var requestGuild = 'https://api.hypixel.net/guild?key=' + apiKey + '&id=' + guildId;
  var responseGuild = JSON.parse(getJSON('GET', requestGuild).getBody());
  var guildMembers = responseGuild.guild.members;
  for(mem of guildMembers) {
    console.log("");
    console.log("Requesting name for UUID " + mem.uuid + "...");
    var requestPlayer = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + mem.uuid;
    var responsePlayer = JSON.parse(getJSON('GET', requestPlayer).getBody());
    playerName = responsePlayer.player.displayname;

    console.log("Requesting Profiles for " + playerName + "...");
    var requestProfiles = 'https://api.hypixel.net/skyblock/profiles?key=' + apiKey + '&uuid=' + mem.uuid;
    var responseProfiles = JSON.parse(getJSON('GET', requestProfiles).getBody());
    playerProfiles = responseProfiles.profiles;

    var skillAveragesForPlayer = [];
    for(prof of playerProfiles) {
      console.log("Requesting stats for profile " + prof.cute_name + "...");
      var requestProfile = 'https://api.hypixel.net/skyblock/profile?key=' + apiKey + '&profile=' + prof.profile_id;
      var responseProfile = JSON.parse(getJSON('GET', requestProfile).getBody());
      var playerStatsOnProfile = responseProfile.profile.members[mem.uuid];
      var arr = [skillToLevel(playerStatsOnProfile.experience_skill_combat), skillToLevel(playerStatsOnProfile.experience_skill_mining),
                skillToLevel(playerStatsOnProfile.experience_skill_alchemy), skillToLevel(playerStatsOnProfile.experience_skill_farming),
                skillToLevel(playerStatsOnProfile.experience_skill_taming), skillToLevel(playerStatsOnProfile.experience_skill_enchanting),
                skillToLevel(playerStatsOnProfile.experience_skill_fishing), skillToLevel(playerStatsOnProfile.experience_skill_foraging)];
      skillAvg = calcAverageOfArray(arr);
      console.log("Recieved Skill Average of " + skillAvg + " for " + playerName + " on profile " + prof.cute_name);
      skillAveragesForPlayer.push(skillAvg);
    }
    if(Math.max(...skillAveragesForPlayer) == 0) {
      statsObj.stats.push({[playerName]: {"skillAvg": "no api :("}});
    } else {
      statsObj.stats.push({[playerName]: {"skillAvg": Math.max(...skillAveragesForPlayer)}});
    }
  }

  fs.unlink('stats_old.json', function (err) {
    if (err) throw err;
    fs.rename('stats.json', 'stats_old.json', function (err) {
      if (err) throw err;
      fs.writeFile('stats.json', JSON.stringify(statsObj, null, 2), 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
    });
  });
//});

function calcAverageOfArray(arr) {
  var total = 0.0;
  for(i of arr) {
    total += i;
  }
  return Math.round(((total / arr.length) + Number.EPSILON) * 100) / 100;
}

function skillToLevel(skillXP) {
  var levelXP = [0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425, 32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425, 1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425, 9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425, 21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425, 38072425, 40972425, 44072425, 47472425, 51172425, 55172425];
  var i = 0;
  if(skillXP == undefined) { return 0; }
  else {
    while(i < levelXP.length) {
      if(skillXP < levelXP[i]) break;
      i++;
    }
    return i-1 + ((skillXP-levelXP[i-1])/(levelXP[i]-levelXP[i-1]));
  }
}
