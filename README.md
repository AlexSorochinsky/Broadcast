# Broadcast
Javascript library which realizes observer pattern for both browser and server (Node.js) environment

Typical usage:

Broadcast.on("My Event Name", function() {}, this);

Broadcast.call("My Event Name");

Broadcast.off("My Event Name", this);
