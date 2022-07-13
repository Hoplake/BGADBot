//Invite: https://discord.com/api/oauth2/authorize?client_id=991289700998467704&scope=bot&permissions=1

require('dotenv').config();

const fs = require('fs');

const Discord = require('discord.js');
const Bot = new Discord.Client({
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS','DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS'],
  partials:['MESSAGE', 'REACTION', 'USER', 'CHANNEL', 'GUILD_MEMBER']
});

const prefix = '!';

let coopJson = [];
let twoplayersJson = [];
let gamesJson = [];
let gamedata = [];

fs.readFile('./public/games.json', 'utf8', (error, data) => {
  if (error) {
    console.log(error);
    return;
  }
  gamedata = JSON.parse(data);

  fillGames(gamedata);
});

Bot.once('ready', () => {
  console.log(`Logged in as ${Bot.user.tag}!`);
});

Bot.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  let attribute = '';
  let randomGame = '';

  if (args.length > 0) {
    attribute = args.shift().toLowerCase();
  }
  console.log(command);
  console.log(attribute);
  if (command === 'pick') {
    switch(attribute) {
      case '2p':
        randomGame = getRandomItem(twoplayersJson);
        break;
      case 'coop':
        randomGame = getRandomItem(coopJson);
        break;
      case 'timer':
        if (args.length > 0) {
          setupTimer(args.shift().toLowerCase(), message.channel);
        } else {
          message.reply('You should tell me the time in minutes.');
        }

        break;
      default:
        randomGame = getRandomItem(gamesJson);
    }

    if(randomGame.length > 0) {
      sendMessage(randomGame, message.channel);
    }

  }
  if (command === 'list') {
    switch(attribute) {
      case '2p':
        message.reply(twoplayersJson.join(', '));
        break;
      case 'coop':
        message.reply(coopJson.join(', '));
        break;
      default:
        message.reply(gamesJson.join(', '));
    }
  }

  if (command === 'help') {
    message.reply('!pick [2p/coop/timer n]\n!list [2p/coop]');
  }
});

function setupTimer(time, channel) {
  console.log(time);

  channel.send('Wanna play a game in ' + time + ' minutes?').then(message => message.awaitReactions({ time: time*60000})
	.then(collected => {
    console.log(`After time ${collected.size} reactions.`);
    let reactionGames = [];
    for (let i = 0; i < gamedata.length; i++) {
      if (gamedata[i].maxp >= collected.size && gamedata[i].minp <= collected.size) {
        reactionGames.push(gamedata[i].name);
      }
    }

    if(reactionGames.length > 0) {
      sendMessage(getRandomItem(reactionGames), channel);
    } else {
      channel.send('No game found for ' + collected.size + ' players.');
    }
  })
  );
}

function fillGames(data) {
  coopJson = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].coop) {
      coopJson.push(data[i].name);
    }
  };

  twoplayersJson = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].maxp >= 2 && data[i].minp <= 2) {
      twoplayersJson.push(data[i].name);
    }
  }

  gamesJson = [];
  for (let i = 0; i < data.length; i++) {
    gamesJson.push(data[i].name);
  }
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sendMessage(gameName, channel) {
  let game = gamedata.find(({name}) => name == gameName);
  let embed = new Discord.MessageEmbed();
  console.log(game);
  embed.setTitle(game.name);
  embed.setDescription(game.description);
  embed.setColor('#0099ff');
  embed.setImage(process.env.COVER_URL + game.cover);
  if(game.minp != game.maxp) {
    embed.addField('Players', game.minp + '-' + game.maxp);
  } else {
    embed.addField('Players', game.minp);
  }
  embed.addFields(
    { name: 'BoardGameArena', value: Discord.Formatters.hyperlink('Link to BGA', game.bga)},
    { name: 'BoardGameGeek', value: Discord.Formatters.hyperlink('Link to BGG', game.url)}
  );

  channel.send({embeds: [embed]}).then(message => setTimeout(checkReactions, 10000, message, channel));
}

function checkReactions(message, channel) {
  channel.messages.fetch(message.id).then(message => {
    console.log(message.reactions.cache.size);
  }).catch(error => {console.log(error);});
}


Bot.login(process.env.CLIENT_TOKEN);