/**
 * ev0lve Telegram Bot
 * created by aequabit - distributed under the Apache 2.0 license
 * property of ev0lve / imi-tat0r
 */

// code is trash, ik

'use strict'

var debugMode = false; // debug mode

/**
 * Load packages.
 */
const telegram = require('telegram-bot-api'),
    mysql = require('mysql'),
    fs = require('fs'),
    sprintf = require('sprintf-js').sprintf,
    vsprintf = require('sprintf-js').vsprintf,
    http = require('http'),
    request = require('request'),
    mime = require('mime'),
    moment = require('moment'),
    util = require('util'),
    randomstring = require('randomstring'),
    escapehtml = require('escape-html'),
    ioclient = require('socket.io-client'),
    cleverbot = require('cleverbot.io');

/*var socket = ioclient.connect('http://127.0.0.1:8081', {
    reconnect: true
});*/

class Helper {
    static log(args) {
        var i;
        var args = [];
        for (i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var log = sprintf('[%s] %s', moment().format('DD.MM.YYYY - HH:mm:ss'), vsprintf(arguments[0], args));
        console.log(log);
        fs.writeFile('./log/' + moment().format('DD.MM.YYYY') + '.txt', log + '\n', {
            'flag': 'a'
        }, function(err) {
            if (err) {
                return console.error(err);
            }
        })
    }
}

/**
 * Read the config file.
 */
try {
    var config = JSON.parse(
        fs.readFileSync(__dirname + '/config.json')
    );
} catch (e) {
    Helper.log('[error] Failed to parse config: %s', e);
    process.exit();
}

/**
 * Write the current script to the webserver.
 */
var filename = sprintf('%s-%s.js', moment().unix(), randomstring.generate({
    length: 24
}));
fs.readFile(__filename, function(err, data) {
    if (err) {
        return Helper.log('[script] failed to read script');
    }
    fs.writeFile(sprintf('%s/%s', config.scriptdir, filename), data);
});
var scriptUrl = sprintf('%s/%s', config.scripturl, filename);

Helper.log('[script] Set script URL to %s', scriptUrl);

// ======================================
// MYSQL SETUP
// ======================================

const db = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});
db.connect();


// ======================================
// CLEVERBOT SETUP
// ======================================

var bot = new cleverbot('pLUqvOkUGon5PO2b', 'cZtHGyaxGhi0gHYu16pLw7voWSQ9WYJC');
//bot.setNick(randomstring.generate());
bot.setNick('ev0lveAi');
bot.create(function(err, session) {
    if (err) {
        Helper.log(util.inspect(err));
    }
});


// ======================================
// COMMAND SETUP
// ======================================

