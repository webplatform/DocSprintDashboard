"use strict";
/*/ -- config start -- \*/

// all possible slides
// name: displayed in settings panel
// title: displayed on page
// id: id of container div
// (optional) show: should the slide be shown? returns true|false (e.g. no invalid users slide if there are none)
// (optional) update: callback for refreshing the slide, called right before it's displayed (not needed for text-only slides)
var slides = [{
  name: "Agenda",
  title: "Agenda",
  id: "dsSlide_textOnly"
}, {
  name: "Invalid Users",
  title: "Oooops - Typo Alert!",
  id: "dsSlide_invalidUsers",
  show: dsSlide_invalidUsers_show,
  update: dsSlide_invalidUsers_update
}, {
  name: "DocSprint Edits (List)",
  title: "Leaderboard: Users with most edits during Doc Sprint",
  id: "dsSlide_allEdits_list",
  show: dsSlide_allEdits_show,
  update: dsSlide_allEdits_list_update
}, {
  name: "DocSprint Edits",
  title: "Leaderboard: Users with most edits during Doc Sprint",
  id: "dsSlide_allEdits",
  show: dsSlide_allEdits_show,
  update: dsSlide_allEdits_update
}, {
  name: "Lifetime Edits (List)",
  title: "Lifetime Edits across all Doc Sprint Participants",
  id: "dsSlide_lifetime_list",
  show: dsSlide_lifetime_show,
  update: dsSlide_lifetime_list_update
}, {
  name: "Lifetime Edits",
  title: "Lifetime Edits across all Doc Sprint Participants",
  id: "dsSlide_lifetime",
  show: dsSlide_lifetime_show,
  update: dsSlide_lifetime_update
}, {
  name: "Experienced / New Users Contributing in Sprint",
  title: "Doc Sprint Contributors: Lab-Rats (old Users) vs. Adventurers (new Users)",
  id: "dsSlide_accounts",
  show: dsSlide_accounts_show,
  update: dsSlide_accounts_update
}, {
  name: "Genders",
  title: "Genders",
  id: "dsSlide_genders",
  show: dsSlide_genders_show,
  update: dsSlide_genders_update
}, {
  name: "Edits Timeline",
  title: "Doc Sprint edits",
  id: "dsSlide_edits_timeline",
  show: dsSlide_edits_timeline_show,
  update: dsSlide_edits_timeline_update
}, {
  name: "Edit Areas",
  title: "Edit Areas",
  id: "dsSlide_edits_areas",
  show: dsSlide_edits_areas_show,
  update: dsSlide_edits_areas_update
}, {
  name: "Bytes added/removed",
  title: "Bytes added/removed",
  id: "dsSlide_bytes",
  show: dsSlide_bytes_show,
  update: dsSlide_bytes_update
}];

// retrieving users and getting MW data
var refreshInterval = 5 * 60 * 1000; // 5m

/*\ -- config end -- /*/



/*/ -- slide implementations start -- \*/

// Invalid Users
function dsSlide_invalidUsers_update() {
  var html = "<h3>Yo - we've retrieved some invalid usernames from the spreadsheet.</h3><p>Holler at one of the event hosts to fix this and let the culprit pay the drinks tonight! ;)=</p><p>Here are the faulty doodz:</p>";
  html += "<ul>";
  for (var i = 0; i < dsInvalidUsers.length && i < 20; i++) {
    html += "<li>";
    html += dsInvalidUsers[i].name;
    html += "</li>";
  }
  html += "</ul>";
  $("#dsSlide_invalidUsers").html(html);
}
function dsSlide_invalidUsers_show() {
  return dsInvalidUsers.length > 0;
}

