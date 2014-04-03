
var Extensible = require("./extensible");

// Simple, change the gravitational constant of the universe.
var gravity = 1000;

// A model represents the position, mass, and velocity (and thus the inertia)
// of every body in a system of interacting masses at a particular time.
// The model is stateful and can be updated with the state from a projected
// future time.
var Model = exports.Model = Extensible.extend({
    constructor: function Model(bodiesLength, time) {
        this.time = time;
        this.bodies = [];
        for (var bodyIndex = 0; bodyIndex < bodiesLength; bodyIndex++) {
            var body = new Body(bodyIndex);
            this.bodies.push(body);
        }
    },
    // Creates a projection of the expected state of the system of masses after
    // an elapsed change in time.
    projected: function (t$) {
        return new Projection(this, t$);
    },
    // Updates the state of this system to become the projected state.
    become: function (projection) {
        this.time = projection.time;
        for (var bodyIndex = 0; bodyIndex < bodiesLength; bodyIndex++) {
            var body = this.bodies[bodyIndex];
            var projectedBody = projection.bodies[bodyIndex];
            body.x = projectedBody.x;
            body.y = projectedBody.y;
        }
    }
});

// A body represents the state of a single massive body, including its index
// (for identification), mass, position, and velocity. For the convenience of
// computing projectionts, it also can temporarily track accumulated
// acceleration. For collision detection, the body also has a diameter.
var Body = exports.Body = Extensible.extend({
    constructor: function Body(index) {
        this.index = index;
        this.x = 0;
        this.y = 0;
        this.x$ = 0;
        this.y$ = 0;
        this.x$$ = 0;
        this.y$$ = 0;
        this.mass = 1;
        this.diameter = 0;
        // TODO track orders on a maneuverable body
    },
    distance: function (that) {
        return Math.sqrt(
            Math.pow(that.x - this.x, 2) +
            Math.pow(that.y - this.y, 2)
        );
    }
});

// A projection is a representation of the state of a system of massive bodies
// at a future time. The projection tracks its parent state, the amount of time
// elapsed, and from those values computes the new state for each body.
var Projection = exports.Projection = Model.extend({
    constructor: function Projection(previous, t$) {
        this.bodies = new Array(previous.bodies.length);
        for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
            var body = new ProjectedBody(previous.bodies[bodyIndex], this);
            this.bodies[bodyIndex] = body;
        }
        // Accumulate acceleration factors, starting with (0, 0) for all
        // massive bodies.
        for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
            var body = this.bodies[bodyIndex];
            body.x$$ = 0;
            body.y$$ = 0;
        }
        // Compute the mutual gravity of every body on every other body. Since
        // the force of gravity between any two bodies are opposites, the
        // vector only needs to be computed once and applied to the reflected
        // relationship.
        for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
            var body = this.bodies[bodyIndex];
            var body$ = body.previous;
            for (var otherBodyIndex = 0; otherBodyIndex < this.bodies.length; otherBodyIndex++) {
                var otherBody = this.bodies[otherBodyIndex];
                var otherBody$ = otherBody.previous;
                // Only visit the relationships between one body and another
                // body once, visiting the top left triangle of the body to
                // other body table.
                if (bodyIndex < otherBodyIndex) {
                    var distance = body$.distance(otherBody$);
                    // TODO multiply force by the masses of both involved bodies
                    var xForce = gravity * (otherBody$.x - body$.x) / (distance * distance * distance)
                    var yForce = gravity * (otherBody$.y - body$.y) / (distance * distance * distance)
                    // Aggregate the acceleration due to mutual gravitation on this body
                    body.x$$ += xForce; // TODO divide force by mass, reduce gravitational constant
                    body.y$$ += yForce;
                    // And also apply the opposite acceleration on the other
                    // body, filling out the accelerations for the
                    // relationships in the bottom right triangle of the body
                    // to other body table.
                    otherBody.x$$ -= xForce;
                    otherBody.y$$ -= yForce;
                }
            }
        }
        // TODO Execute planned maneuvers for maneuverable bodies.
        // Compute the new velocity and position of every object based on the
        // aggregated acceleration.
        for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
            var body = this.bodies[bodyIndex];
            var previousBody = body.previous;
            // Project velocity
            body.x$ = previousBody.x$ + previousBody.x$$;
            body.y$ = previousBody.y$ + previousBody.y$$;
            // Project position
            body.x = previousBody.x + previousBody.x$;
            body.y = previousBody.y + previousBody.y$;
        }
        return this;
    }
});

var ProjectedBody = exports.ProjectedBody = Body.extend({
    constructor: function ProjectedBody(previous, projection) {
        this.previous = previous;
        this.projection = projection;
        this.x = null;
        this.y = null;
        this.x$ = null;
        this.y$ = null;
        this.x$$ = null;
        this.y$$ = null;
    }
});

