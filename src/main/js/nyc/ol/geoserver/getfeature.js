var nyc = nyc || {};
nyc.ol = nyc.ol || {};
/** 
 * @public 
 * @namespace
 */
nyc.ol.geoserver = nyc.ol.geoserver || {};

/**
 * @desc A class to retrieve the feature of the specified layer at a map click and provide a WKT representation of its geometry 
 * @public
 * @class
 * @constructor
 * @param {nyc.ol.geoserver.GetFeature.Options} options Constructor options
 * @fires nyc.ol.geoserver.GetFeature#addfeature
 * @fires nyc.ol.geoserver.GetFeature#removefeature
 * @see http://www.geoserver.org/
 */
nyc.ol.geoserver.GetFeature = function(options){
	this.map = options.map;
	this.wkt = new ol.format.WKT({});
	this.geoJson = new ol.format.GeoJSON({});
	this.buffer = options.buffer || 25;
	this.units = options.units || nyc.ol.geoserver.GetFeature.BufferUnits.FEET;
	this.geomColumn = options.geomColumn || 'SHAPE';
	this.source = new ol.source.Vector({});
	this.layer = new ol.layer.Vector({
		source: this.source,
		style: options.style || this.defaultStyle
	});
	this.map.addLayer(this.layer);
	this.url = options.wfsUrl;
	this.url += '?service=wfs';
	this.url += '&version=2.0.0';
	this.url += '&request=GetFeature';
	this.url += ('&typeNames=' + options.namespace + ':' + options.typeName);
	if (options.propertyNames){
		this.url += ('&propertyName=' + options.propertyNames.toString());
	}
	this.url += '&count=1';
	this.url += '&outputFormat=text/javascript';
	this.url += ('&format_options=callback:' + this.instance() + '.callback');
	this.url += '&cql_filter=';
};

nyc.ol.geoserver.GetFeature.prototype = {
	/**
	 * @private
	 * @member {string} url
	 */ 
	url: null,
	/**
	 * @private
	 * @member {number} buffer
	 */ 
	buffer: null,
	/**
	 * @private
	 * @member {ol.source.Vector} source
	 */ 
	source: null,
	/**
	 * @private
	 * @member {ol.source.Layer} layer
	 */ 
	layer: null,
	/**
	 * @private
	 * @member {ol.format.GeoJSON} geoJson
	 */ 
	geoJson: null,
	/**
	 * @private
	 * @member {ol.format.GeoJSON} geoJson
	 */ 
	geoJson: null,
	/**
	 * @private
	 * @member {ol.format.WKT} wkt
	 */ 
	wkt: null,
	/**
	 * @private
	 * @member {boolean} active
	 */ 
	active: false,
	/**
	 * @private
	 * @member {string} filter
	 */ 
	filter: "DWITHIN(${geomColumn},POINT(${x} ${y}),${buffer},${units})",
	/**
	 * @private
	 * @member {ol.style.Style} defaultStyle
	 */ 
	defaultStyle: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(255,0,0,0.5)',
			width: 5
		})
	}),
	/** 
	 * @desc Get the features that have been captured
	 * @public 
	 * @method
	 * @return {Array<nyc.ol.Feature>} The features
	 */
	getFeatures: function(){
		var me = this, features = [];
		$.each(me.source.getFeatures(), function(_, feature){
			features.push({feature: feature, wkt: me.wkt.writeFeature(feature)});
		});
		return features;
	},
	/** 
	 * @desc Remove all captured features
	 * @public 
	 * @method
	 */
	clear: function(){
		this.source.clear();
	},
	/**
	 * @desc Return the active state
	 * @public
	 * @method
	 * @return {boolean} The active state
	 */
	active: function(){
		this.active;
	},
	/** 
	 * @desc Activate to begin capturing map clicks
	 * @public 
	 * @method
	 */
	activate: function(){
		this.active = true;
		this.map.on('click', this.getFeature, this);
	},
	/** 
	 * @desc Deactivate to stop capturing map clicks
	 * @public 
	 * @method
	 */
	deactivate: function(){
		this.active = false;
		this.map.un('click', this.getFeature, this);
	},
	/**
	 * @desc The callback that handles GeoServer WFS GetFeature responses
	 * @public
	 * @method
	 * @param {Object} data The GeoServer WFS GetFeature response
	 */
	callback: function(response){
		var data = {type: nyc.ol.FeatureEventType.ADD};
		if (response && response.features && response.features.length){
			data.feature = this.geoJson.readFeature(response.features[0]);
			data.feature.wkt = this.wkt.writeFeature(data.feature);
			this.source.addFeature(data.feature);
		}
		this.trigger(nyc.ol.FeatureEventType.ADD, data);
	},
	/**
	 * @private
	 * @method
	 * @param {ol.MapBrowserEvent} event
	 */
	getFeature: function(event){
		if (event.originalEvent.shiftKey){
			this.removeFeature(event);
		}else{
			var filter = this.filter, xy = event.coordinate;
			filter = filter.replace(/\$\{geomColumn\}/, this.geomColumn);
			filter = filter.replace(/\$\{x\}/, xy[0]);
			filter = filter.replace(/\$\{y\}/, xy[1]);
			filter = filter.replace(/\$\{buffer\}/, this.buffer);
			filter = filter.replace(/\$\{units\}/, this.units);
			$.ajax({
				url: this.url + filter,
				dataType: 'jsonp'
			});
		}
	},
	/**
	 * @private
	 * @method
	 * @return {string}
	 */
	instance: function(){
		var instance;
		for (var i = 0; i > -1; i++){
			instance = 'instance_' + i;
			if (!nyc.ol.geoserver.GetFeature[instance]){
				nyc.ol.geoserver.GetFeature[instance] = this;
				return 'nyc.ol.geoserver.GetFeature.' + instance;
			}
		}
	},
	/** 
	 * @private 
	 * @method
	 * @param {ol.MapBrowserEvent} event
	 */
	removeFeature: function(event){
		var me = this, map = me.map,
			feature = map.forEachFeatureAtPixel(event.pixel, 
				function(feature, layer){
					if (layer == me.layer){
						return feature;
		    		}		    		
		        }
			);	
		if (feature){
			this.trigger(nyc.ol.FeatureEventType.REMOVE, {
				type: nyc.ol.FeatureEventType.REMOVE,
				feature: {
					feature: feature, 
					wkt: me.wkt.writeFeature(feature)
				}
			});
			me.source.removeFeature(feature);
		}
	}	
};