// All Edits
function dsSlide_allEdits_show() {
  return dsUsersByNumEdits.length > 0;
}
function dsSlide_allEdits_update() {
  var data = [];
  data[0] = {
    color: "#30B4C5",
    data: []
  };
  for (var i = 0; i < 5 && i < dsUsersByNumEdits.length; i++) {
    var user = dsUsersByNumEdits[i];
    data[0].data.push([ user.name, user.numEdits ]);
  }
  var options = {
    series: {
      bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }
    },
    xaxis: {
      mode: "categories",
      autoscaleMargin: 0.1,
      tickLength: 0
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_allEdits_graph"), data, options);
}
function dsSlide_allEdits_list_update() {
  var html = "<ol>";
  for (var i = 0; i < 20 && i < dsUsersByNumEdits.length; i++) {
    var user = dsUsersByNumEdits[i];
    html += "<li>" + user.name + " (" + user.numEdits + ")</li>";
  }
  html += "</ol>";
  $("#dsSlide_allEdits_list").html(html);
}

function dsSlide_lifetime_show() {
  return dsUsersByLifetimeEdits.length > 0;
}
function dsSlide_lifetime_update() {
  var data = [];
  data[0] = {
    color: "#694D9F",
    data: []
  };
  for (var i = 0; i < 5 && i < dsUsersByLifetimeEdits.length; i++) {
    var user = dsUsersByLifetimeEdits[i];
    data[0].data.push([ user.name, user.lifetimeEdits ]);
  }
  var options = {
    series: {
      bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }
    },
    xaxis: {
      mode: "categories",
      autoscaleMargin: 0.1,
      tickLength: 0
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_lifetime_graph"), data, options);
}
function dsSlide_lifetime_list_update() {
  var html = "<ol>";
  for (var i = 0; i < 20 && i < dsUsersByLifetimeEdits.length; i++) {
    var user = dsUsersByLifetimeEdits[i];
    html += "<li>" + user.name + " (" + user.lifetimeEdits + ")</li>";
  }
  html += "</ol>";
  $("#dsSlide_lifetime_list").html(html);
}

function dsSlide_accounts_show() {
  return dsUserAccounts.old > 0 || dsUserAccounts.new > 0;
}
function dsSlide_accounts_update() {
  var data = [];
  data[0] = {
    color: "#E54E27",
    data: []
  };
  data[0].data.push([ "Old-Timers", dsUserAccounts.old ]);
  data[0].data.push([ "Newcomers", dsUserAccounts.new ]);
  var options = {
    series: {
      bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }
    },
    xaxis: {
      mode: "categories",
      autoscaleMargin: 0.1,
      tickLength: 0
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_accounts_graph"), data, options);
}

function dsSlide_genders_show() {
  return dsUserGenders.male > 0 || dsUserGenders.female > 0;
}
function dsSlide_genders_update() {
  var data = [];
  data[0] = {
    color: "#D02E27",
    data: []
  };
  data[0].data.push([ "unknown", dsUserGenders.unknown ]);
  data[0].data.push([ "male", dsUserGenders.male ]);
  data[0].data.push([ "female", dsUserGenders.female ]);
  var options = {
    series: {
      bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }
    },
    xaxis: {
      mode: "categories",
      autoscaleMargin: 0.1,
      tickLength: 0
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_genders_graph"), data, options);
}

function dsSlide_edits_timeline_show() {
  return dsArticleEdits.length > 0;
}
function dsSlide_edits_timeline_update() {
  var data = [];
  data[0] = {
    color: "#F99D1C",
    data: []
  };
  var edits = $.extend([], dsArticleEdits).reverse();
  var sum = 0;
  for (var i in edits) {
    var rc = edits[i];
    data[0].data.push([parseDate(rc.timestamp).getTime(), ++sum]);
  }
  var options = {
    series: {
      /*bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }*/
    },
    xaxis: {
      mode: "time"/*,
      autoscaleMargin: 0.1,
      tickLength: 0*/
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_edits_timeline_graph"), data, options);
}

function dsSlide_edits_areas_show() {
  return dsArticleEdits.length > 0;
}
function dsSlide_edits_areas_update() {
  var data = [];
  var edits = $.extend([], dsArticleEdits);
  var areas = { apis: 0, css: 0, other: 0 };
  for (var i in edits) {
    var rc = edits[i];
    if (rc.title.match(/^apis\//i)) areas.apis++;
    else if (rc.title.match(/^css\//i)) areas.css++;
    else areas.other++;
  }
  var colors = {
    apis: "#F99D1C",
    css: "#30B4C5",
    other: "#694D9F"
  };
  for (var a in areas) {
    data.push({
      label: a,
      data: areas[a],
      color: colors[a]
    });
  }
  var options = {
    series: {
      pie: {
        show: true,
        radius: 1,
        label: {
          show: false,
          radius: 3/4,
          background: {
            color: "#000000",
            opacity: 0.75
          }
        }
      }
    },
    legend: {
      show: true
    }
  };
  var plot = $.plot($("#dsSlide_edits_areas_graph"), data, options);
}

function dsSlide_bytes_show() {
  return dsArticleEdits.length > 0;
}
function dsSlide_bytes_update() {
  var data = [];
  data[0] = {
    label: "added",
    color: "#30B4C5",
    data: []
  };
  data[1] = {
    label: "removed",
    color: "#D02E27",
    data: []
  }
  var edits = $.extend([], dsArticleEdits).reverse();
  var sum = 0;
  for (var i in edits) {
    var rc = edits[i];
    var delta = rc.newlen - rc.oldlen;
    if (delta > 0) data[0].data.push([parseDate(rc.timestamp).getTime(), delta]);
    else if (delta < 0) data[1].data.push([parseDate(rc.timestamp).getTime(), delta * -1]);
  }
  var options = {
    series: {
      /*bars: {
        show: true,
        barWidth: 0.5,
        align: "center"
      }*/
    },
    legend: {
      show: true
    },
    xaxis: {
      mode: "time"/*,
      autoscaleMargin: 0.1,
      tickLength: 0*/
    },
    yaxis: {
      tickDecimals: 0
    }
  };
  var plot = $.plot($("#dsSlide_bytes_graph"), data, options);
}
/*\ -- slide implementations end -- /*/



/*/ -- core start -- \*/
var lastSlugRegex = /\/([^/]+)$/;
var spreadsheetKeyRegex = /key=([^&#]+)|^([a-z0-9]+$)/i;
var dateFormat1Regex = /^(\d+)\.(\d+)\.(\d+) (\d+):(\d+)$/; // 11.12.2012 0:00
var dateFormat2Regex = /^(\d+)-(\d+)-(\d+) (\d+):(\d+)$/; // 2012-12-24 17:18
var dateFormatApiRegex = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)Z$/; // 2012-12-24T17:18:19Z

var dsUsers = {};
var dsUsersByNumEdits = [];
var dsUsersByLifetimeEdits = [];
var dsUserGenders = {};
var tmpUserGenders = {};
var dsUserAccounts = {};
var tmpUserAccounts = {};
var dsInvalidUsers = [];
var tmpInvalidUsers;
var dsUsersMetaBatchCount = 50;
var dsChanges = [];
var dsArticleEdits = [];
var dsStats = {};
var tmpUsers;
var tmpUsersForMeta;
var tmpStats;
var tmpChanges;
var tmpArticleEdits;
var dsSettings = {
  keyUrl: null,
  key: null,
  sheet: null,
  column: null,
  start: null,
  end: null,
  slide_timeout: null,
  slides_enabled: {}
};
var dsRefreshTimer;
var dsSlideTimer;
var dsSlideTimeout;
var dsSlideCurrentCycle;
var dsSlideTimerDelay = 1000;
var dsSlideTimerEasing = "swing"; // linear, swing
var dsCurrentSlide;
var dsSettingsLoaded;
var dummyUser = {
  name: "?",
  numEdits: 0,
  bytesAdded: 0,
  bytesRemoved: 0,
  lifetimeEdits: 0,
  gender: undefined,
  registrationDate: undefined,
  newlyRegistered: undefined,
  id: undefined,
  unknown: true
};

function createUniqueId() {
  return (new Date()).getTime() + "_" + Math.random().toFixed(10).substr(2);
}

function getFeedUrl(type, key, callback, worksheet, extra) {
  if (typeof(worksheet) == "string") worksheet += "/";
  else worksheet = "";
  var params = "";
  if (typeof(extra) == "object") {
    for (var k in extra) {
      var v = extra[k];
      params += "&" + k + "=" + encodeURIComponent(v);
    }
  }
  return "https://spreadsheets.google.com/feeds/" + type + "/" + key + "/" + worksheet + "public/basic?alt=json-in-script&callback=" + callback + params;
}

function insertScript(url, id) {
  var scriptrefs = window.scriptrefs || (window.scriptrefs = {});
  scriptrefs[id] = $("<script/>", {
    src: url
  }).appendTo("body");
}

function getWorksheets(key, callback) {
  var funcName = "getWorksheets_" + createUniqueId();
  window[funcName] = function(data) {
    window.scriptrefs[funcName].remove();
    delete window.scriptrefs[funcName];
    delete window[funcName];
    
    var sheets = [];
    for (var i = 0; i < data.feed.entry.length; i++) {
      sheets.push({
        name: data.feed.entry[i].title.$t,
        id: data.feed.entry[i].id.$t.match(lastSlugRegex)[1]
      });
    }
    callback(sheets);
  };
  insertScript(getFeedUrl("worksheets", key, funcName), funcName);
}

function getCellsFromWorksheet(key, worksheet, callback, extra) {
  var funcName = "getCellsFromWorksheet_" + createUniqueId();
  window[funcName] = function(data) {
    window.scriptrefs[funcName].remove();
    delete window.scriptrefs[funcName];
    delete window[funcName];
    
    var cells = [];
    for (var i = 0; i < data.feed.entry.length; i++) {
      cells.push(data.feed.entry[i].content.$t);
    }
    callback(cells);
  };
  insertScript(getFeedUrl("cells", key, funcName, worksheet, extra), funcName);
}

function onChangedKey() {
  getWorksheets(dsSettings.key, function(data) {
    var usersworksheet = $("#usersworksheet");
    usersworksheet.empty();
    usersworksheet.append($("<option/>", {
      value: ""
    }).text(""));
    for (var sheet in data) usersworksheet.append($("<option/>", {
      value: data[sheet].id,
      selected: dsSettings.sheet == data[sheet].id
    }).text(data[sheet].name));
    if ($("#usersworksheet").val()) $("#usersworksheet").change();
  });
}

function onChangedWorksheet() {
  var userscolumn = $("#userscolumn");
  userscolumn.empty();
  if (!dsSettings.sheet) return;
  getCellsFromWorksheet(dsSettings.key, dsSettings.sheet, function(data) {
    userscolumn.append($("<option/>", {
      value: "-1"
    }).text(""));
    for (var column in data) userscolumn.append($("<option/>", {
      value: column * 1 + 1,
      selected: dsSettings.column == (column * 1 + 1)
    }).text(data[column]));
    if ($("#userscolumn").val()) $("#userscolumn").change();
  }, {
    "min-row": 1,
    "max-row": 1
  });
}

function onChangedColumn() {
  if (dsSettings.column == -1) return;
  fetchUsers();
}

function fetchUsers(done) {
  if (!dsSettings.key || !dsSettings.sheet || !(dsSettings.column >= 0)) return;
  getCellsFromWorksheet(dsSettings.key, dsSettings.sheet, function(data) {
    var tmpUsers = {};
    for (var i in data) tmpUsers[data[i]] = $.extend({}, dummyUser, { name: i });
    dsUsers = tmpUsers;
    if (typeof(done) == "function") done();
  }, {
    "min-row": 2,
    "min-col": dsSettings.column,
    "max-col": dsSettings.column
  });
}

function fetchChanges(from, to, done) {
  var funcName = "fetchChanges_" + createUniqueId();
  var url = "http://docs.webplatform.org/w/api.php?";
  url += "action=query&list=recentchanges&rcprop=user|parsedcomment|flags|timestamp|title|sizes|redirect|ids|loginfo&rclimit=500"
  url += "&format=json&callback=" + funcName;
  if (typeof(to) == "string") url += "&rcstart=" + encodeURIComponent(to);
  if (typeof(from) == "string") url += "&rcend=" + encodeURIComponent(from);
  window[funcName] = function(data) {
    window.scriptrefs[funcName].remove();
    delete window.scriptrefs[funcName];
    delete window[funcName];
    
    for (var i in data.query.recentchanges) {
      var rc = data.query.recentchanges[i];
      if (tmpUsers[rc.user.toLowerCase()] == undefined) continue;
      tmpChanges.push(rc);
      var user = tmpUsers[rc.user.toLowerCase()];
      user.numEdits++;
      tmpStats.numEdits++;
      if (typeof(rc.oldlen) == "number") {
        if (rc.newlen > rc.oldlen) {
          user.bytesAdded += rc.newlen - rc.oldlen;
          tmpStats.bytesAdded += rc.newlen - rc.oldlen;
        } else if (rc.newlen < rc.oldlen) {
          user.bytesRemoved += rc.oldlen - rc.newlen;
          tmpStats.bytesRemoved += rc.oldlen - rc.newlen;
        }
        
        if (rc.pageid && (rc.type == "new" || rc.type == "edit")) tmpArticleEdits.push(rc);
      }
    }
    
    if (data["query-continue"]) {
      fetchChanges(from, data["query-continue"].recentchanges.rcstart, function onDone() {
        if (typeof(done) == "function") done();
      });
    } else if (typeof(done) == "function") done();
  };
  insertScript(url, funcName);
}

function checkUsersMeta(done, startIndex) {
  if (startIndex == undefined) {
    tmpInvalidUsers = [];
    tmpUsersForMeta = $.extend([], dsUsers);
    startIndex = 0;
    tmpUserGenders =  { male: 0, female: 0, unknown: 0 };
    tmpUserAccounts = { old: 0, "new": 0 };
  }
  
  var usersMetaBatch = {};
  var c = 0;
  for (var cu in tmpUsersForMeta) {
    usersMetaBatch[cu] = tmpUsersForMeta[cu];
    delete tmpUsersForMeta[cu];
    if (c++ >= dsUsersMetaBatchCount) break;
  }
  
  var funcName = "checkUsersMeta_" + startIndex + "_" + createUniqueId();
  var url = "http://docs.webplatform.org/w/api.php?";
  url += "action=query&list=users&usprop=blockinfo|editcount|registration|gender";
  url += "&ususers=";
  for (var u in usersMetaBatch) url += encodeURIComponent(u + "|");
  url = url.replace(/(\||%7C)$/i, "");
  url += "&format=json&callback=" + funcName;
  window[funcName] = function(data) {
    window.scriptrefs[funcName].remove();
    delete window.scriptrefs[funcName];
    delete window[funcName];
    
    for (var user in data.query.users) {
      user = data.query.users[user];
      var tmpUser = tmpUsers[user.name.toLowerCase()];
      if (tmpUser == undefined) continue;
      tmpUser.id = user.userid;
      tmpUser.name = user.name;
      tmpUser.lifetimeEdits = user.editcount || 0;
      tmpUser.gender = user.gender == "unknown" ? undefined : user.gender;
      tmpUser.registrationDate = user.registration ? parseDate(user.registration) : undefined;
      if (user.registration) tmpUser.newlyRegistered = tmpUser.registrationDate >= dsSettings.start && tmpUser.registrationDate <= dsSettings.end;
      else tmpUser.newlyRegistered = undefined;
      tmpUser.unknown = user.missing == "" || user.invalid == "";
      if (tmpUser.unknown) tmpInvalidUsers.push(tmpUser);
    }
    
    if (tmpUsersForMeta.length > 0) {
      checkUsersMeta(function onUsersMetaDone() {
        if (typeof(done) == "function") done();
      }, startIndex + dsUsersMetaBatchCount);
    } else if (typeof(done) == "function") done();
  };
  insertScript(url, funcName);
}

function refreshData() {
  fetchUsers(function onFetchUsersDone() {
    tmpUsers = {};
    tmpChanges = [];
    tmpArticleEdits = [];
    for (var i in dsUsers) tmpUsers[i] = $.extend({}, dummyUser, { name: i });
    tmpStats = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    if (dsSettings.start && dsSettings.end) {
      fetchChanges(formatDate(dsSettings.start), formatDate(dsSettings.end), function onFetchChangesDone() {
        checkUsersMeta(function onUsersMetaDone() {
          var tmpUsersByNumEdits = [];
          var tmpUsersByLifetimeEdits = [];
          for (var u in tmpUsers) {
            var tmpUser = tmpUsers[u];
            
            if (tmpUser.numEdits > 0) tmpUsersByNumEdits.push(tmpUser);
            
            if (tmpUser.lifetimeEdits > 0) tmpUsersByLifetimeEdits.push(tmpUser);
            
            if (tmpUser.gender == "male") tmpUserGenders.male++;
            else if (tmpUser.gender == "female") tmpUserGenders.female++;
            else tmpUserGenders.unknown++;
            
            if (tmpUser.newlyRegistered) tmpUserAccounts.new++;
            else tmpUserAccounts.old++;
          }
          tmpUsersByNumEdits.sort(function(a, b) {
            return b.numEdits - a.numEdits;
          });
          tmpUsersByLifetimeEdits.sort(function(a, b) {
            return b.lifetimeEdits - a.lifetimeEdits;
          });
          
          dsUsers = tmpUsers;
          dsStats = tmpStats;
          dsChanges = tmpChanges;
          dsUsersByNumEdits = tmpUsersByNumEdits;
          dsInvalidUsers = tmpInvalidUsers;
          dsUserGenders = tmpUserGenders;
          dsUsersByLifetimeEdits = tmpUsersByLifetimeEdits;
          dsUserAccounts = tmpUserAccounts;
          dsArticleEdits = tmpArticleEdits;
          if (!dsCurrentSlide) dsSlideTimeout = 0;
        });
      });
    }
  });
}

function writePossibleSlides() {
  var pg = $("#possible_slides");
  pg.empty();
  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];
    $("<input />", {
      name: "check_" + slide.id,
      id: "check_" + slide.id,
      type: "checkbox"
    }).appendTo(pg);
    $("<label />", {
      for: "check_" + slide.id
    }).text(" " + slide.name).appendTo(pg);
    if (i < (slides.length - 1)) $("<br>").appendTo(pg);
  }
}

function formatDate(date) {
  // 2012-12-24T17:18:19Z
  var year = date.getUTCFullYear();
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var hour = date.getUTCHours();
  var minute = date.getUTCMinutes();
  var second = date.getUTCSeconds();
  return year + "-" + (month >= 10 ? month : ("0" + month)) + "-" + (day >= 10 ? day : ("0" + day)) + "T" +
         (hour >= 10 ? hour : ("0" + hour)) + ":" + (minute >= 10 ? minute : ("0" + minute)) + ":" + (second >= 10 ? second : ("0" + second)) + "Z";
}

function parseDate(str) {
  // 2012-12-24T17:18:19Z
  var match = str.match(dateFormatApiRegex);
  if (!match) return null;
  var date = new Date();
  date.setUTCFullYear(match[1]);
  date.setUTCMonth(match[2] * 1 - 1);
  date.setUTCDate(match[3]);
  date.setUTCHours(match[4]);
  date.setUTCMinutes(match[5]);
  date.setUTCSeconds(match[6]);
  return date;
}

function checkSettings(event) {
  var invalid = false;
  var id = event && (event.target || event.srcElement).id;
  
  if (!event || id == "wpdocsprintstarts") {
    var start = $("#wpdocsprintstarts").val();
    dsSettings.startstr = start;
    var m1 = start.match(dateFormat1Regex);
    var m2 = start.match(dateFormat2Regex);
    if (m1 || m2) {
      $("#label_wpdocsprintstarts").removeClass("invalid");
      if (m1) dsSettings.start = new Date(m1[3], m1[2] * 1 - 1, m1[1], m1[4], m1[5], 0, 0);
      else dsSettings.start = new Date(m2[1], m2[2] * 1 - 1, m2[3], m2[4], m2[5], 0, 0);
    } else {
      $("#label_wpdocsprintstarts").addClass("invalid");
      invalid = true;
    }
  }
  
  if (!event || id == "wpdocsprintends") {
    var end = $("#wpdocsprintends").val();
    dsSettings.endstr = end;
    var m1 = end.match(dateFormat1Regex);
    var m2 = end.match(dateFormat2Regex);
    if (m1 || m2) {
      $("#label_wpdocsprintstarts").removeClass("invalid");
      if (m1) dsSettings.end = new Date(m1[3], m1[2] * 1 - 1, m1[1], m1[4], m1[5], 0, 0);
      else dsSettings.end = new Date(m2[1], m2[2] * 1 - 1, m2[3], m2[4], m2[5], 0, 0);
    } else {
      $("#label_wpdocsprintstarts").addClass("invalid");
      invalid = true;
    }
  }
  
  if (!event || id == "userskey") {
    var keyMatch = $("#userskey").val().match(spreadsheetKeyRegex);
    var key;
    if (keyMatch && (key = keyMatch[1] || keyMatch[2])) {
      $("#label_userskey").removeClass("invalid");
      dsSettings.keyUrl = $("#userskey").val();
      dsSettings.key = key;
      onChangedKey();
    } else {
      $("#label_userskey").addClass("invalid");
      invalid = true;
      $("#usersworksheet").empty();
      $("#userscolumn").empty();
    }
  }
  
  if (!event || id == "usersworksheet" || id == "userskey") {
    var sheet = $("#usersworksheet").val();
    if (id == "usersworksheet") dsSettings.sheet = sheet;
    if (sheet != null && sheet.length > 0) {
      $("#label_usersworksheet").removeClass("invalid");
      onChangedWorksheet();
    } else {
      $("#label_usersworksheet").addClass("invalid");
      invalid = true;
      $("#userscolumn").empty();
    }
  }
  
  if (!event || id == "userscolumn" || id == "usersworksheet" || id == "userskey") {
    var column = $("#userscolumn").val();
    if (id == "userscolumn") dsSettings.column = column * 1;
    if (column != null && column != "-1") {
      $("#label_userscolumn").removeClass("invalid");
      onChangedColumn();
    } else {
      $("#label_userscolumn").addClass("invalid");
      invalid = true;
    }
  }
  
  if (!event || id == "cycle") {
    updateCycleFreq();
    var freq = $("#cycle").val() * 1;
    if (freq) {
      $("#label_cycle").removeClass("invalid");
      dsSettings.slide_timeout = freq;
    } else {
      $("#label_cycle").addClass("invalid");
      invalid = true;
    }
  }
  
  if (!event) {
    dsSettings.slides_enabled = {};
    $("#possible_slides :checked").each(function(i, n) {
      dsSettings.slides_enabled[n.id.substring("check_".length)] = true;
    });
  }
  else if (/^check_/.test(id)) {
    if ($("#" + id).prop("checked")) dsSettings.slides_enabled[id.substring("check_".length)] = true;
    else delete dsSettings.slides_enabled[id.substring("check_".length)];
    
    if (!dsCurrentSlide && $("#possible_slides :checked").length > 0) dsSlideTimeout = 0;
  }
  
  if (invalid) $("#wrench, #acceptSettings").addClass("invalid");
  else if ($("#controls label.invalid").length == 0) {
    $("#wrench, #acceptSettings").removeClass("invalid");
  }
  if (dsSettingsLoaded) save_settings();
}

function updateCycleFreq() {
  var secs = $("#cycle").val() * 1 / 1000;
  var mins = secs / 60;
  if (mins >= 1.0) $("#cyclefreq").text(Math.floor(mins) + ":" + ("" + secs % 60).replace(/^(\d)$/, "0$1") + " Minutes");
  else $("#cyclefreq").text(secs + " Seconds");
}

function checkSlideTimeout() {
  var percent = 100;
  if (dsSlideCurrentCycle && slides.length && isFinite(dsSlideTimeout)) percent = (dsSlideTimeout - dsSlideTimerDelay) / dsSlideCurrentCycle * 100;
  if (percent >= 0 && percent < 100) $("#progress_overlay").animate({ width: percent + "%" }, dsSlideTimerDelay - 50, dsSlideTimerEasing);
  if (!dsSettings.slide_timeout || slides.length == 0) return;
  if (!dsSlideTimeout || (dsSlideTimeout -= dsSlideTimerDelay) < 0) {
    if (isFinite(dsSlideTimeout)) $("#progress_overlay").animate({ width: "0" }, dsSlideTimerDelay - 50, dsSlideTimerEasing);
    dsSlideCurrentCycle = (dsSlideTimeout = dsSettings.slide_timeout);
    var currentIndex = slides.indexOf(dsCurrentSlide);
    var possibleSlides = [];
    var max = currentIndex + slides.length + 1;
    if (currentIndex == -1) max++;
    for (var nextIndex = currentIndex + 1; nextIndex < max; nextIndex++) {
      var possibleNext = slides[nextIndex % slides.length];
      if (!dsSettings.slides_enabled[possibleNext.id]) continue;
      if (typeof(possibleNext.show) == "function" && !possibleNext.show()) continue;
      possibleSlides.push(possibleNext);
    }
    $("#progress_overlay").stop(true, true).css("width", "100%");
    if (possibleSlides.length == 0) {
      $("#slide_headline").text("No slides to display!");
      var showDefaultSlide = function showDefaultSlide() {
        $("#dsSlide_default").fadeIn();
        dsCurrentSlide = undefined;
      };
      if (!dsCurrentSlide) showDefaultSlide();
      else $("#" + dsCurrentSlide.id).fadeOut(showDefaultSlide);
      return;
    }
    var nextSlide = possibleSlides[0];
    var showNewSlide = function showNewSlide() {
      $("#dsSlide_default").hide();
      if (typeof(nextSlide.update) == "function") nextSlide.update();
      $("#slide_headline").text(nextSlide.title);
      $("#" + nextSlide.id).fadeIn();
    };
    if (!dsCurrentSlide) showNewSlide();
    else $("#" + dsCurrentSlide.id).fadeOut(showNewSlide);
    dsCurrentSlide = nextSlide;
  }
}

function save_settings() {
  localStorage.settings = JSON.stringify(dsSettings);
}

function load_settings() {
  if (localStorage.settings) {
    dsSettings = JSON.parse(localStorage.settings);
    $("#wpdocsprintstarts").val(dsSettings.startstr);
    $("#wpdocsprintends").val(dsSettings.endstr);
    $("#userskey").val(dsSettings.keyUrl);
    $("#cycle").val(dsSettings.slide_timeout);
    for (var k in dsSettings.slides_enabled) {
      var ele = $("#check_" + k);
      if (ele.length == 0) delete dsSettings[k];
      else ele.prop("checked", true);
    }
  }
  checkSettings();
  dsSettingsLoaded = true;
  refreshData();
  dsSlideTimer = setInterval(checkSlideTimeout, dsSlideTimerDelay);
  dsRefreshTimer = setTimeout(refreshData, refreshInterval);
}

function onProgressClick() {
  dsSlideTimeout = 0;
}

$(function() {
  writePossibleSlides();
  
  $("#controls").on("change", checkSettings);
  load_settings();
  
  $("#progress_container").on("click", onProgressClick);
});
/*\ -- core end -- /*/

function morph_height(num) {
  $("#progress_container, #progress_overlay, #progress").css("height", num + "px");
  $("#progress_line").css("height", Math.floor(num / 2) + "px");
}
