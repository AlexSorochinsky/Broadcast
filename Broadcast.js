//-----------------------------------------------------------------------------
// Filename : Broadcast.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Author : Alex Sorochinsky
// Date of creation : 08.08.2016
// Require: 
//-----------------------------------------------------------------------------
// Javascript library which realizes observer pattern for both browser and server (Node.js) environment
//-----------------------------------------------------------------------------

//Main namespace for library use it for global events
//Broadcast.on('My event', my_func, this); Broadcast.call('My event'); Broadcast.off('My event', this);
var Broadcast = {};

//Implement Broadcast methods to custom object
Broadcast.make = function(object) {

	var prototype = Broadcast._prototype;

	for (var i in prototype) if (prototype.hasOwnProperty(i)) {

		if (object[i]) Broadcast._warn('Broadcast.make() warning! You try implement Broadcast functionality to custom object, but this object already have the same property.', object, i);

		object[i] = prototype[i];

	}

	object._broadcast_events = {};

	object._broadcast_timeouts = {};

	object._broadcast_codename = 1;

};

Broadcast._warn = function() {

	if (typeof console == 'object') {

		if (console.warn) console.warn.apply(console, arguments);
		else if (console.log) console.log.apply(console, arguments);

	}

};

Broadcast._getSourceCodename = function(source) {

	if (source._broadcast_codename) return source._broadcast_codename;

	source._broadcast_codename = (source.displayName || source.name || source.Name || 'object') + (Broadcast._index++);

	return source._broadcast_codename;

};

Broadcast._index = 1;

Broadcast._prototype = {};

Broadcast._prototype.on = function(name, caller, source, options) {

	if (Array.isArray(name)) {

		for (var i=0, l=name.length; i<l; i++) {

			this.on(name[i], caller, source, options);

		}

	} else {

		if (!options) options = {};

		if (typeof source == 'string') options.index = source;

		else if (source) {

			options.index = this._getSourceCodename(source);

			options.bind = source;

		}

		if (options.index) {

			if (!this._broadcast_events[name]) this._broadcast_events[name] = {};

			this.off(name, options.index);

			if (options && options.index && options.times) {

				var original_func = caller, _this = this;

				caller = function () {

					var args = arguments;

					if (!_this._broadcast_timeouts[name + '-' + options.index]) _this._broadcast_timeouts[name + '-' + options.index] = setTimeout(function () {

						_this._broadcast_timeouts[name + '-' + options.index] = null;

						_this._callSubscriber(original_func, options, args);

					}, options.times);

				}

			}

			this._broadcast_events[name][options.index] = {caller: caller, options: options};

		} else {

			Broadcast._warn('Broadcast.on() warning! You need specify source of the event subscriber or index', name, caller, source, options);

		}

	}

};

Broadcast._prototype.off = function(name, source) {

	if (!source) Broadcast._warn('Broadcast.off() warning! You need specify source of the event subscriber or index', name, source);

	if (Array.isArray(name)) {

		for (var i=0, l=name.length; i<l; i++) {

			this.off(name[i], source);

		}

	} else {

		var codename = (typeof source == 'string') ? source : this._getSourceCodename(source);

		var callers = this._broadcast_events[name];
		if (!callers || !callers[codename]) return;

		delete callers[codename];

	}

};

Broadcast._prototype.call = function(name, args, options, source) {

	var _this = this;

	if (options && options.delay) {

		setTimeout(function () {

			_this.call(name, args, options);

		}, options.delay);

		delete options.delay;

	} else {

		var subscriber, opt, callers = this._broadcast_events[name];

		if (!callers) return;

		if (source) {

			var codename = (typeof source == 'string') ? source : this._getSourceCodename(source);

			subscriber = callers[codename];
			opt = callers[codename].options || {};

			if (opt.delay) {

				_this._delay_call(subscriber.caller, opt, args);

			} else {

				_this._call(subscriber.caller, opt, args);

			}

		} else {

			for (var i in callers) if (callers.hasOwnProperty(i)) {

				subscriber = callers[i];
				opt = callers[i].options || {};

				if (opt.delay) {

					_this._delay_call(subscriber.caller, opt, args);

				} else {

					_this._call(subscriber.caller, opt, args);

				}

			}

		}

	}

};

Broadcast._prototype._delay_call = function (caller, options, args) {

	var _this = this;

	if (!options.delayTimeout) {

		options.delayTimeout = setTimeout(function () {

			_this._call(caller, options, args);

			options.delayTimeout = null;

		}, options.delay);

	}

};

Broadcast._prototype._call = function (caller, options, args) {

	caller.apply(options.bind || this, args || []);

};