The current version is deployed to http://kokarn.com/hearthstone-legends/

Database dump 29/1 13:50 is available here: http://kokarn.com/hearthstone-legends/dbdump.sql

Second version should use this https://github.com/andersmattson/hearthstone-rank-ocr-reader
and probably vagrant.

Known issues:

* The module is built for the browser.
* For some reason it doesn't work if you create the canvas from js, but it has to exist
* Needs to be rewritten as a node module, probably using https://github.com/Automattic/node-canvas