var commands = [{
        command: '/quote',
        description: '/quote [%SEARCH%] [<author>] - Gets a quote',
        action: function(message, args) {
            /**
             * Check if an author was provided.
             */

            if (args.length == 0) {
                db.query('SELECT * FROM quotes ORDER BY RAND() LIMIT 1', function(err, rows, fields) {
                    /**
                     * If there are no quotes in the database.
                     */
                    if (rows.length < 1) {
                        return api.sendMessage({
                            chat_id: message.chat.id,
                            text: 'No quotes'
                        }, function(err, data) {
                            if (err) {
                                Helper.log(util.inspect(err));
                            }
                        });
                    }

                    /**
                     * Send the quote.
                     */
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('"%s"\n<i>–%s%s</i>', escapehtml(rows[0].text), escapehtml(rows[0].author), (rows[0].info == null ? '' : ' ' + escapehtml(rows[0].info))),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                });
            } else if (args[0].indexOf('%') != -1 && args[args.length - 1].indexOf('%') != -1) {
                db.query('SELECT * FROM quotes WHERE text LIKE ? ORDER BY RAND() LIMIT 1', [args.join(' ')], function(err, rows, fields) {
                    /**
                     * If there are no quotes in the database.
                     */
                    if (rows.length < 1) {
                        return api.sendMessage({
                            chat_id: message.chat.id,
                            text: 'No quotes'
                        }, function(err, data) {
                            if (err) {
                                Helper.log(util.inspect(err));
                            }
                        });
                    }

                    /**
                     * Send the quote.
                     */
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('"%s"\n<i>–%s%s</i>', escapehtml(rows[0].text), escapehtml(rows[0].author), (rows[0].info == null ? '' : ' ' + escapehtml(rows[0].info))),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                });
            } else if (args.length > 1 && args[1].indexOf('%') != -1 && args[args.length - 1].indexOf('%') != -1) {
                db.query('SELECT * FROM quotes WHERE text LIKE ? AND author=? ORDER BY RAND() LIMIT 1', [args.slice(1).join(' '), args[0]], function(err, rows, fields) {
                    /**
                     * If there are no quotes in the database.
                     */
                    if (rows.length < 1) {
                        return api.sendMessage({
                            chat_id: message.chat.id,
                            text: 'No quotes'
                        }, function(err, data) {
                            if (err) {
                                Helper.log(util.inspect(err));
                            }
                        });
                    }

                    /**
                     * Send the quote.
                     */
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('"%s"\n<i>–%s%s</i>', escapehtml(rows[0].text), escapehtml(rows[0].author), (rows[0].info == null ? '' : ' ' + escapehtml(rows[0].info))),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                });
            } else {
                db.query('SELECT * FROM quotes WHERE author=? ORDER BY RAND() LIMIT 1', [args.join(' ')], function(err, rows, fields) {
                    /**
                     * If there's no quote by the user.
                     */
                    if (rows == undefined || rows.length < 1) {
                        return api.sendMessage({
                            chat_id: message.chat.id,
                            text: sprintf('No quote by author \'%s\'', args.join(' '))
                        }, function(err, data) {
                            if (err) {
                                Helper.log(util.inspect(err));
                            }
                        });
                    }

                    /**
                     * Send the quote.
                     */
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('"%s"\n<i>–%s%s</i>', escapehtml(rows[0].text), escapehtml(rows[0].author), (rows[0].info == null ? '' : ' ' + escapehtml(rows[0].info))),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                });
            }
        }
    },
    {
        command: '/addquote',
        description: '/addquote <quote> ~~ <author> - Adds a quote to the database (no quotation marks)',
        action: function(message, args) {
            /**
             * Check if the argument count is valid.
             */
            if (args.length < 3) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid usage'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            }

            /**
             * Check if the delimiter between quote and author exists.
             */
            var delimiter = args.indexOf('~~');
            if (delimiter == -1) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'No author'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            }

            /**
             * Remove empty elements (they occur when two spaces are next to each other).
             */
            args.forEach(function(element, index) {
                if (element.length < 1) {
                    args.splice(index, 1);
                }
            });

            var split = args.slice(delimiter + 1);
            var info = null;

            var snakeIndex = split.indexOf('~~');
            if (snakeIndex != -1) { // info
                var quote = args.slice(0, (args.length - split.length - 1)).join(' ');
                var author = split.slice(0, snakeIndex).join(' ');
                info = split.slice(snakeIndex + 1).join(' ');
            } else { // no info
                var quote = args.slice(0, (args.length - split.length - 1)).join(' ');
                var author = split.join(' ');
            }

            if (author.indexOf('~~') != -1)
                return;

            /**
             * Replace @ and ~ in the author.
             * thx u stupid faggets @ev0lve
             */
            var author = author.replace('~', '').replace('@', '');

            /**
             * Check if the author is valid.
             */
            if (author.length < 1) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid author'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            }

            /**
             * Insert the quote into the database.
             */
            db.query('INSERT INTO quotes (text, author, info) VALUES (?, ?, ?)', [quote, author, info], function(err, rows, fields) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Added quote!'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/quotecount',
        description: '/quotecount - Gives you the count of quotes in the database.',
        action: function(message) {
            /**
             * Select the quote count from the database.
             */
            db.query('SELECT COUNT(*) AS quoteCount FROM quotes', function(err, rows, fields) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: sprintf('Total quotes: %d', rows[0].quoteCount)
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/snippet',
        description: '/snippet - Sends a random pCode snippet',
        action: function(message) {
            /**
             * Select a random snippet from the database.
             */
            db.query('SELECT * FROM snippets ORDER BY RAND() LIMIT 1', function(err, rows, fields) {
                /**
                 * If there are no snippets.
                 */
                if (rows == undefined || rows.length < 1) {
                    return api.sendMessage({
                        chat_id: message.chat.id,
                        text: 'No snippets!'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                }

                /**
                 * Send the quote.
                 */
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: /*escapehtml(*/ rows[0].text /*),*/
                    /*parse_mode: 'HTML'*/
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/addsnippet',
        description: '/addsnippet <snippet> - Adds a snippet to the database',
        action: function(message, args) {
            /**
             * Check if the argument count is valid.
             */
            if (args.length < 1) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid usage!'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            }

            /**
             * Insert the snippet into the database.
             */
            db.query('INSERT INTO snippets (text) VALUES (?)', [args.join(' ')], function(err, rows, fields) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Added snippet!'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/snippetcount',
        description: '/snippetcount - Gives you the count of snippets in the database.',
        action: function(message) {
            /**
             * Select the snippet count from the database.
             */
            db.query('SELECT COUNT(*) AS snippetCount FROM snippets', function(err, rows, fields) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: sprintf('Total snippets: %d', rows[0].snippetCount)
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/image',
        description: '/image - Sends a random image',
        action: function(message) {
            /**
             * Select a random image from the database.
             */
            db.query('SELECT * FROM images ORDER BY RAND() LIMIT 1', function(err, rows, fields) {

                /**
                 * Build the temporary filename.
                 */
                var filename = sprintf(__dirname + '/temp/img.%s', rows[0].mime.replace('image/', ''));

                /**
                 * Delete the old temporary file.
                 */
                fs.unlink(filename, function(err) {
                    if (err) {
                        return;
                    }
                });

                /**
                 * Convert the base64 hash into an image.
                 */
                var decodedImage = new Buffer(rows[0].hash, 'base64').toString('binary');

                /**
                 * Write the image to the temporary file.
                 */
                fs.writeFile(filename, decodedImage, {
                    encoding: 'base64'
                }, function(err) {
                    if (err) {
                        api.sendMessage({
                            chat_id: message.chat.id,
                            text: 'Image is corrupted'
                        }, function(err, data) {
                            if (err) {
                                Helper.log(util.inspect(err));
                            }
                        });
                        return Helper.log(util.inspect(err));
                    }

                    /**
                     * Send the image.
                     */
                    api.sendPhoto({
                        chat_id: message.chat.id,
                        caption: rows[0].caption,
                        photo: filename
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });

                });
            });
        }
    },
    {
        command: '/imagecount',
        description: '/imagecount - Gives you the count of images in the database.',
        action: function(message) {
            /**
             * Select the image count from the database.
             */
            db.query('SELECT COUNT(*) AS imageCount FROM images', function(err, rows, fields) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: sprintf('Total images: %d', rows[0].imageCount)
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/clever',
        description: '/clever - Lets you talk to the Cleverbot',
        action: function(message, args) {
            if (args.length < 1) {
                return Helper.log('[cleverbot] invalid message');
            }
            bot.ask(args[0], function(err, response) {
                api.sendMessage({
                    chat_id: message.chat.id,
                    text: response,
                    parse_mode: 'HTML'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            });
        }
    },
    {
        command: '/report',
        description: '/report - Sends the steamid64 to a reportbot',
        action: function(message, args) {
            if (args.length < 1) {
                return Helper.log('[report] invalid arg count');
            }
            if (isNaN(args[0]) || args[0].length != 17) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'This is not a valid steamid',
                });
            }
            db.query('SELECT name FROM whitelist WHERE steamid=?', [args[0]], function(err, rows, fields) {
                if (rows == undefined || rows.length > 0) {
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('<i>%s</i> is whitelisted by <i>%s</i>', args[0], rows[0].name),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                } else {
                    socket.emit('report', {
                        key: config.reportkey,
                        steamid: args[0]
                    });
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: sprintf('Added <i>%s</i> to the queue', args[0]),
                        parse_mode: 'HTML'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                }
            });
        }
    },
    {
        command: '/refund',
        description: '/refund <product> - Refunds the specified product',
        action: (message, args, name) => {
            if (args.length != 1)
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid usage.'
                }, (err, data) => {
                    if (err)
                        Helper.log(util.inspect(err));
                });

            api.sendMessage({
                chat_id: message.chat.id,
                text: 'Successfully refunded ' + args[0] + '! MfG.'
            }, (err, data) => {
                if (err)
                    Helper.log(util.inspect(err));
            });
        }
    },
    {
        command: '/deport',
        description: '/deport <thing> ~~ <destination> - Refunds the specified thing',
        action: (message, args, name) => {
            if (args.length < 3 || args.indexOf('~~') == -1) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid usage.'
                }, (err, data) => {
                    if (err)
                        Helper.log(util.inspect(err));
                });
            }

            var thing = args.slice(0, args.indexOf('~~')).join(' ');
            var destination = args.slice(args.indexOf('~~') + 1).join(' ');

            if (thing.length < 1 || destination.length < 1) {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Invalid usage.'
                }, (err, data) => {
                    if (err)
                        Helper.log(util.inspect(err));
                });
            }

            api.sendMessage({
                chat_id: message.chat.id,
                text: 'Successfully deported ' + thing + ' to ' + destination + '! Heil tat0r!'
            }, (err, data) => {
                if (err)
                    Helper.log(util.inspect(err));
            });
        }
    },
    {
        command: '/<3',
        description: '/<3 - Gives you some love',
        action: function(message, args, name) {
            /**
             * Send the sender some love <3
             */
            api.sendMessage({
                chat_id: message.chat.id,
                text: sprintf('<i>%s is bae	&lt;3</i>', name),
                parse_mode: 'HTML'
            }, function(err, data) {
                if (err) {
                    Helper.log(util.inspect(err));
                }
            });

        }
    },
    {
        command: '/source',
        description: '/source - Gives back the URL of the current bot script',
        action: function(message, args) {
            api.sendMessage({
                chat_id: message.chat.id,
                text: sprintf('Current script URL: %s', scriptUrl)
            }, function(err, data) {
                if (err) {
                    Helper.log(util.inspect(err));
                }
            });

        }
    },
    {
        command: '/about',
        description: '/about - Shows information about the bot',
        action: function(message) {
            /**
             * Give out information about the bot.
             */
            api.sendMessage({
                chat_id: message.chat.id,
                text: '<b>ev0Bot</b>\nmade with <i>&lt;3</i> by <i>aequabit</i>\n\nCredits:\n  reportbot by <i>askwrite</i>',
                parse_mode: 'HTML'
            }, function(err, data) {
                if (err) {
                    Helper.log(util.inspect(err));
                }
                if (data) {
                    //console.log(data);
                }
            });

        }
    },
    {
        command: '/help',
        description: '/help - Shows all available commands',
        action: function(message) {
            /**
             * Give out all available commands.
             */
            var help = '';
            commands.forEach(function(command, index) {
                help += sprintf('%s\n', command.description);
            });
            api.sendMessage({
                chat_id: message.chat.id,
                text: help
            }, function(err, data) {
                if (err) {
                    Helper.log(util.inspect(err));
                }
                if (data) {
                    //console.log(data);
                }
            });

        }
    }
];


// ======================================
// TELEGRAM SETUP
// ======================================

var api = new telegram({
    token: config.botkey,
    updates: {
        enabled: true
    }
});

/**
 * Image handler.
 */
function handleImage(message) {
    /**
     * Get the image caption without the command.
     */
    var caption = message.caption.replace('/addimage ', '').replace('/addimage', '');

    /**
     * Return if the caption is too short.
     */
    if (caption.length < 1) {
        return Helper.log('[image] add: caption too short');
    }

    /**
     * Get the image path from the Telegram API.
     */
    request(sprintf('https://api.telegram.org/bot%s/getFile?file_id=%s', config.botkey, message.photo[message.photo.length - 1].file_id), function(error, response, body) {
        if (error || response.statusCode != 200) {
            return Helper.log('%s: %s', response.statusCode, error);
        }

        /**
         * Try to parse the response and return if it is invalid.
         */
        try {
            var response = JSON.parse(body);
        } catch (e) {
            return Helper.log('[telegram] api: invalid image response: %s', e);
        }

        /**
         * Split the filename to get the extension.
         */
        var sFilename = response.result.file_path.split('.');

        /**
         * Build the filename
         */
        var filename = sprintf('%s/temp/img.%s', __dirname, sFilename[sFilename.length - 1]);

        /**
         * Download the image from the Telegram API.
         */
        var url = sprintf('http://api.telegram.org/file/bot%s/%s', config.botkey, response.result.file_path);

        /**
         * Send the request.
         */
        var req = request(url);
        req.on('response', function(res) {
            /**
             * Create a steam to the temporary file.
             */
            res.pipe(fs.createWriteStream(filename));

            /**
             * Get the mime type of the image.
             */
            var mimetype = mime.lookup(filename);

            /**
             * Read the image.
             */
            fs.readFile(filename, function(err, data) {
                /**
                 * Convert it to base64.
                 */
                var hashedImage = new Buffer(data, 'binary').toString('base64');

                /**
                 * Insert the image into the database.
                 */
                db.query('INSERT INTO images (hash, caption, mime) VALUES (?, ?, ?)', [hashedImage, caption, mimetype], function(err, rows, fields) {
                    if (err) {
                        return Helper.log(util.inspect(err));
                    }

                    /**
                     * Send a success message.
                     */
                    api.sendMessage({
                        chat_id: message.chat.id,
                        text: 'Added image'
                    }, function(err, data) {
                        if (err) {
                            Helper.log(util.inspect(err));
                        }
                    });
                });
            });
        });
    });
}

var counter = 0;
setInterval(function() {
    counter = 0;
}, 10000);

/**
 * Gets invoked when a message is received.
 */
api.on('message', function(message) {
    /**
     * Return if the message is invalid.
     */
    if (message == undefined) {
        return;
    }

    /**
     * Get the sender's name.
     */
    var name = (message.from.username == undefined) ? message.from.first_name + (message.from.last_name == undefined ? '' : ' ' + message.from.last_name) : message.from.username;

    /**
     * Check if the bot is allowed to answer.
     */
    if (message.chat.username != 'ev0lve_xyz' && message.chat.username != 'aequabit') {
        Helper.log('[chat] %s talked to mah grill.', name);

        return api.sendMessage({
            chat_id: message.chat.id,
            text: 'Sorry, I\'m not allowed to talk to you.'
        }, function(err, data) {
            if (err) {
                Helper.log(util.inspect(err));
            }
        });
    }

    if (counter >= 2) {
        return;
    }
    counter++;

    /**
     * Check if the image is an image.
     */
    if (message.photo != undefined && message.caption != undefined && message.caption.indexOf('/addimage') === 0) {
        Helper.log('[image] add: triggered');
        return handleImage(message);
    }

    /**
     * Loop through all commands.
     */
    commands.forEach(function(command) {
        /**
         * If the message text is undefined.
         */
        if (message.text == undefined) {
            return;
        }

        /**
         * Check if the message matches the command.
         */
        // TODO: make it better :^)
        //if (message.text.indexOf(command.command) === 0) {
        if (message.text.split(' ')[0] == command.command || message.text.split(' ')[0].replace('@ev0Bot', '') == command.command) {
            if (debugMode && name != 'aequabit') {
                return api.sendMessage({
                    chat_id: message.chat.id,
                    text: 'Debug mode!'
                }, function(err, data) {
                    if (err) {
                        Helper.log(util.inspect(err));
                    }
                });
            }

            Helper.log('[command] %s - triggered command: %s (%s)', name, command.command, message.text);

            /**
             * Call the command's action.
             */
            var args = message.text.split(' ');
            args.shift();
            return command.action(message, args, name);
        }
    });
});

Helper.log('[ev0Bot] started successfully');

