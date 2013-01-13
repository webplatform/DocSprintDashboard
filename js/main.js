"use strict";
/*/ -- config start -- \*/

// all possible graphs
// name: displayed in settings panel
// title: displayed on page
// id: id of container div
// (optional) show: should the graph be shown? returns true|false (e.g. no invalid users graph if there are none)
// (optional) update: callback for refreshing the graph, called right before it's displayed (not needed for text-only slides)
var graphs = [{
  name: "Text Only Example",
  title: "Just some Text...",
  id: "dsGraph_textOnly"
}, {
  name: "Invalid Users",
  title: "Invalid Users in Spreadsheet",
  id: "dsGraph_invalidUsers",
  show: dsGraph_invalidUsers_show,
  update: dsGraph_invalidUsers_update
}, {
  name: "All Edits",
  title: "Edits from all DocSprint Users",
  id: "dsGraph_allEdits",
  update: dsGraph_allEdits_update
}];

// retrieving users and getting MW data
var refreshInterval = 5 * 60 * 1000; // 5m

// checking for invalid users, 0 to disable
var invalidUsersInterval = 15 * 60 * 1000; // 15m

/*\ -- config end -- /*/



/*/ -- graph implementations start -- \*/

// Invalid Users
function dsGraph_invalidUsers_update() {
}
function dsGraph_invalidUsers_show() {
  return dsInvalidUsers.length > 0;
}

// All Edits
function dsGraph_allEdits_update() {
}

/*\ -- graph implementations end -- /*/



/*/ -- core start -- \*/
var lastSlugRegex = /\/([^/]+)$/;
var spreadsheetKeyRegex = /key=([^&#]+)|^([a-z0-9]+$)/i;
var dateFormat1Regex = /^(\d+)\.(\d+)\.(\d+) (\d+):(\d+)$/; // 11.12.2012 0:00
var dateFormat2Regex = /^(\d+)-(\d+)-(\d+) (\d+):(\d+)$/; // 2012-12-24 17:18

var dsUsers = {};
var dsInvalidUsers = [];
var dsChanges = [];
var dsStats = {};
var dsSettings = {
  keyUrl: null,
  key: null,
  sheet: null,
  column: null,
  start: null,
  end: null,
  graph_timeout: null,
  graphs_enabled: {}
};
var dsRefreshTimer;
var dsInvalidUsersTimer;
var dsGraphTimer;
var dsGraphTimeout;
var dsCurrentGraph;

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
      value: data[sheet].id
    }).text(data[sheet].name));
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
    for (var sheet in data) userscolumn.append($("<option/>", {
      value: sheet
    }).text(data[sheet]));
  }, {
    "min-row": 1,
    "max-row": 1
  });
}

function onChangedColumn() {
  if (dsSettings.column == -1) return;
  fetchUsers();
}

function fetchUsers() {
  if (!dsSettings.key || !dsSettings.sheet || !(dsSettings.column >= 0)) return;
  getCellsFromWorksheet(dsSettings.key, dsSettings.sheet, function(data) {
    var _dsUsers = {};
    for (var i in data) _dsUsers[data[i]] = {};
    dsUsers = _dsUsers;
  }, {
    "min-row": 2,
    "min-col": dsSettings.column,
    "max-col": dsSettings.column
  });
}

function fetchChanges(from, to) {
  /*var log = $("#placeholder");
  log.empty();
  log.append($("<div/>").text("Users: " + Object.keys(dsUsers)));
  log.append($("<div/>").text("."));
  log.append($("<div/>").text("fetching changes..."));*/
  
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
    
    //log.append($("<div/>").text("received " + data.query.recentchanges.length + " changes, filtering according to users..."));
    var i;
    for (i in dsUsers) dsUsers[i] = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    dsStats = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    for (i in data.query.recentchanges) {
      var rc = data.query.recentchanges[i];
      if (typeof(dsUsers[rc.user]) == "undefined") continue;
      var user = dsUsers[rc.user];
      //log.append($("<div/>").text("found change by " + rc.user));
      user.numEdits++;
      dsStats.numEdits++;
      if (typeof(rc.oldlen) == "number") {
        if (rc.newlen > rc.oldlen) {
          user.bytesAdded += rc.newlen - rc.oldlen;
          dsStats.bytesAdded += rc.newlen - rc.oldlen;
        } else if (rc.newlen < rc.oldlen) {
          user.bytesRemoved += rc.oldlen - rc.newlen;
          dsStats.bytesRemoved += rc.oldlen - rc.newlen;
        }
      }
    }
    //log.append($("<div/>").text("."));
    for (i in dsUsers) {
      /*log.append($("<div/>").text("[" + i + "] edits: "
      + dsUsers[i].numEdits + ", bytesAdded: " + dsUsers[i].bytesAdded + ", bytesRemoved: " + dsUsers[i].bytesRemoved
      + ", delta: " + (dsUsers[i].bytesAdded - dsUsers[i].bytesRemoved)));*/
    }
    /*log.append($("<div/>").text("[DocSprint total] edits: "
      + dsStats.numEdits + ", bytesAdded: " + dsStats.bytesAdded + ", bytesRemoved: " + dsStats.bytesRemoved
      + ", delta: " + (dsStats.bytesAdded - dsStats.bytesRemoved)));*/
  };
  insertScript(url, funcName);
}

