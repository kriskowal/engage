
var Extensible = require("./extensible");

module.exports = Extensible.extend({

    constructor: function Component() {
    },

    handleEvent: function (event) {
        var eventName = event.type[0].toUpperCase() + event.type.slice(1);
        var handlerMethodName = (event.eventPhase !== 1 ? "handle" : "capture") + eventName + "Event";
        if (this[handlerMethodName]) {
            return this[handlerMethodName](event);
        }
    }

});

