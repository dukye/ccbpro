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
CHANNELS_TO_WATCH_FR = ['analyses-forex', 'analyses-actions', 'analyses-crypto', 'analyses-altcoins'];
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


bot.on('guildMemberAdd', (member) => {
  // console.log(`Hello new user ${member.username}`);
  const theUserId = member.user.id;
  console.log('UserID: ', theUserId);

  // console.log(guild.guild.channels.get('432624917217935389'));
  const welcomeChannel = member.guild.channels.find('name', 'welcome');

  welcomeChannel.send(`Welcome <@${theUserId}> check your private message for instructions (on top left of discord app) / Bienvenue <@${theUserId}> veuillez regarder vos messages privés pour suivre les instructions (en haut à gauche de l'application discord)`);
  member.user.send(`
Welcome on discord of / Bienvenue sur le serveur discord: **PRO Indicators** 😉

__Introduction__
If you're a beginner, here is a short video explaining how to use our discord / Pour les débutants, voici une courte vidéo de présentation sur l'utilisation de discord:
For english users: https://www.youtube.com/watch?v=6a60eUKpvQQ
Vidéo en français: https://www.youtube.com/watch?v=Paol3_MOvWM


__Next step / Prochaine étape:__
You need to choose your language AND your interests in <#${welcomeChannel.id}> channel by typing on of these commands below / Vous devez choisir votre langue ET vos intérêts dans le salon <#${welcomeChannel.id}> en tapant une des commandes ci dessous.
First prefixed parameter is the language and second the interest separated by a "-" (hyphen sign) / Le premier paramètre préfixé est votre langue et le second celui de votre intérêt chacun séparé par un "-" (le signe tiret de votre clavier)


ENGLISH - Here are different possibilities
----
1. __Crypto Analysis Channel__
> type: \`\`!en-crypto\`\`

2. __Stock market Analysis channel__
>type: \`\`!en-stock\`\`

3. __Forex Analysis channel:__
> type: \`\`!en-forex\`\`

4. __Crypto + Stock + Forex:__
> type: \`\`!en-all\`\`


FRANCAIS - Voici les différentes possibilités:
----
1. __Analyse Crypto__
> tapez: \`\`!fr-crypto\`\`

2. __Analyse Marché des actions__
> tapez: \`\`!fr-stock\`\`

3. __Analyse Forex:__
> tapez: \`\`!fr-forex\`\`

4. __Analyse Crypto + Actions + Forex:__
> tapez: \`\`!fr-all\`\`
  `);
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
   * Muted custom command
   */
  var guildRoles = message.guild.roles;
  var mutedRole = guildRoles.find('name', 'Muted');
  if (message.member && message.member.roles && message.member.roles.has(mutedRole.id)) {
    message.delete();
  }

  /**
   * All roles
   * @type {[type]}
   */
  // var roles = message.guild.roles
  // roles.forEach(function (role) {
  //   console.log(role.name, role.id);
  // });

  /**
   * All users!
   */
  // let users = bot.users;
  // users.forEach(function (user) {
  //   console.log(user.username, user.id);
  // });

  /**
   * Tests
   */
  console.log(`--> Request from ${user.username} [${user.id}] in ${message.channel.name}`);
  // console.log('FR', message.member.roles.has(roleFR.id))
  // console.log('FR-FOREX', message.member.roles.has(roleFrForex.id))
  // console.log('FR-CRYPTO', message.member.roles.has(roleFrCrypto.id))
  // console.log('FR-STOCK', message.member.roles.has(roleFrStock.id))
  // console.log('FR-STOCK', message.member.roles.has(roleFrStock.id, fakeRole.id))

  /**
   * Give roles/rights to member
   * @type {RegExp}
   */
  const regCommandMember = new RegExp(/^!(member)\ (\d+) (fr-all|fr-stock|fr-forex|fr-crypto|en-all|en-stock|en-forex|en-crypto)$/i);
  const matchcommandMember = msg.match(regCommandMember);
  if (matchcommandMember) {

    console.log('------ Custom command')
    const command = matchcommandMember[1];
    const userid = matchcommandMember[2];
    const right = matchcommandMember[3];

    var guildRoles = message.guild.roles;
    var fakeRole = guildRoles.find('name', 'fakeRole');

    // Fr roles
    var roleFR = guildRoles.find('name', 'french');
    var roleFrForex = guildRoles.find('name', 'fr-forex');
    var roleFrCrypto = guildRoles.find('name', 'fr-crypto');
    var roleFrStock = guildRoles.find('name', 'fr-stock');

    // En roles
    var roleEN = guildRoles.find('name', 'english');
    var roleEnForex = guildRoles.find('name', 'en-forex');
    var roleEnCrypto = guildRoles.find('name', 'en-crypto');
    var roleEnStock = guildRoles.find('name', 'en-stock');

    var roleAdmin = guildRoles.find('name', 'Admin');
    var roleGeneral = guildRoles.find('name', 'General');
    var roleSergent = guildRoles.find('name', 'Sergent');
    var roleModerator = guildRoles.find('name', 'Moderator');
    var roleColonel = guildRoles.find('name', 'Colonel');

    if (message.member.roles.has(roleGeneral.id, roleSergent.id, roleModerator.id, roleColonel.id)) {
      const userguild = message.guild.members.get(userid);

      // console.log(userguild.user);
      // // console.log(userguild.roles);
      // const userroles = userguild.roles;
      // userroles.forEach(function (role) {
      //   console.log(role.name, ' [',role.id, ']');
      // });
      // console.log('fakeRole ', fakeRole.id, userguild.roles.has(fakeRole.id))
      // console.log('set Role ')
      // userguild.addRole(fakeRole.id)
      //   .then((msg) => {
      //     message.reply('done');
      //   });
      // console.log('fakeRole ', fakeRole.id, userguild.roles.has(fakeRole.id))
      // console.log('2 roles ', userguild.roles.has(roleFR.id, fakeRole.id))
      // console.log('------ End');

      switch(right) {
        case 'fr-stock':
        case 'fr-forex':
        case 'fr-crypto':
          let currentRoleFr = guildRoles.find('name', right);
          userguild.addRoles([roleFR.id, currentRoleFr.id])
          .then((msg) => {
            console.log('reply fr xx')
            message.reply('done');
          })
          .catch((e) => null);
          break;
        case 'fr-all':
          userguild.addRoles([roleFR.id, roleFrStock.id, roleFrForex.id, roleFrCrypto.id])
          .then((msg) => {
            console.log('reply fr all')
            message.reply('done');
          })
          .catch((e) => null);
          break;
        case 'en-stock':
        case 'en-forex':
        case 'en-crypto':
          let currentRoleEn = guildRoles.find('name', right);
          userguild.addRoles([roleEN.id, currentRoleEn.id])
          .then((msg) => {
            console.log('reply en xx')
            message.reply('done');
          })
          .catch((e) => null);
          break;
        case 'en-all':
          console.log('OK Valid');
          userguild.addRoles([roleEN.id, roleEnStock.id, roleEnForex.id, roleEnCrypto.id])
          .then((msg) => {
            console.log('reply en all')
            message.reply('done');
          })
          .catch((e) => null);
          break;
      }
    }
  }

  /**
   * Add roles
   * @type {RegExp}
   */
  const regCommandRole = new RegExp(/^!(fr-all|fr-stock|fr-forex|fr-crypto|en-all|en-stock|en-forex|en-crypto)$/i);
  const matchcommandRole = msg.match(regCommandRole);
  if (matchcommandRole && message.channel.name == 'welcome') {
    const command = matchcommandRole[1];
    console.log(command);

    var guildRoles = message.guild.roles;

    // Fr roles
    var roleFR = guildRoles.find('name', 'french');
    var roleFrForex = guildRoles.find('name', 'fr-forex');
    var roleFrCrypto = guildRoles.find('name', 'fr-crypto');
    var roleFrStock = guildRoles.find('name', 'fr-stock');

    // En roles
    var roleEN = guildRoles.find('name', 'english');
    var roleEnForex = guildRoles.find('name', 'en-forex');
    var roleEnCrypto = guildRoles.find('name', 'en-crypto');
    var roleEnStock = guildRoles.find('name', 'en-stock');

    const userguild = message.guild.members.get(user.id);

    switch(command) {
      case 'fr-stock':
      case 'fr-forex':
      case 'fr-crypto':
        let currentRoleFr = guildRoles.find('name', command);
        userguild.addRoles([roleFR.id, currentRoleFr.id])
        .then((msg) => {
          console.log('reply fr xx')
          // message.reply('done');
        })
        .catch((e) => null);
        break;
      case 'fr-all':
        userguild.addRoles([roleFR.id, roleFrStock.id, roleFrForex.id, roleFrCrypto.id])
        .then((msg) => {
          console.log('reply fr all')
          // message.reply('done');
        })
        .catch((e) => null);
        break;
      case 'en-stock':
      case 'en-forex':
      case 'en-crypto':
        let currentRoleEn = guildRoles.find('name', command);
        userguild.addRoles([roleEN.id, currentRoleEn.id])
        .then((msg) => {
          console.log('reply en xx')
          // message.reply('done');
        })
        .catch((e) => null);
        break;
      case 'en-all':
        console.log('OK Valid');
        userguild.addRoles([roleEN.id, roleEnStock.id, roleEnForex.id, roleEnCrypto.id])
        .then((msg) => {
          console.log('reply en all')
          // message.reply('done');
        })
        .catch((e) => null);
        break;
    }
    message.delete()
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

    // console.log(command, id, paramsString);

    const mainMessage = message;
    // console.log(mainMessage);
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