function checkInvalidUsers() {
}

function refreshData() {
  //fetchChanges($("#wpdocsprintstarts").val(), $("#wpdocsprintends").val());
}

function writePossibleGraphs() {
  var pg = $("#possible_graphs");
  pg.empty();
  for (var i = 0; i < graphs.length; i++) {
    var graph = graphs[i];
    $("<input />", {
      name: "check_" + graph.id,
      id: "check_" + graph.id,
      type: "checkbox"
    }).appendTo(pg);
    $("<label />", {
      for: "check_" + graph.id
    }).text(" " + graph.name).appendTo(pg);
    if (i < (graphs.length - 1)) $("<br>").appendTo(pg);
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

function checkSettings(event) {
  var invalid = false;
  var id = event && (event.target || event.srcElement).id;
  
  if (!event || id == "wpdocsprintstarts") {
    var start = $("#wpdocsprintstarts").val();
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
    if (sheet != null && sheet.length > 0) {
      $("#label_usersworksheet").removeClass("invalid");
      dsSettings.sheet = sheet;
      onChangedWorksheet();
    } else {
      $("#label_usersworksheet").addClass("invalid");
      invalid = true;
      $("#userscolumn").empty();
    }
  }
  
  if (!event || id == "userscolumn" || id == "usersworksheet" || id == "userskey") {
    var column = $("#userscolumn").val();
    if (column != null && column != "-1") {
      $("#label_userscolumn").removeClass("invalid");
      dsSettings.column = column * 1;
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
      dsSettings.graph_timeout = freq;
    } else {
      $("#label_cycle").addClass("invalid");
      invalid = true;
    }
  }
  
  if (!event) {
    dsSettings.graphs_enabled = {};
    $("#possible_graphs :checked").each(function(i, n) {
      dsSettings.graphs_enabled[n.id.substring("check_".length)] = true;
    });
  }
  else if (/^check_/.test(id)) {
    if ($("#" + id).prop("checked")) dsSettings.graphs_enabled[id.substring("check_".length)] = true;
    else delete dsSettings.graphs_enabled[id.substring("check_".length)];
  }
  
  if (invalid) $("#wrench").addClass("invalid");
  else if ($("#controls label.invalid").length == 0) {
    $("#wrench").removeClass("invalid");
    
    // TODO: save settings
  }
}

function updateCycleFreq() {
  var secs = $("#cycle").val() * 1 / 1000;
  var mins = secs / 60;
  if (mins >= 1.0) $("#cyclefreq").text(Math.floor(mins) + ":" + ("" + secs % 60).replace(/^(\d)$/, "0$1") + " Minutes");
  else $("#cyclefreq").text(secs + " Seconds");
}

function checkGraphTimeout() {
  if (!dsSettings.graph_timeout || graphs.length == 0) return;
  if (!dsGraphTimeout || (dsGraphTimeout -= 1000) <= 0) {
    dsGraphTimeout = dsSettings.graph_timeout;
    var currentIndex = graphs.indexOf(dsCurrentGraph);
    for (var nextIndex = currentIndex + 1; currentIndex != -1 && nextIndex != currentIndex; nextIndex++) {
      if (nextIndex >= graphs.length) {
        nextIndex = -1;
        continue;
      }
      var possibleNext = graphs[nextIndex];
      if (!dsSettings.graphs_enabled[possibleNext.id]) continue;
      if (possibleNext.show && !possibleNext.show()) continue;
      break;
    }
    var nextGraph = graphs[nextIndex];
    if (typeof(nextGraph.update) == "function") nextGraph.update();
    var showNewGraph = function showNewGraph() {
      $("#graph_headline").text(nextGraph.title);
      $("#" + nextGraph.id).fadeIn();
    };
    if (!dsCurrentGraph) showNewGraph();
    else $("#" + dsCurrentGraph.id).fadeOut(showNewGraph);
    dsCurrentGraph = nextGraph;
  }
}

$(function() {
  writePossibleGraphs();
  $("#possible_graphs input[type='checkbox']").prop("checked", true);
  
  // TODO: load settings
  
  $("#controls").on("change", checkSettings);
  checkSettings();
  
  dsGraphTimer = setInterval(checkGraphTimeout, 1000);
  dsInvalidUsersTimer = setInterval(checkInvalidUsers, invalidUsersInterval);
  dsRefreshTimer = setTimeout(refreshData, refreshInterval);
});
/*\ -- core end -- /*/
