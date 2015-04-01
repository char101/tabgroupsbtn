const EXPORTED_SYMBOLS = ["toRelativeTime"];

/*
 * https://github.com/jherdman/javascript-relative-time-helpers/blob/master/date.extensions.js
 *
 * The MIT License
 * Copyright (c) 2009 James F. Herdman
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Modified to ordinary function.
 */
function toRelativeTime(date, options) {
  var opts = processOptions(options);

  var now = opts.now || new Date();
  var texts = opts.texts || TEXTS;
  var delta = now - date;
  var future = (delta <= 0);
  delta = Math.abs(delta);

  // special cases controlled by options
  if (delta <= opts.nowThreshold) {
    return future ? texts.right_now : texts.just_now;
  }
  if (opts.smartDays && delta <= 6 * MS_IN_DAY) {
    return toSmartDays(date, now, texts);
  }

  var units = null;
  for (var key in CONVERSIONS) {
    if (delta < CONVERSIONS[key])
      break;
    units = key; // keeps track of the selected key over the iteration
    delta = delta / CONVERSIONS[key];
  }

  // pluralize a unit when the difference is greater than 1.
  delta = Math.floor(delta);
  units = texts.pluralize(delta, units);
  return [delta, units, future ? texts.from_now : texts.ago].join(" ");
}

function processOptions(arg) {
  if (!arg) arg = 0;
  if (typeof arg === 'string') {
    arg = parseInt(arg, 10);
  }
  if (typeof arg === 'number') {
    if (isNaN(arg)) arg = 0;
    return {nowThreshold: arg};
  }
  return arg;
}

function toSmartDays(date, now, texts) {
  var day;
  var weekday = date.getDay(),
      dayDiff = weekday - now.getDay();
  if (dayDiff == 0)       day = texts.today;
  else if (dayDiff == -1) day = texts.yesterday;
  else if (dayDiff == 1 && date > now)
                          day = texts.tomorrow;
  else                    day = texts.days[weekday];
  return day + " " + texts.at + " " + date.toLocaleTimeString();
}

var CONVERSIONS = {
  millisecond: 1, // ms    -> ms
  second: 1000,   // ms    -> sec
  minute: 60,     // sec   -> min
  hour:   60,     // min   -> hour
  day:    24,     // hour  -> day
  month:  30,     // day   -> month (roughly)
  year:   12      // month -> year
};

var MS_IN_DAY = (CONVERSIONS.millisecond * CONVERSIONS.second * CONVERSIONS.minute * CONVERSIONS.hour * CONVERSIONS.day);

var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

var TEXTS = {today:        'Today',
              yesterday:    'Yesterday',
              tomorrow:     'Tomorrow',
              at:           'at',
              from_now:     'from now',
              ago:          'ago',
              right_now:    'Right now',
              just_now:     'Just now',
              days:         WEEKDAYS,
              pluralize:    function(val, text) {
                              if(val > 1)
                                  return text + "s";
                              return text;
                            }
              };
