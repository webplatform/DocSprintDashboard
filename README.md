Web Platform Doc Sprint Dashboard
=================================

This is a dashboard visualizing individual data, as well as changes to the WebPlatform.org MediaWiki in a given timeframe across a given list of WebPlatform.org usernames.

It helps to monitor the outcome of a Doc Sprint and to display important general information, when continuosly ran and projected to the whole room of an in-person Doc Sprint. It uses the charting library Flot (flotcharts.org).

See the /screenshots folder for some examples.

Some of the generated graphs and lists base on the given timeframe and list of usernames. The timeframe, autocycle frequency and graphs to display are set via a settings panel that displays via the wrench icon to the upper right of the screen. The usernames are fetched from a Google Spreadsheet; what the URL and correct column of that document is, needs to be set via the settings panel as well. Note: make sure to publish your Google Spreadsheet (File > Publish to the web > All sheets) for this to work.

Available Graphs (Examples, feel free to extend):
* Simple Text, to use for announcements, e.g. for an Agenda
* Invalid Users (used to display usernames that could not be resolved via the MediaWiki API, so Doc Sprint admins are alerted to correct the Google Spreadsheet manually)
* Doc Sprint Edits - displays total number of edits as a bar chart
* Doc Sprint Edits List - displays a leaderboard based on the total number of edits per user
* Lifetime Edits - displays total number of edits by every given user as a bar chart
* Lifetime Edits List - displays a leaderboard with the all-time top 5 editors of the given userlist 
* Bytes added/Bytes removed
* Edits per specific area worked on (preset workgroup filters as "API", "CSS", etc.)

The Sidebar and Graphs contain sample text from the 1st European Web Platform Doc Sprint Feb 8/9 in Berlin - edit to your Doc Sprint needs.

The screenshots show data from September 2013s Web Platform Doc Sprint in Zurich.

If you have questions or comments contact 
fr0zenice on #webplatform (freenode) or 
@klick_ass on Twitter or app.net
