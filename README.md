Web Platform Doc Sprint Dashboard
=================================

This is a dashboard visualizing changes to the WebPlatform.org MediaWiki. It helps to monitor the outcome of a Doc Sprint and to continuosly display important general information, e.g. projected to the room of an in-person Doc Sprint. It uses the charting library Flot (flotcharts.org).

Some of the generated graphs and lists base on the given timeframe and list of usernames. The timeframe, autocycle frequency and graphs to display are set via a settings panel that displays via the wrench icon to the upper right of the screen. The usernames are fetched from a Google Spreadsheet; what the URL and correct column of that document is, needs to be set via the settings panel as well.

Available Graphs (Examples):
* Simple Text, to use as e.g. Agenda
* Invalid Users (used to display usernames that could not be resolved via the MediaWiki API, so Doc Sprint admins are alerted to correct the Google Spreadsheet manually)
* Doc Sprint Edits - displays total number of edits as a bar chart
* Doc Sprint Edits List - displays a leaderboard based on the total number of edits per user
* Lifetime Edits - displays total number of edits by every given user as a bar chart
* Lifetime Edits List - displays a leaderboard with the all-time top 5 editors of the given userlist 
* Bytes added/Bytes removed
* Edits per area worked on (API, CSS, etc.)
* ...

The Sidebar and Graphs contain sample text from the 1st European Web Platform Doc Sprint Feb 8/9 in Berlin - edit to your Doc Sprint needs.

If you have questions or comments contact 
fr0zenice on #webplatform (freenode) or 
@klick_ass on Twitter or app.net!
