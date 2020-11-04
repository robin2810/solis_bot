var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var getJSON = require('sync-request');
var fs = require('fs');
var nbt = require('nbt');
var scheduler = require('node-schedule');
require('.');

var commandsHypixel = /*["initiateping <start|stop>", */["verify <name#tag>", "ping", "memberlist", "inventories <ign>", "leaderboard <stat> [\"change\"]", "trustedvote <name> <interview|promotion> [@]"],
leaderboardStats = ["skillAverage", "slayerXp", "slayerLevels"],
initiatePing,
apiKey = '1e77bbdd-5969-4d8a-8a4d-43092b6471f8',
guildId = '5e58976f8ea8c9832198e154',
ms_to_day = 86400000,
xhat_uid = '238700956873654272';

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

var jobConnectBot = scheduler.scheduleJob('*/30 * * * * *', function() {
  if(!bot.connected) {
    bot.connect();
  }
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    logger.info('Current working dir: ' + __dirname);

    if(Object.keys(bot.channels).includes('720868375156490290')) {
      var jobCurrentGuildMembers = scheduler.scheduleJob('0 * * * * *', function() {
        var request = 'https://api.hypixel.net/guild?key=' + apiKey + '&id=' + guildId;
        var numOfMembers = 0;
        try {
          var response = JSON.parse(getJSON('GET', request).getBody());
          var numOfMembers = response.guild.members.length;
        } catch(err) {
          console.log(err);
        }
        if(numOfMembers != 0) {
          bot.editChannelInfo({
            channelID: '720868375156490290',
            name: "Guild Members: " + numOfMembers
          }, function(err, res) {
            if(err) {
              console.log(err);
            }
          });
        }
      });
    }
});

bot.on('guildMemberAdd', function(member) {
  var usersArray = Object.values(bot.users);
  if(usersArray.find(usersArray => usersArray.id === member.id).bot == false) {
    bot.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '685302841224855572' //Normies
    });
    bot.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '685303000381915175' //Guest
    });
  } else {
    bot.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '685635246628012043' //Bot
    });
    bot.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '685637329725030400' //Robo Normies
    });
  }
});

