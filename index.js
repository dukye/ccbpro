var http = require('http');
var https = require('https');
const Discord = require('discord.js');
const Client = require('node-rest-client').Client;
const rp = require('request-promise');
const bot = new Discord.Client();
const api = new Client();

TEST_MODE = false;
USERNAME = 'Phil_RX';
CHANNELS_TO_WATCH_FR = ['analyses-forex', 'analyses-actions', 'analyses-crypto'];
CHANNELS_TO_POST_FR = ['analyses-phil'];
CHANNELS_TO_WATCH_EN = ['analysis-forex', 'analysis-stock-market', 'analysis-crypto'];
CHANNELS_TO_POST_EN = ['analysis-phil'];
DOMAIN_TV = 'tradingview.com';

// Just run a little http page
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(process.env.PORT || 8080);
console.log('HTTP Server running & listening...');

/**
 * Rich embed discord
 * @type {Discord}
 */
const makeEmbed = (title, message, elements = []) => {
  const embed = new Discord.RichEmbed()
    .setTitle(`${title}`)
    // .setAuthor('CryptoBot', 'http://kedu.fr/image.png')
    .setColor(0x4671ed)
    .setDescription(message)
    .setTimestamp()
    .setFooter('-- to the moon');

    if (elements.length > 0) {
      elements.forEach((obj, i) => {
        embed.addField(obj.title, obj.value, true)
      });
    }
  return embed;
};

/**
 * Post on multiple channel
 * @param  {object} message - discord message instance
 * @param  {array} channels - array of channels to post on
 * @return {bool}
 */
const postOn = (message, channels) => {
  if (channels.length > 0) {
    channels.forEach((channel, i) => {
      message.guild.channels.find('name', channel).send(message.content);
    });
    return true;
  }
  return false;
};

if (!Array.prototype.inArray) {
  Array.prototype.inArray = function(element) {
    return this.indexOf(element) > -1;
  };
} 

bot.on('ready', () => {
  console.log('Discord Bot is running...');
});

/**
 * @todo
 * need to simplify url regex into a single condition
 */
bot.on('message', message => {
  const user = message.author;
  const msg = message.content;

  if (message.content === 'ping') {
    message.reply('pong');
  }

  console.log(`--> Request from ${user.username} in ${message.channel.name}`);
  // FR
  if (user.username === USERNAME && CHANNELS_TO_WATCH_FR.inArray(message.channel.name)) {
    var matches = msg.match(/https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1].replace('www.', '');
    
    // Tradingview ?
    if (domain === DOMAIN_TV) {
      // message.channel.send(msg);
      // message.guild.channels.find('name', 'test').sendMessage(msg);
      postOn(message, CHANNELS_TO_POST_FR);
    }
  }
  // EN
  if (user.username === USERNAME && CHANNELS_TO_WATCH_EN.inArray(message.channel.name)) {
    var matches = msg.match(/https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1].replace('www.', '');
    
    // Tradingview ?
    if (domain === DOMAIN_TV) {
      // message.channel.send(msg);
      // message.guild.channels.find('name', 'test').sendMessage(msg);
      postOn(message, CHANNELS_TO_POST_EN);
    }
  }
});

bot.login(process.env.DISCORDBOT);

// pings server every 15 minutes to prevent dynos from sleeping
setInterval(() => {
  if (!TEST_MODE) {
    https.get('https://discordbot-pro.herokuapp.com/');
  }
}, 900000);
