/**
 * CSS Global Order by Marat Tanalin
 * http://tanalin.com/en/projects/css-global-order/
 * @version 2015-10-02
 */

(function() {
	var log;

	if (window.console && console.log) {
		log = function(text) {
			console.log(text);
		};
	}
	else {
		log = function(text) {
			throw text;
		};
	}

	var logNoSupport = function(feature) {
		log('The browser does not support ' + feature + '.');
	};

	var testElement = document.createElement('a');

	var getOrderName = function() {
		var style = testElement.style,
		    order = 'order',
		    props = [order, 'MozBoxOrdinalGroup', 'WebkitOrder', 'WebkitBoxOrdinalGroup'],
		    count = props.length;

		for (var i = 0; i < count; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}

		return document.all ? order : null;
	};

	var orderName = getOrderName();

	if (null === orderName) {
		logNoSupport('accessing CSS order');
		return;
	}

	var forEach = function(items, callback) {
		var count = items.length;

		for (var i = 0; i < count; i++) {
			callback(items[i]);
		}
	};

	var inArray = function(needle, haystack) {
		if (haystack.indexOf) {
			return haystack.indexOf(needle) !== -1;
		}

		var count = haystack.length;

		for (var i = 0; i < count; i++) {
			if (needle === haystack[i]) {
				return true;
			}
		}

		return false;
	};

	var isArray;

	if (Array.isArray) {
		isArray = Array.isArray.bind(Array);
	}
	else {
		isArray = function(a) {
			return a.constructor === Array;
		};
	}

	var isString = function(a) {
		return 'string' === typeof a || a.constructor === String;
	};

	var arrayFrom;

	if (Array.from) {
		arrayFrom = Array.from.bind(Array);
	}
	else {
		arrayFrom = function(arrayLike) {
			var items;

			try {
				items = Array.prototype.slice.call(arrayLike, 0);
			}
			catch(e) {
				items = [];

				forEach(arrayLike, function(item) {
					items.push(item);
				});
			}

			return items;
		};
	}

	var getStyleProperty, isFlex;

	if (window.getComputedStyle) {
		getStyleProperty = function(elem, name) {
			return getComputedStyle(elem, null)[name];
		};

		isFlex = function(elem) {
			var values = [
				        'flex',         'inline-flex',
				'-webkit-flex', '-webkit-inline-flex',
				'-ms-flexbox',  '-ms-inline-flexbox',
				   '-moz-box',     '-moz-inline-box',
				'-webkit-box',  '-webkit-inline-box'
			];

			return inArray(getStyleProperty(elem, 'display'), values);
		};
	}
	else {
		getStyleProperty = function(elem, name) {
			return elem.currentStyle[name];
		};

		isFlex = function(elem) {
			return false;
		};
	}

	var getOrder = function(node) {
		var order;

		if (1 === node.nodeType) {
			order = getStyleProperty(node, orderName);

			if (!order) {
				order = 0;
			}
		}
		else {
			order = 0;
		}

		return order;
	};

	var isValidNode = function(node) {
		return inArray(node.nodeType, [1, 3]);
	};

	var getValidChildNodes = function(elem) {
		var nodes   = elem.childNodes,
		    count   = nodes.length,
		    valid   = [],
		    reorder = false;

		for (var i = 0; i < count; i++) {
			var node = nodes[i];

			if (isValidNode(node)) {
				valid.push(node);

				if (!reorder && 0 != getOrder(node)) {
					reorder = true;
				}
			}
		}

		return reorder ? valid : null;
	};

	var compareNodes = function(a, b) {
		var aOrder = getOrder(a),
		    bOrder = getOrder(b),
		    result;

		if (aOrder < bOrder) {
			result = -1;
		}
		else if (aOrder > bOrder) {
			result = 1;
		}
		else {
			result = 0;
		}

		return result;
	};

	var getOrderedChildNodes = function(elem) {
		var nodes = getValidChildNodes(elem);
		return null === nodes ? null : nodes.sort(compareNodes);
	};

	var removeChildNodes;

	if ('textContent' in testElement) {
		removeChildNodes = function(elem) {
			elem.textContent = '';
		};
	}
	else {
		removeChildNodes = function(elem) {
			forEach(arrayFrom(elem.childNodes), function(node) {
				elem.removeChild(node);
			});
		};
	}

	var appendNodes = function(elem, nodes) {
		forEach(nodes, function(node) {
			elem.appendChild(node);
		});
	};

	var processBySelector;

	if (document.querySelectorAll) {
		processBySelector = function(selector, callback) {
			forEach(document.querySelectorAll(selector), callback);
		};
	}
	else {
		processBySelector = function() {
			logNoSupport('the Selectors API');
		}
	}

	var processElementChildNodes = function(parent) {
		if (isFlex(parent)) {
			return;
		}

		var nodes = getOrderedChildNodes(parent);

		if (null === nodes) {
			return;
		}

		replaceChildNodes(parent, nodes);
	};

	var processChildren = function(parent) {
		if (isString(parent)) {
			processBySelector(parent, processElementChildNodes);
		}
		else if (isArray(parent)) {
			forEach(parent, processElementChildNodes);
		}
		else {
			processElementChildNodes(parent);
		}
	};

	var processScope = function(scope) {
		processChildren(scope);
		forEach(arrayFrom(scope.getElementsByTagName('*')), processChildren);
	};

	var process = function(scope) {
		if ('undefined' === typeof scope) {
			processScope(document.documentElement);
		}
		else if (isString(scope)) {
			processBySelector(scope, processScope);
		}
		else if (isArray(scope)) {
			forEach(scope, processScope);
		}
		else {
			processScope(scope);
		}
	};

	var replaceChildNodes = function(elem, nodes) {
		removeChildNodes(elem);
		appendNodes(elem, nodes);
	};

	window.CSSGlobalOrder = {
		processChildren : processChildren,
		process         : process
	};
})();