bot.on('message', async function (user, userID, channelID, message, evt) {

    var serverID = evt.d.guild_id;

    if (message.substring(0, 1) == '!') {
      var args = message.substring(1).split(' ');
      var cmd = args[0];
      var cmd2 = args[1];

      //args = args.splice(1);
      switch(cmd) {
        case 'apply':
          bot.sendMessage({
            to: channelID,
            message: "https://forms.gle/4dNx1kgxzrYtqjxe7",
            embed: out
          });
          console.log('--- Forms-Link requested by ' + evt.d.author.username + '#' + evt.d.author.discriminator);
        break;
      }
    }

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '&') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var cmd2 = args[1];

        //args = args.splice(1);
        switch(cmd) {

            // &leaderboard <stat>
            case 'leaderboard':
              var returnObj = {"date_new":"", "date_old":"", "stats":[]};
              var statsObj, oldStatsObj, stat, textStat, valArray;
              var sortByChange = false;

              const skillAvgValues = [50, 45, 40, 35, 30, 27.5, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 15, 12.5, 10, 5, 0];
              const skillAvgValuesByChange = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0.04, 0.03, 0.02, 0.01, 0.0];
              const slayerXpValues = [3000000, 300000, 220000, 140000, 60000, 45000, 30000, 15000, 11000, 7000, 4000, 2200, 1400, 600, 45, 15, 0];
              const slayerXpValuesByChange = [3000000, 300000, 100000, 50000, 10000, 5000, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 0];
              const slayerLevelsValues = [27, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 6, 3, 0];
              const slayerLevelsValuesByChange = [27, 21, 18, 15, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

              if(cmd2 == "skillAverage") {
                stat = "skillAvg"; dispStat = "skillAvg"; textStat = "Skill Average"; valArray = skillAvgValues; granularity = 0.01;
                if(args[2] == "change") {
                  sortByChange = true; valArray = skillAvgValuesByChange; granularity = 0.01;
                }
              } else if(cmd2 == "slayerXp") {
                stat = "slayerXp"; dispStat = "slayerXp"; textStat = "Total Slayer XP"; valArray = slayerXpValues; granularity = 1;
                if(args[2] == "change") {
                  sortByChange = true; valArray = slayerXpValuesByChange; granularity = 1;
                }
              } else if(cmd2 == "slayerLevels") {
                stat = "totalSlayerLevel"; dispStat = "slayerLevels"; textStat = "Total Slayer Levels"; valArray = slayerLevelsValues; granularity = 1;
                if(args[2] == "change") {
                  sortByChange = true; valArray = slayerLevelsValuesByChange; granularity = 1;
                }
              }
              if(cmd2 == "help" || !leaderboardStats.includes(cmd2)) {
                bot.sendMessage({
                  to: channelID,
                  message: "Usage: \'&leaderboard <stat> [\"change\"]\'\n currently available stats: " + leaderboardStats.join(", ") + "\noptional parameter [\"change\"] sorts stats by change"
                });
              } else {
                fs.readFile(__dirname + '/stats.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                    console.log(err);
                  } else {
                    fs.readFile(__dirname + '/stats_old.json', 'utf8', function readFileCallback(err, data_old){
                      if (err){
                        console.log(err);
                      } else {
                        statsObj = JSON.parse(data);
                        oldStatsObj = JSON.parse(data_old);
                        returnObj.date_new = statsObj.date;
                        returnObj.date_old = oldStatsObj.date;

                        for(mem of statsObj.stats) {
                          var bool = false;
                          for(oldMem of oldStatsObj.stats) {
                            if(Object.keys(oldMem)[0] == Object.keys(mem)[0]) {
                              if(oldMem[Object.keys(oldMem)[0]][stat] == "no api" && mem[Object.keys(mem)[0]][stat] != "no api") {
                                returnObj.stats.push({[Object.keys(mem)[0]]: {"old": mem[Object.keys(mem)[0]][stat], "new": mem[Object.keys(mem)[0]][stat], "dispNew": formatDecimalSeperator(mem[Object.keys(mem)[0]][dispStat])}});
                              } else {
                                returnObj.stats.push({[Object.keys(mem)[0]]: {"old": oldMem[Object.keys(oldMem)[0]][stat], "new": mem[Object.keys(mem)[0]][stat], "dispNew": formatDecimalSeperator(mem[Object.keys(mem)[0]][dispStat])}});
                              }
                              break;
                            }
                          }
                        }
                        for(var j = returnObj.stats.length-1; j > 0; j--) {
                          if(sortByChange) {
                            for(var i = 0; i < j; i++) {
                              if(returnObj.stats[i][Object.keys(returnObj.stats[i])[0]].new == "no api") {
                                var tempObj = returnObj.stats[j];
                                returnObj.stats[j] = returnObj.stats[i];
                                returnObj.stats[i] = tempObj;
                              } else if((returnObj.stats[i][Object.keys(returnObj.stats[i])[0]].new - returnObj.stats[i][Object.keys(returnObj.stats[i])[0]].old) < (returnObj.stats[i+1][Object.keys(returnObj.stats[i+1])[0]].new - returnObj.stats[i+1][Object.keys(returnObj.stats[i+1])[0]].old)) {
                                var tempObj = returnObj.stats[i+1];
                                returnObj.stats[i+1] = returnObj.stats[i];
                                returnObj.stats[i] = tempObj;
                              }
                            }
                          } else {
                            for(var i = 0; i < j; i++) {
                              if(returnObj.stats[i][Object.keys(returnObj.stats[i])[0]].new == "no api") {
                                var tempObj = returnObj.stats[j];
                                returnObj.stats[j] = returnObj.stats[i];
                                returnObj.stats[i] = tempObj;
                              } else if(returnObj.stats[i][Object.keys(returnObj.stats[i])[0]].new < returnObj.stats[i+1][Object.keys(returnObj.stats[i+1])[0]].new) {
                                var tempObj = returnObj.stats[i+1];
                                returnObj.stats[i+1] = returnObj.stats[i];
                                returnObj.stats[i] = tempObj;
                              }
                            }
                          }
                        }

                        var out = {"color": 16777215, "fields": []};
                        var pos = 1;
                        for(entry of returnObj.stats) {
                          for(i in valArray) {
                            var diff = Math.round( ((entry[Object.keys(entry)[0]].new + Number.EPSILON)*100) - ((entry[Object.keys(entry)[0]].old + Number.EPSILON)*100) ) / 100;
                            if(sortByChange) {
                              if(valArray[i-1] >= diff && diff > valArray[i]) {
                                out = setEmbedValues(pos, formatDecimalSeperator(Math.round(((valArray[i]+granularity) + Number.EPSILON) * 100) / 100) + "-" + formatDecimalSeperator(Math.round((valArray[i-1] + Number.EPSILON) * 100) / 100), out, entry);
                                pos++;
                              }
                            } else {
                              if(valArray[i-1] >= entry[Object.keys(entry)[0]].new && entry[Object.keys(entry)[0]].new > valArray[i]) {
                                out = setEmbedValues(pos, formatDecimalSeperator(Math.round(((valArray[i]+granularity) + Number.EPSILON) * 100) / 100) + "-" + formatDecimalSeperator(Math.round((valArray[i-1] + Number.EPSILON) * 100) / 100), out, entry);
                                pos++;
                              }
                            }
                          }
                          if(sortByChange && (entry[Object.keys(entry)[0]].new - entry[Object.keys(entry)[0]].old) == 0) {
                            //out = setEmbedValues(pos, "0.0", out, entry);
                            pos++;
                          }
                          if(entry[Object.keys(entry)[0]].new == "no api" && !(sortByChange)) {
                           out = setEmbedValues(pos, "no api", out, entry);
                           pos++;
                          }
                        }
                        if(out.fields.length == 0) {
                          bot.sendMessage({
                            to: channelID,
                            message: "***" + textStat + "*** *" + returnObj.date_old + " -> " + returnObj.date_new + "*" + "\n\n ***---There is no Info available for your request---***"
                          });
                        } else {
                          out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "```";

                          bot.sendMessage({
                            to: channelID,
                            message: "***" + textStat + "*** *" + returnObj.date_old + " -> " + returnObj.date_new + "*",
                            embed: out
                          });
                        }
                      }
                    });
                  }
                });
              }
            break;

            // &inventories <Username>
            case 'inventories':
              if(args.length > 2) {
                console.log("false");
              } else {
                var inv = getInventory(args[1]);
                for (var i=0; i<inv.length; i++) {
                  if(inv[i].inv == "no_data") {
                    bot.sendMessage({
                      to: channelID,
                      message: "no API access for profile " + inv[i].name
                    });
                  } else {
                    var filename = __dirname + '/inv_'+inv[i].name+'.txt';
                    fs.writeFile(filename, inv[i].inv, 'utf8', (err) => {
                      if (err) throw err;
                      bot.uploadFile( {
                        to: channelID,
                        file: filename,
                        filename: null,
                        message: "here, have this base64 decoded, but still gzipped mess. im too lazy do keep on going"
                      }, function (err, res) {
                        fs.unlink(filename, function (err) {
                          if (err) throw err;
                        });
                      });
                    });
                  }
                }
              }
            break;

            // &memberlist
            case 'memberlist':
              var usersList = bot.users;
              var usersArray = Object.values(bot.users);
              var membersList = Object.values(bot.servers[serverID].members);
              var out = "";
              for (key in usersList) {
                if(usersList[key].bot == false) {
                  var nickname = membersList.find(membersList => membersList.id === key).nick;
                  console.log(nickname);
                  var name = "";
                  if(nickname != undefined) {
                    name = nickname;
                  } else {
                    name = usersList[key].username;
                  }
                  out = out.concat(name.replace(/_/g, "\\_").replace(/~/g, "\\~").replace(/\*/g, "\\*"), "\n");
                }
              }
              bot.sendMessage({
                to: channelID,
                message: "==========\n" + out + "==========\nDon't mind me, I'm just here for Boeboe's testing purposes"
              });
            break;

            // &verify <discordtag>
            case 'verify':
              temp = args;
              temp.shift();
              cmd2 = temp.join(' ');
              console.log(cmd2);
              if(cmd2 == null) {
                bot.sendMessage({
                    to: channelID,
                    message: 'wrong usage, try: &verify <discordtag#number>'
                });
              } else {
                var discordtag = cmd2.split("#");
                cmd2 = discordtag[0] + "#" + discordtag[1];
                var usersArray = Object.values(bot.users);
                if(usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]) != undefined) {
                  if(usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]).bot == true) {
                    bot.sendMessage({
                      to: channelID,
                      message: cmd2 + " is a bot!"
                    });
                  } else {
                    var userIdFromDisctag = usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]).id;
                    bot.addToRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685302948095328268' //friend
                    });
                    await Sleep(1000);
                    bot.addToRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685290524747235338' //members
                    });
                    await Sleep(1000);
                    bot.addToRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685290264843386969' //member
                    });
                    await Sleep(1000);
                    bot.addToRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685303138986885203' //ranks
                    });
                    await Sleep(1000);
                    bot.addToRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685303866392182785' //silver
                    });
                    await Sleep(1000);
                    bot.removeFromRole({
                      serverID: '685284276362543115',
                      userID: userIdFromDisctag,
                      roleID: '685303000381915175' //guest
                    });
                    await Sleep(1000);
                    bot.sendMessage({
                      to: channelID,
                      message: cmd2 + " verified!"
                    });
                  }
                } else {
                  bot.sendMessage({
                    to: channelID,
                    message: "User " + cmd2 + " not found!"
                  });
                }
              }
            break;

            // &trustedvote <name>
            case 'trustedvote':
              var msg = "";
              var rightUsage = true;

              if(args[3] == '@') {
                msg = '@everyone\n';
              } else if(args[3] != null){
                msg = 'wrong usage: use &trustedvote <name> <interview|promotion> [@]';
                rightUsage = false;
              }

              if(args[2] == 'interview') {
                msg = msg + 'setup an interview with ' + args[1] + ' for Trusted?'
              } else if(args[2] == 'promotion') {
                msg = msg + 'promote ' + args[1] + ' to Trusted?';
              } else {
                msg = 'wrong usage: use &trustedvote <name> <interview|promotion> [@]';
                rightUsage = false;
              }
              bot.sendMessage({
                to: channelID,
                message: msg
              }, async function(err, res) {
                if(rightUsage == true) {
                  bot.deleteMessage({
                    channelID: channelID,
                    messageID: evt.d.id,
                  });
                  await Sleep(2500);
                  bot.addReaction({
                    channelID: channelID,
                    messageID: res.id,
                    reaction: '🙂'
                  });
                  await Sleep(2500);
                  bot.addReaction({
                    channelID: channelID,
                    messageID: res.id,
                    reaction: '🙁'
                  });
                }
              });
            break;

            // &help
            case 'help':
              bot.sendMessage({
                  to: channelID,
                  message: 'you can use the following commands: &' + commandsHypixel.join(', &')
              });
            break;

            case 'ping':
              bot.sendMessage({
                to: channelID,
                message: 'pong'
              })
            break;

            //default
            default:
              bot.sendMessage({
                  to: channelID,
                  message: 'unknown command, try: &' + commandsHypixel.join(', &')
              });
            break;
         }
     }
});

