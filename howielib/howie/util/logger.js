'use strict';

const fs = require('fs');


var logLevel = 'normal';

var colors = {
  Reset : "\x1b[0m",
  Bright : "\x1b[1m",
  Dim : "\x1b[2m",
  Underscore : "\x1b[4m",
  Blink : "\x1b[5m",
  Reverse : "\x1b[7m",
  Hidden : "\x1b[8m",

  FgBlack : "\x1b[30m",
  FgRed : "\x1b[31m",
  FgGreen : "\x1b[32m",
  FgYellow : "\x1b[33m",
  FgBlue : "\x1b[34m",
  FgMagenta : "\x1b[35m",
  FgCyan : "\x1b[36m",
  FgWhite : "\x1b[37m",

  BgBlack : "\x1b[40m",
  BgDarkGray : "\x1b[100m",
  BgRed : "\x1b[41m",
  BgGreen : "\x1b[42m",
  BgYellow : "\x1b[43m",
  BgBlue : "\x1b[44m",
  BgMagenta : "\x1b[45m",
  BgCyan : "\x1b[46m",
  BgWhite : "\x1b[47m"
};

function out(txt, c) {
  console.log(c + txt + colors.Reset);
}

function debugOut(txt, fg) {
  if (txt === undefined) return;
  txt = txt.toString();
  if (logLevel.includes('debug')) {
    console.log( fg + /*colors.BgDarkGray +*/ txt + colors.Reset);
  } 
  if (logLevel.includes('file')) {
    fs.appendFileSync('debug.log', txt + '\n');
  }
}

function devOut(txt, fg) {
  txt = txt.toString();
  if (logLevel.includes('dev')) {
    console.log(fg + txt + colors.Reset);
  }
}

module.exports = {

  LEVELS: Object.freeze({
    DEBUG: 'debug',
    NORMAL: 'normal'
  }),

  setLevel: (level) => {
    logLevel = level; 
    if (logLevel.includes('file')) {
      fs.writeFileSync('debug.log', '');
    }
  },

  log: (obj) => { console.log(obj); },
  dir: (obj) => { console.dir(obj); },
  json: (obj) => { console.log(JSON.stringify(obj, null, '\t')); },
  cyan: (txt) => { out(txt, colors.FgCyan); },
  red: (txt) => { out(txt, colors.FgRed); },
  green: (txt) => { out(txt, colors.FgGreen); },
  yellow: (txt) => { out(txt, colors.FgYellow); },
  blue: (txt) => { out(txt, colors.FgBlue); },
  magenta: (txt) => { out(txt, colors.FgMagenta); },

  debug: {

    cyan: (txt) => { debugOut(txt, colors.FgCyan); },
    red: (txt) => { debugOut(txt, colors.FgRed); },
    green: (txt) => { debugOut(txt, colors.FgGreen); },
    yellow: (txt) => { debugOut(txt, colors.FgYellow); },
    blue: (txt) => { debugOut(txt, colors.FgBlue); },
    magenta: (txt) => { debugOut(txt, colors.FgMagenta); },

    dir: (obj) => {
      if (logLevel !== 'debug') return;
      console.dir(obj);
    },

    json: (obj) => {
      if (logLevel !== 'debug') return;
      console.log(JSON.stringify(obj, null, '\t'));
    },

    log: (obj) => {
      if (logLevel !== 'debug') return;
      console.log(obj);
    },

    bytes: (buf) => { 
      if (!logLevel.includes('debug')) return;
      for (const pair of buf.entries()) {
        let i = pair[0];
        let v = pair[1];
        let color = colors.FgMagenta;
        let txt = i + ':\t' + v.toString(16) + '\t(' + v + ')';
        console.log(color + txt + colors.Reset);
        if (logLevel.includes('file')) {
          fs.appendFileSync('debug.log', txt + '\n');
        }
      }
    },
  },

  dev: {
    cyan: (txt) => { devOut(txt, colors.FgCyan); },
    red: (txt) => { devOut(txt, colors.FgRed); },
    green: (txt) => { devOut(txt, colors.FgGreen); },
    yellow: (txt) => { devOut(txt, colors.FgYellow); },
    blue: (txt) => { devOut(txt, colors.FgBlue); },
    magenta: (txt) => { devOut(txt, colors.FgMagenta); },

    dir: (obj) => {
      if (logLevel !== 'dev') return;
      console.dir(obj);
    },

    json: (obj) => {
      if (logLevel !== 'dev') return;
      console.log(JSON.stringify(obj, null, '\t'));
    },

    log: (obj) => {
      if (logLevel !== 'dev') return;
      console.log(obj);
    },

    bytes: (buf) => { 
      if (!logLevel.includes('dev')) return;
      for (const pair of buf.entries()) {
        let i = pair[0];
        let v = pair[1];
        let color = colors.FgMagenta;
        let txt = i + ':\t' + v.toString(16) + '\t(' + v + ')';
        console.log(color + txt + colors.Reset);
        if (logLevel.includes('file')) {
          fs.appendFileSync('debug.log', txt + '\n');
        }
      }
    },

  }


};

