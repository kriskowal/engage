
var Component = require("./component");

var DragHandler = Component.extend({

    constructor: function DragHandler(event, handler) {
        this.start = {x: event.clientX, y: event.clientY};
        this.stop = {x: this.start.x, y: this.start.y};
        this.change = {x: 0, y: 0};
        this.handler = handler;
        this.handler.handleDragStart(this.start);
    },

    handleMousemoveEvent: function (event) {
        this.change.x = event.clientX - this.stop.x;
        this.change.y = event.clientY - this.stop.y;
        this.stop.x = event.clientX;
        this.stop.y = event.clientY;
        this.handler.handleDrag(this.start, this.stop, this.change);
        return this;
    },

    handleMouseupEvent: function (event) {
        this.stop.x = event.clientX;
        this.stop.y = event.clientY;
        this.handler.handleDrop(this.start, this.stop);
        return null;
    }

});

// Captures a mouse click, anywhere in the window, and begins dragging from
// that position, forwarding handleDrag and handleDrop messages to the handler.
module.exports = Component.extend({

    constructor: function DragStartHandler(handler) {
        this.handler = handler;
    },

    captureMousedownEvent: function DragStartHandler_captureMousedown(event) {
        return new this.DragHandler(event, this.handler);
    },

    DragHandler: DragHandler

});