function getInventory(uName) {
  var requestPlayerUuid = "https://api.hypixel.net/player?key=" + apiKey + "&name=" + uName;
  var responsePlayerUuid = JSON.parse(getJSON('GET', requestPlayerUuid).getBody());
  var playerUuid = responsePlayerUuid.player.uuid;

  var profiles = [];
  var reqeustUuidProfiles = "https://api.hypixel.net/skyblock/profiles?key=" + apiKey + "&uuid=" + playerUuid;
  var responseUuidProfiles = JSON.parse(getJSON('GET', reqeustUuidProfiles).getBody());
  for (var i=0; i<responseUuidProfiles.profiles.length; i++) {
    profiles.push({id: responseUuidProfiles.profiles[i].profile_id, name: responseUuidProfiles.profiles[i].cute_name});
  }

  var inventories = [];
  for (var i=0; i<profiles.length; i++) {
    var requestProfile = "https://api.hypixel.net/skyblock/profile?key=" + apiKey + "&profile=" + profiles[i].id;
    var responseProfile = JSON.parse(getJSON('GET', requestProfile).getBody());
    var inv_contents = responseProfile.profile.members[playerUuid].inv_contents;
    if(inv_contents == undefined) {
      inventories.push({id: profiles[i].id, name: profiles[i].name, inv: "no_data"});
    } else {
      inventories.push({id: profiles[i].id, name: profiles[i].name, inv: decodeBase64(inv_contents.data)});
    }
  }

  return inventories;

}

