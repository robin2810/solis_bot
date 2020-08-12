var scheduler = require('node-schedule');
var fs = require('fs');
var getJSON = require('sync-request');

var apiKey = '1e77bbdd-5969-4d8a-8a4d-43092b6471f8',
guildId = '5e58976f8ea8c9832198e154';

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

var jobDailyStatSave = scheduler.scheduleJob('0 0 7/1 * * *', function() {
  var statsObj = {"date":"", "stats":[]};
  var playerName = "";
  var skillAvg = "";

  fs.readFile(__dirname + '/stats.json', 'utf8', async function readFileCallback(err, data){

    var d = new Date(JSON.parse(data).date);
    console.log("Calculating date...");
    var today = new Date();
    statsObj.date = today.getUTCDate() + ' ' + monthNames[today.getUTCMonth()] + ' ' + today.getUTCFullYear() + ' (' + getTime(today) + ')';

    if(d.getDate() != today.getDate() || d.getMonth() != today.getMonth() || d.getFullYear() != today.getFullYear()) {

      console.log("Requesting guild members...");
      var requestGuild = 'https://api.hypixel.net/guild?key=' + apiKey + '&id=' + guildId;
      var responseGuild = JSON.parse(getJSON('GET', requestGuild).getBody());
      await Sleep(1000);
      var guildMembers = responseGuild.guild.members;
      for(mem of guildMembers) {
        console.log("");
        console.log("Requesting name for UUID " + mem.uuid + "...");
        var requestPlayer = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + mem.uuid;
        var responsePlayer = JSON.parse(getJSON('GET', requestPlayer).getBody());
        await Sleep(1000);
        playerName = responsePlayer.player.displayname;

        console.log("Requesting Profiles for " + playerName + "...");
        var requestProfiles = 'https://api.hypixel.net/skyblock/profiles?key=' + apiKey + '&uuid=' + mem.uuid;
        var responseProfiles = JSON.parse(getJSON('GET', requestProfiles).getBody());
        await Sleep(1000);
        playerProfiles = responseProfiles.profiles;

        var skillAveragesForPlayer = [0];
        var slayerForPlayer = ["", 0, 0];
        if(playerProfiles != null) {
          for(prof of playerProfiles) {
            console.log("Requesting stats for profile " + prof.cute_name + "...");
            var requestProfile = 'https://api.hypixel.net/skyblock/profile?key=' + apiKey + '&profile=' + prof.profile_id;
            var responseProfile = JSON.parse(getJSON('GET', requestProfile).getBody());
            await Sleep(1000);
            var playerStatsOnProfile = responseProfile.profile.members[mem.uuid];

            //Skill Average
            var arr = [skillToLevel(playerStatsOnProfile.experience_skill_combat), skillToLevel(playerStatsOnProfile.experience_skill_mining),
              skillToLevel(playerStatsOnProfile.experience_skill_alchemy), skillToLevel(playerStatsOnProfile.experience_skill_farming),
              skillToLevel(playerStatsOnProfile.experience_skill_taming), skillToLevel(playerStatsOnProfile.experience_skill_enchanting),
              skillToLevel(playerStatsOnProfile.experience_skill_fishing), skillToLevel(playerStatsOnProfile.experience_skill_foraging)];
            skillAvg = Math.round((calcAverageOfArray(arr) + Number.EPSILON) * 100) / 100;
            console.log("Recieved Skill Average of " + skillAvg + " for " + playerName + " on profile " + prof.cute_name);
            skillAveragesForPlayer.push(skillAvg);

            //Slayer
            if(playerStatsOnProfile.slayer_bosses == undefined || (playerStatsOnProfile.slayer_bosses.zombie.xp == undefined & playerStatsOnProfile.slayer_bosses.spider.xp == undefined && playerStatsOnProfile.slayer_bosses.wolf.xp == undefined)) {
              var slayerLevels = "";
              var totalSlayerLevel = 0;
              var slayerXp = 0;
            } else {
              var slayerLevels = Object.keys(playerStatsOnProfile.slayer_bosses.zombie.claimed_levels).length + "/" + Object.keys(playerStatsOnProfile.slayer_bosses.spider.claimed_levels).length + "/" + Object.keys(playerStatsOnProfile.slayer_bosses.wolf.claimed_levels).length;
              var totalSlayerLevel = Object.keys(playerStatsOnProfile.slayer_bosses.zombie.claimed_levels).length + Object.keys(playerStatsOnProfile.slayer_bosses.spider.claimed_levels).length + Object.keys(playerStatsOnProfile.slayer_bosses.wolf.claimed_levels).length;
              console.log("Recieved Slayer Levels " + slayerLevels + " for " + playerName + " on profile " + prof.cute_name);
              var slayerXp = playerStatsOnProfile.slayer_bosses.zombie.xp + playerStatsOnProfile.slayer_bosses.spider.xp + playerStatsOnProfile.slayer_bosses.wolf.xp;
              console.log("Recieved Total Slayer XP of " + slayerXp + " for " + playerName + " on profile " + prof.cute_name);
              if(slayerXp > slayerForPlayer[2]) {
                slayerForPlayer = [];
                slayerForPlayer.push(slayerLevels);
                slayerForPlayer.push(totalSlayerLevel);
                slayerForPlayer.push(slayerXp);
              }
            }
          }
        }

        var playerStats = {"skillAvg":"", "slayerLevels":"", "totalSlayerLevel":"", "slayerXp":""};

        if(Math.max(...skillAveragesForPlayer) == 0) {
          playerStats.skillAvg = "no api";
        } else {
          playerStats.skillAvg = Math.max(...skillAveragesForPlayer);
        }

        if(slayerForPlayer[0] == "") {
          playerStats.slayerLevels = "no api";
          playerStats.totalSlayerLevel = "no api";
          playerStats.slayerXp = "no api";
        } else {
          playerStats.slayerLevels = slayerForPlayer[0];
          playerStats.totalSlayerLevel = slayerForPlayer[1];
          playerStats.slayerXp = slayerForPlayer[2];
        }

        statsObj.stats.push({[playerName]: playerStats});
      }

      fs.writeFile(__dirname + '/stats_old.json', data, 'utf8', (err) => {
        if (err) throw err;
        console.log('The stats have been copied to stats_old!');
        fs.writeFile(__dirname + '/stats.json', JSON.stringify(statsObj, null, 2), 'utf8', (err) => {
          if (err) throw err;
          console.log('The new stats have been saved!');
        });
      });
    }
  });
});

function calcAverageOfArray(arr) {
  var total = 0.0;
  for(i of arr) {
    total += i;
  }
  return (total / arr.length);
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
    if(i > 50) {
      return 50;
    } else {
      return i-1 + ((skillXP-levelXP[i-1])/(levelXP[i]-levelXP[i-1]));
    }
  }
}

function getTime(date) {
  if(date.getUTCHours() == 0) {
    return '12:' + (date.getUTCMinutes()).toString().padStart(2, '0') + 'am UTC';
  } else if(date.getUTCHours() < 12) {
    return date.getUTCHours() + ':' + (date.getUTCMinutes()).toString().padStart(2, '0') + 'am UTC';
  } else if(date.getUTCHours() == 12) {
    return '12:' + (date.getUTCMinutes()).toString().padStart(2, '0') + 'pm UTC';
  } else {
    return (date.getUTCHours()-12) + ':' + (date.getUTCMinutes()).toString().padStart(2, '0') + 'pm UTC';
  }
}

function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}