nyc.inherits(nyc.ol.geoserver.GetFeature, nyc.EventHandling);

/**
 * @desc Object type to hold constructor options for {@link nyc.ol.geoserver.GetFeature}
 * @public
 * @typedef {Object}
 * @property {ol.Map} map The OpenLayers map with which the user will interact
 * @property {string} wfsUrl A GeoServer WFS URL (i.e. http://localhost/geoserver/wfs) 
 * @property {string} namespace The namespace of the layer from which to retrieve features
 * @property {string} typeName The type name of the layer from which to retrieve features
 * @property {string} geomColumn The name of the layer's geometry column that will be queried
 * @property {Array<string>=} propertyNames The property names of the layer to retrieve with the features
 * @property {number} [buffer=25] The buffer radius to use around the map click when querying the layer
 * @property {nyc.ol.geoserver.GetFeature.BufferUnits} [units=feet] The units of the buffer
 * @property {ol.style.Style=} style The style to use for features added to the map
 */
nyc.ol.geoserver.GetFeature.Options;

/**
 * @desc Buffer units to use when getting a feature at a map click
 * @public
 * @enum {string}
 */
nyc.ol.geoserver.GetFeature.BufferUnits = {
	/** 
	 * @desc Feet
	 */
	FEET: 'feet',
	/** 
	 * @desc Meters
	 */
	METERS: 'meters',
	/** 
	 * @desc Statute miles
	 */
	MILES: 'statute miles',
	/** 
	 * @desc Nautical miles
	 */
	NAUTICAL_MILES: 'nautical miles',
	/** 
	 * @desc Kilometers
	 */
	KILOMETERS: 'kilometers'
};

/**
 * @desc The added feature
 * @event nyc.ol.geoserver.GetFeature#addfeature
 * @type {nyc.ol.FeatureEvent}
 */

/**
 * @desc The removed feature
 * @event nyc.ol.geoserver.GetFeature#removefeature
 * @type {nyc.ol.FeatureEvent}
 */