function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function decodeBase64(s) {
    var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
}

function setEmbedValues(position, name, out, entry) {
  if(Object.keys(out.fields).length == 0) {
    out.fields.push({"name": name, "value": "```css\n"});
  } else if(out.fields[out.fields.length-1].name != name) {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "```";
    out.fields.push({"name": name, "value": "```css\n"});
  }
  out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + ('#'+position).padEnd(5, ' ') + Object.keys(entry)[0] + ": " + (entry[Object.keys(entry)[0]].dispNew).toString().replace(".", "․") + " [";
  if(entry[Object.keys(entry)[0]].new != "no api" && entry[Object.keys(entry)[0]].old == "no api") {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "+-0] " + '➡\n';
  } else if(entry[Object.keys(entry)[0]].new == entry[Object.keys(entry)[0]].old) {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "+-0] " + '➡\n';
  } else if(entry[Object.keys(entry)[0]].new > entry[Object.keys(entry)[0]].old) {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "+" + Math.round(((entry[Object.keys(entry)[0]].new - entry[Object.keys(entry)[0]].old) + Number.EPSILON) * 100) / 100 + "] " + '↗\n';
  } else if(entry[Object.keys(entry)[0]].new < entry[Object.keys(entry)[0]].old) {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + Math.round(((entry[Object.keys(entry)[0]].new - entry[Object.keys(entry)[0]].old) + Number.EPSILON) * 100) / 100 + "] " + '↘\n';
  } else {
    out.fields[out.fields.length-1].value = out.fields[out.fields.length-1].value + "\n";
  }

  return out;
}

function formatDecimalSeperator(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
