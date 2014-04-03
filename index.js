
var Model = require("./model").Model;
var Body = require("./model").Body;
var DragStartHandler = require("./drag");
var Component = require("./component");

function Pointer() {
    this.stack = [];
}

Pointer.prototype.handleEvent = function (event) {
    var handler = this.handler || event.target.component;
    if (handler) {
        var next = handler.handleEvent(event);
        this.handler = next === void 0 ? this.handler : next;
    }
};

var pointer = new Pointer("mouse");

window.addEventListener("mousedown", handlePointerEvent);
window.addEventListener("mousedown", handlePointerEvent, true);
window.addEventListener("mouseup", handlePointerEvent);
window.addEventListener("mouseup", handlePointerEvent, true);
window.addEventListener("mousemove", handlePointerEvent);
window.addEventListener("mousemove", handlePointerEvent, true);
window.addEventListener("click", handlePointerEvent);
window.addEventListener("click", handlePointerEvent, true);

function handlePointerEvent(event) {
    pointer.handleEvent(event);
}

var BodyComponent = Component.extend({
    constructor: function BodyComponent(body, element, modelComponent) {
        this.value = body;
        this.element = element;
        this.modelComponent = modelComponent;
    },
    handleClickEvent: function (event) {
        return new DragStartHandler(this);
    },
    handleDragStart: function (start) {
        this.value.x = start.x;
        this.value.y = start.y;
        this.value.x$ = 0;
        this.value.y$ = 0;
        this.draw();
        this.modelComponent.draw();
    },
    handleDrag: function (start, stop, change) {
        this.value.x$ = (stop.x - start.x) / 20;
        this.value.y$ = (stop.y - start.y) / 20;
        this.draw();
        this.modelComponent.draw();
    },
    handleDrop: function (start, stop) {
    },
    draw: function () {
        this.element.style.left = this.value.x + "px";
        this.element.style.top = this.value.y + "px";
    }
});

var BodyButtonComponent = Component.extend({
    constructor: function BodyButtonComponent(body, element, bodyComponent) {
        this.value = body;
        this.element = element;
        this.bodyComponent = bodyComponent;
    },
    handleClickEvent: function (event) {
        return new DragStartHandler(this.bodyComponent);
    }
});

var ProjectedBodyComponent = Component.extend({
    constructor: function (value, element) {
        this.value = value;
        this.element = element;
    },
    draw: function () {
        this.element.style.left = this.value.x + "px";
        this.element.style.top = this.value.y + "px";
    }
});

var ModelComponent = Component.extend({
    constructor: function ModelComponent(model, top, bottom) {
        this.model = model;
        this.top = top;
        this.bottom = bottom;
    },
    draw: function () {
        var node = this.bottom.previousSibling;
        while (node !== this.top) {
            node = node.previousSibling;
            node.parentNode.removeChild(node.nextSibling);
        }
        var previous = this.model;
        var projections = [];
        for (var projectionIndex = 0; projectionIndex < 100; projectionIndex++) {
            projections.unshift(previous.projected());
            previous = projections[0];
        }
        for (var projectionIndex = 0; projectionIndex < projections.length; projectionIndex++) {
            var projection = projections[projectionIndex];
            for (var index = 0; index < projection.bodies.length; index++) {
                var projectedBody = projection.bodies[index];
                var projectedBodyElement = document.createElement("div");
                projectedBodyElement.classList.add("projectedBody");
                var projectedBodyComponent = new ProjectedBodyComponent(projectedBody, projectedBodyElement);
                projectedBodyElement.component = projectedBodyComponent;
                this.top.parentNode.insertBefore(projectedBodyElement, this.top.nextSibling);
                projectedBodyComponent.draw();
            }
        }
    }
});

var stageElement = document.createElement("div");
stageElement.setAttribute("id", "stage");
document.body.appendChild(stageElement);

var topOfProjection = document.createTextNode("");
var bottomOfProjection = document.createTextNode("");
stageElement.appendChild(topOfProjection);
stageElement.appendChild(bottomOfProjection);

var model = new Model(3);

var modelComponent = new ModelComponent(model, topOfProjection, bottomOfProjection);

for (var index = 0; index < model.bodies.length; index++) {
    var body = model.bodies[index];

    var bodyElement = document.createElement("div");
    var bodyComponent = new BodyComponent(body, bodyElement, modelComponent);
    bodyElement.classList.add("body");
    bodyElement.component = bodyComponent;
    bodyComponent.draw();
    stageElement.appendChild(bodyElement);

    var bodyButtonElement = document.createElement("button");
    var bodyButtonComponent = new BodyButtonComponent(body, bodyButtonElement, bodyComponent);
    bodyButtonElement.innerText = "" + index;
    bodyButtonElement.component = bodyButtonComponent;
    stageElement.appendChild(bodyButtonElement);

}

