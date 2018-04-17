const express = require('express')
const app = express()
const cheerio = require('cheerio')
const RSS = require('rss');
const request = require('request');
const resolveRelative = require('resolve-relative-url');

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

/**
 * [description]
 * @param  {[type]} req  [description]
 * @param  {[type]} res) {             res.send('hello world');} [description]
 * @return {[type]}      [description]
 */
app.get('/', function(req, res) {
  res.send('hello world');
});

app.get('/rss', (req, res) => {
    var usersRequested = (req.query.users || 'PRO_Indicators').split(',')
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    var feedItems = []

    var doneRequests = 0;
    
    for (let userIndex in usersRequested) {
        var user = usersRequested[userIndex]
        if (typeof user === 'string') {
          console.log('Running for ' + user)
          request('https://www.tradingview.com/u/' + user, function (error, response, html) {
              if (!error && response.statusCode == 200) {
                  const $ = cheerio.load(html);

                  $('.js-feed-item .js-widget-idea').each(function(i, element) {
                      const title = $(this).find('.tv-widget-idea__title-name').text().trim()
                      const url = resolveRelative($(this).find('.tv-widget-idea__title').attr('href'), response.request.uri.href)
                      const author = $(this).find('.tv-user-link__name').text().trim()
                      const date = parseInt($(this).find('.tv-widget-idea__time').attr('data-timestamp'), 10) * 1000
                      const image = $(this).find('.tv-widget-idea__cover-link img').attr('src')
                      const description = $(this).find('.tv-widget-idea__description-text').text().trim()
                              + '<br /><img src="' + image + '" />'

                      const feedItem = {
                          title: title,
                          description: description,
                          url: url,
                          author: author,
                          date: date
                      }

                      feedItems.push(feedItem)
                  })

              }

              doneRequests++;
              if (doneRequests == usersRequested.length) {
                  // Sort items by date
                  feedItems = feedItems.sort((a,b) => {
                      return b.date - a.date
                  })

                  // Add to feed
                  const feed = new RSS({
                      title: 'TradingView Ideas',
                      feed_url: fullUrl,
                      site_url: fullUrl
                  });
                  feedItems.forEach(item => feed.item(item))

                  // Output
                  console.log('Done')
                  res.set('Content-Type', 'application/rss+xml');
                  res.send(feed.xml({indent: true}))
              }
          });
        }
    }
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Started at :' + PORT)
})


// Just run a little http page
// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World\n');
// }).listen(process.env.PORT || 8080);
// console.log('HTTP Server running & listening...');

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
 * Timestamp to HumanReadable date
 */
function getDateTimeFromTimestamp(unixTimeStamp) {
  var date = new Date(unixTimeStamp);
  return ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
}

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
 * Bot message
 */
bot.on('message', message => {
  const user = message.author;
  const msg = message.content;

  if (message.content === 'ping') {
    message.reply('pong');
  }

  // console.log(`--> Request from ${user.username} in ${message.channel.name}`);
  // FR
  if ((user.username == USERNAME || user.username == 'duke') && CHANNELS_TO_WATCH_FR.inArray(message.channel.name)) {
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
  if ((user.username == USERNAME || user.username == 'duke') && CHANNELS_TO_WATCH_EN.inArray(message.channel.name)) {
    var matches = msg.match(/https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1].replace('www.', '');
    
    // Tradingview ?
    if (domain === DOMAIN_TV) {
      // message.channel.send(msg);
      // message.guild.channels.find('name', 'test').sendMessage(msg);
      postOn(message, CHANNELS_TO_POST_EN);
    }
  }

  /**
   * Reply to ...
   */
  const regCommand = new RegExp(/^!(reply)\ (\d+)\ ((.*)+)$/i);
  const matchcommands = msg.match(regCommand);
  if (matchcommands) {
    const command = matchcommands[1];
    const id = matchcommands[2];
    const paramsString = matchcommands[3];

    console.log(command, id, paramsString);
    
    const mainMessage = message;
    console.log(mainMessage);
    message.channel.fetchMessage(id)
      .then(message => {
        const embed = new Discord.RichEmbed()
        .setTitle(`In reply to ${message.author.username}`)
        .setAuthor(mainMessage.author.username, mainMessage.author.avatarURL)
        .setColor(0x6ab1f1)
        .setDescription(message.content)
        // .setTimestamp()
        // .setFooter('-- ' + getDateTimeFromTimestamp(message.createdTimestamp));

        mainMessage.channel.send(embed);
        // mainMessage.channel.send(`From: ${mainMessage.author.username} ` + paramsString);
        message.reply(paramsString);
      })
      .catch(console.log);

    message.delete()
      .then(msg => console.log(`Deleted message from ${msg.author.username}`))
      .catch(console.error);
  }
});

bot.login(process.env.DISCORDBOT);

// pings server every 15 minutes to prevent dynos from sleeping
setInterval(() => {
  if (!TEST_MODE) {
    https.get('https://discordbot-pro.herokuapp.com/');
  }
}, 900000);
