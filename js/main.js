"use strict";
/*/ -- config start -- \*/

// all possible slides
// name: displayed in settings panel
// title: displayed on page
// id: id of container div
// (optional) show: should the slide be shown? returns true|false (e.g. no invalid users slide if there are none)
// (optional) update: callback for refreshing the slide, called right before it's displayed (not needed for text-only slides)
var slides = [{
  name: "Text Only Example",
  title: "Just some Text...",
  id: "dsSlide_textOnly"
}, {
  name: "Invalid Users",
  title: "Invalid Users in Spreadsheet",
  id: "dsSlide_invalidUsers",
  show: dsSlide_invalidUsers_show,
  update: dsSlide_invalidUsers_update
}, {
  name: "All Edits",
  title: "Edits from all DocSprint Users",
  id: "dsSlide_allEdits",
  show: dsSlide_allEdits_show,
  update: dsSlide_allEdits_update
}];

// retrieving users and getting MW data
var refreshInterval = 5 * 60 * 1000; // 5m

// checking for invalid users and newly registered accounts
var usersMetaInterval = 15 * 60 * 1000; // 15m

/*\ -- config end -- /*/



/*/ -- slide implementations start -- \*/

// Invalid Users
function dsSlide_invalidUsers_update() {
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
  for (var i = 0; i < 3 && i < dsUsersByNumEdits.length; i++) {
    var user = dsUsersByNumEdits[i];
    data[0].data.push([ user.name, user.numEdits]);
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
    }
  };
  var plot = $.plot($("#dsSlide_allEdits_graph"), data, options);
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
var dsInvalidUsers = [];
var dsChanges = [];
var dsStats = {};
var tmpUsers;
var tmpStats;
var tmpChanges;
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
var dsUsersMetaTimer;
var dsSlideTimer;
var dsSlideTimeout;
var dsSlideCurrentCycle;
var dsSlideTimerDelay = 1000;
var dsSlideTimerEasing = "swing"; // linear, swing
var dsCurrentSlide;
var dsSettingsLoaded;

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
    for (var i in data) tmpUsers[data[i]] = { name: i, numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
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
      tmpChanges.push(rc);
      if (tmpUsers[rc.user] == undefined) continue;
      var user = tmpUsers[rc.user];
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

function checkUsersMeta() {
  // fetch user meta (iterate batches)
  // exists?
  // newly registered?
}

function refreshData() {
  fetchUsers(function onFetchUsersDone() {
    tmpUsers = {};
    tmpChanges = [];
    for (var i in dsUsers) tmpUsers[i] = { name: i, numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    tmpStats = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    if (dsSettings.start && dsSettings.end) {
      fetchChanges(formatDate(dsSettings.start), formatDate(dsSettings.end), function onFetchChangesDone() {
        var tmpUsersByNumEdits = [];
        for (var u in tmpUsers) {
          if (tmpUsers[u].numEdits > 0) tmpUsersByNumEdits.push(tmpUsers[u]);
        }
        tmpUsersByNumEdits.sort(function(a, b) {
          return a.numEdits < b.numEdits;
        });
        
        dsUsers = tmpUsers;
        dsStats = tmpStats;
        dsChanges = tmpChanges;
        dsUsersByNumEdits = tmpUsersByNumEdits;
        
        if (!dsCurrentSlide) dsSlideTimeout = 0;
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
      $("#slide_headline").text("Nothing to show yet...");
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
  dsUsersMetaTimer = setInterval(checkUsersMeta, usersMetaInterval);
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
