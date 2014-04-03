/* The `Thing` module ultimately exports a base constructor that supports
 * specialization, extensions to property descriptors, metaclassing, and
 * some convenient methods for property change listeners.  These are
 * conveniences that reduce the boilerplate needed to create robust and
 * idiomatic JavaScript constructors and prototypes.
 */
"use strict";

require("collections/shim");
var WeakMap = require("collections/weak-map");

var protoIsSupported = {}.__proto__ === Object.prototype;

function Embraceable() {}
Object.defineProperties(Embraceable, {

    extendProperties: {
        value: function extendProperties(prototypeProperties, constructorProperties) {
            var parent = this;

            prototypeProperties = prototypeProperties || Object.empty;
            constructorProperties = constructorProperties || Object.empty;

            // make or take a constructor function.  the user may provide a
            // constructor function, and in fact should do so if they want a
            // name that can be inspected, by passing a "constructor" on among
            // the prototype properties.
            var constructor;
            if (
                typeof prototypeProperties.constructor === "object" &&
                typeof prototypeProperties.constructor.value === "function"
            ) {
                constructor = prototypeProperties.constructor.value;
            } else {
                constructor = function AnnonymousConstructor() {
                    return parent.apply(this, arguments) || this;
                };
            }

            // TODO handle foreign parents
            // var parentIsForeign = typeof parent.extend === "undefined"
            // assimilate the foreign type somehow

            // establish an inheritance chain among the constructors, by
            // whatever means necessary.  on engines that implement __proto__,
            // this is simple.  in other engines, notably legacy Intenet
            // Explorers, we emulate this by copying properties from the parent
            // constructor.  in either case, we write __proto__, because it is
            // useful for patching up Object.getPrototypeOf in the latter case.
            constructor.__proto__ = parent;
            if (!protoIsSupported) {
                var names = this.getOwnPropertyNames(parent);
                for (var i = 0; i < names.length; i++) {
                    var name = names[i];
                    var property = this.getOwnPropertyDescriptor(
                        constructor,
                        name
                    );
                    if (!property || property.configurable) {
                        this.defineProperty(
                            constructor,
                            name,
                            this.getOwnPropertyDescriptor(parent, name)
                        );
                    }
                }
            }

            // then we provide some linkage.  we delegate to `this` for these
            // ES5 methods because they can be overridden downstream.
            var prototype = this.create(this.prototype);
            this.defineProperties(prototype, prototypeProperties);
            this.defineProperties(constructor, constructorProperties);
            constructor.prototype = prototype;
            this.defineProperty(prototype, "constructor", {
                value: constructor,
                writable: true,
                configurable: true,
                enumerable: false
            });
            // this is a memo for super methods
            //this.defineProperty(constructor, "__super__", {
            //    value: {},
            //    writable: true,
            //    configurable: true,
            //    enumerable: false
            //});

            return constructor;

        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    extend: {
        value: function extend(prototypeProperties, constructorProperties) {
            prototypeProperties = prototypeProperties || Object.empty;
            constructorProperties = constructorProperties || Object.empty;
            var prototypePropertyDescriptors = {};
            var constructorPropertyDescriptors = {};
            Object.keys(prototypeProperties).forEach(function (name) {
                prototypePropertyDescriptors[name] = {
                    value: prototypeProperties[name],
                    configurable: true,
                    writable: true,
                    enumerable: false
                };
            });
            Object.keys(constructorProperties).forEach(function (name) {
                constructorPropertyDescriptors[name] = {
                    value: constructorProperties[name],
                    configurable: true,
                    writable: true,
                    enumerable: false
                };
            });
            return this.extendProperties(
                prototypePropertyDescriptors,
                constructorPropertyDescriptors
            );
        }
    },

    create: {
        value: function (prototype, properties) {
            // we reimplement Object.create to delegate to
            // this.defineProperties so that the behavior can be overridden by
            // implementing an alternate this.defineProperty down the
            // inheritance chain.
            var object = Object.create(prototype);
            this.defineProperties(properties);
            return object;
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    defineProperties: {
        value: function defineProperties(object, properties) {
            // again, we delegate to this.defineProperty instead of
            // Object.defineProperties, so that the behavior can be overridden
            // down the inheritance chain.
            for (var name in properties) {
                this.defineProperty(object, name, properties[name]);
            }
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    defineProperty: {
        value: Object.defineProperty,
        configurable: true,
        writable: true,
        enumerable: false
    },

    getOwnPropertyDescriptor: {
        value: Object.getOwnPropertyDescriptor,
        configurable: true,
        writable: true,
        enumerable: false
    },

    getOwnPropertyNames: {
        value: Object.getOwnPropertyNames,
        configurable: true,
        writable: true,
        enumerable: false
    },

    isPrototypeOf: {
        value: function isPrototypeOf(object) {
            while (object !== null) {
                if (this.getPrototypeOf(object) === this) {
                    return true;
                }
                object = this.getPrototypeOf(object);
            }
            return false;
        },
        configurable: true,
        writable: true,
        enumerable: false
    },

    getPrototypeOf: {
        value: Object.getPrototypeOf,
        configurable: true,
        writable: true,
        enumerable: false
    }

});

if (!protoIsSupported) {
    // If the __proto__ property isn't supported than we need to patch up
    // behavior for constructor functions
    var superGetPrototypeOf = Object.getPrototypeOf;
    Object.getPrototypeOf = function getPrototypeOf(object) {
        if (typeof object === "function" && object.__proto__) {
            // we have set the __proto__ property of the function to be it's
            // parent constructor
            return object.__proto__;
        } else {
            return superGetPrototypeOf.apply(Object, arguments);
        }
    };
}

/**
 * The Embraceable defines specialization. Extensible extends Embraceable
 * such that property descriptors have more commonly used default values,
 * extensible property descriptors, and supports "distict" properties.
 */
var Extensible = Embraceable.extendProperties({

    constructor: {
        value: function Extensible() {
            var distinctProperties = this.constructor.distinctProperties;
            for (var name in distinctProperties) {
                this[name] = Object.clone(distinctProperties[name]);
            }
        },
        enumerable: false,
        configurable: true,
        writable: true
    }

}, {

    propertyDescriptors: {
        value: new WeakMap(),
        enumerable: false,
        configurable: true,
        writable: true
    },

    distinctProperties: {
        value: {},
        enumerable: false,
        writable: true,
        configurable: true
    },

    extendProperties: {
        value: function extendProperties(prototypeProperties, constructorProperties) {
            prototypeProperties = prototypeProperties || empty;
            constructorProperties = constructorProperties || {};

            var distinctProperties = Object.clone(this.distinctProperties, 1);
            constructorProperties.distinctProperties = {
                value: distinctProperties,
                enumerable: false,
                writable: true,
                configurable: true
            };

            // collect distinct properties on a prototype
            for (var name in prototypeProperties) {
                var property = prototypeProperties[name];
                if (property.distinct) {
                    distinctProperties[name] = property.value;
                    property.value = null;
                    delete property.distinct;
                }
            }

            return Embraceable.extendProperties.call(
                this,
                prototypeProperties,
                constructorProperties
            );
        },
        enumerable: false,
        configurable: true,
        writable: true
    },

    defineProperty: {
        value: function (object, name, property) {
            if (!("writable" in property)) {
                property.writable = true;
            }
            if (!("configurable" in property)) {
                property.configurable = true;
            }
            if (!("enumerable" in property)) {
                property.enumerable = (
                    name.charAt(0) !== "_" &&
                    typeof property.value !== "function"
                );
            }

            // extended property descriptors have a prototype chain
            var underlyingProperty = this.getOwnPropertyDescriptor(object, name);
            delete underlyingProperty.value;
            delete underlyingProperty.get;
            delete underlyingProperty.set;
            delete underlyingProperty.writable;
            delete underlyingProperty.configurable;
            delete underlyingProperty.enumerable;
            for (var key in property) {
                underlyingProperty[key] = property[key];
            }
            Embraceable.defineProperty(object, name, underlyingProperty);
            return object;
        },
        enumerable: false,
        configurable: true,
        writable: true
    },

    getOwnPropertyDescriptor: {
            value: function (object, name) {
            if (object == null) {
                return null;
            }
            if (!this.propertyDescriptors.has(object)) {
                this.propertyDescriptors.set(object, {});
            }
            var propertyDescriptors = this.propertyDescriptors.get(object);
            if (!(name in propertyDescriptors)) {
                var parent = Object.getPrototypeOf(object);
                var parentDescriptor = this.getOwnPropertyDescriptor(parent, name);
                propertyDescriptors[name] = Object.create(parentDescriptor);
            }
            var propertyDescriptor = propertyDescriptors[name];
            // TODO use this.super() for Serializable.gOPD
            var underlyingPropertyDescriptor = Embraceable.getOwnPropertyDescriptor(object, name) || {};
            for (var name in underlyingPropertyDescriptor) {
                propertyDescriptor[name] = underlyingPropertyDescriptor[name];
            }
            return propertyDescriptor;
        },
        enumerable: false,
        configurable: true,
        writable: true
    }

});

module.exports = Extensible;

