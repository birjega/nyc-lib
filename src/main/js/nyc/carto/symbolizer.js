var nyc = nyc || {};
nyc.carto = nyc.carto || {};

/**
 * @desc An interface for symbolizing CartoDB layers
 * @public
 * @interface
 */
nyc.carto.Symbolizer = function(){};

nyc.inherits(nyc.carto.Symbolizer, nyc.ReplaceTokens);
nyc.inherits(nyc.carto.Symbolizer, nyc.EventHandling);

/** 
 * @desc Enumerator for symbolizer event types
 * @enum {string}
 */
nyc.carto.Symbolizer.EventType = {
	/**
	 * @desc The symbolized event fired after a symbolizer completes its symbolize function
	 */
	SYMBOLIZED: 'symbolized' 
};

/**
 * @desc The result of symbolization 
 * @event nyc.carto.Symbolizer#symbolized
 * @type {Object}
 */




