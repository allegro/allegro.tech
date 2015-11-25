#!/usr/bin/env node

var icons = require('./icons.json');

for (var i = 0; i < icons.length; i++) {
    var icon = icons[i];
    console.log(".i-" + icon.id + ":hover { color: " + icon.color + "; }");
    //console.log("array( '" + icon.id + "', __( '" + icon.name + "', 'page' ), '" + icon.character + "' ),");
};