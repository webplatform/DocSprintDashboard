var lastSlugRegex = /\/([^/]+)$/;
var dsUsers = {};
var dsChanges = [];
var dsStats = {};

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
  getWorksheets($("#userskey").val(), function(data) {
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
  getCellsFromWorksheet($("#userskey").val(), $("#usersworksheet").val(), function(data) {
    var userscolumn = $("#userscolumn");
    userscolumn.empty();
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
  var userscolumn = parseInt($("#userscolumn").val());
  if (userscolumn == -1) return;
  fetchUsers();
}

function fetchUsers() {
  var column = parseInt($("#userscolumn").val()) + 1;
  getCellsFromWorksheet($("#userskey").val(), $("#usersworksheet").val(), function(data) {
    dsUsers = {};
    for (var i in data) dsUsers[data[i]] = {};
    fetchChanges($("#wpdocsprintstarts").val(), $("#wpdocsprintends").val());
  }, {
    "min-row": 2,
    "min-col": column,
    "max-col": column
  });
}

function fetchChanges(from, to) {
  var log = $("#placeholder");
  log.empty();
  log.append($("<div/>").text("Users: " + Object.keys(dsUsers)));
  log.append($("<div/>").text("."));
  log.append($("<div/>").text("fetching changes..."));
  
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
    
    log.append($("<div/>").text("received " + data.query.recentchanges.length + " changes, filtering according to users..."));
    var i;
    for (i in dsUsers) dsUsers[i] = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    dsStats = { numEdits: 0, bytesAdded: 0, bytesRemoved: 0 };
    for (i in data.query.recentchanges) {
      var rc = data.query.recentchanges[i];
      if (typeof(dsUsers[rc.user]) == "undefined") continue;
      var user = dsUsers[rc.user];
      log.append($("<div/>").text("found change by " + rc.user));
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
    log.append($("<div/>").text("."));
    for (i in dsUsers) {
      log.append($("<div/>").text("[" + i + "] edits: "
      + dsUsers[i].numEdits + ", bytesAdded: " + dsUsers[i].bytesAdded + ", bytesRemoved: " + dsUsers[i].bytesRemoved
      + ", delta: " + (dsUsers[i].bytesAdded - dsUsers[i].bytesRemoved)));
    }
    log.append($("<div/>").text("[DocSprint total] edits: "
      + dsStats.numEdits + ", bytesAdded: " + dsStats.bytesAdded + ", bytesRemoved: " + dsStats.bytesRemoved
      + ", delta: " + (dsStats.bytesAdded - dsStats.bytesRemoved)));
  };
  insertScript(url, funcName);
}

$(function() {
  $("#usersworksheet").on("change", onChangedWorksheet);
  $("#userscolumn").on("change", onChangedColumn);
  
  if ($("#userskey").val().length > 0) onChangedKey();
});
