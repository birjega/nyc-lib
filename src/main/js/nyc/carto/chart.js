var nyc = nyc || {};
nyc.carto = nyc.carto || {};

/**
 * @desc A class to render ChartJS charts using CartoDB data
 * @public
 * @class
 * @extends {nyc.carto.SqlTemplate}
 * @constructor
 * @param {nyc.carto.Chart.Options} options Constructor options
 */
nyc.carto.Chart = function(options){
	this.cartoSql = options.cartoSql;
	this.canvas = $(options.canvas);
	this.sqlTemplate = options.sqlTemplate;
	this.descriptionTemplate = options.descriptionTemplate;
	this.dataColumn = options.dataColumn;
	this.labelColumn = options.labelColumn;
	this.filters = options.filters;
	this.chartOptions = options.chartOptions || {scaleFontColor: 'black', scaleLineColor: 'rgba(0,0,0,0.3)', customTooltips: this.tip};
	this.seriesOptions = options.seriesOptions || [{fillColor: 'black', strokeColor: 'transparent'}, {fillColor: 'rgba(0,0,0,0.3)', strokeColor: 'transparent'}];
	this.labelLookupFunction = options.labelLookupFunction || function(lbl){return lbl;};
};

nyc.carto.Chart.prototype = {
	/**
	 * @private
	 * @member {Object}
	 */
	currentData: null,
	/**
	 * @private
	 * @member {Array<string>}
	 */
	prevSqls: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	canvas: null,
	/** 
	 * @public
	 * @method 
	 * @param {Array<Object<string, Object<string, string>>>} filterValuesArray The values objects used along with the views filters and sqlTemlate to modify the queries for the chart series
	 * @param {JQuery|Element|string} titleNode The HTML element for title text
	 * @param {Array<Object<string, string>>} descriptionValues The values objects for replacing tokens in the descriptionTemplate
	 */ 	
	chart: function(filterValuesArray, titleNode, descriptionValues){
		var me = this, sqls = [], datasets = [];
		$.each(filterValuesArray, function(_, filterValues){
			sqls.push(me.sql(me.sqlTemplate, filterValues, me.filters));
		});		
		if (!me.isSame(sqls)){
			me.prevSqls = sqls;
			$.each(sqls, function(_, sql){
				me.cartoSql.execute(sql).done(
					function(data){
						datasets.push(data.rows);
						if (datasets.length == filterValuesArray.length){
							me.title(titleNode, descriptionValues);
							me.updateData(datasets);
						}
					}
				);
			});		
		}
	},
	/**
	 * @private
	 * @method 
	 * @param {Array<string>} sqls 
	 * @return {boolean}
	 */
	isSame: function(sqls){
		if (!this.prevSqls || sqls.length != this.prevSqls.length) return false;
		for (var i = 0; i < sqls.length; ++i) {
			if (sqls[i] != this.prevSqls[i]) return false;
		}
		return true;
	},
	/**
	 * @private
	 * @method 
	 * @param {(JQuery|Element|string)} titleNode 
	 * @param {Object} descriptionValues 
	 */
	title: function(titleNode, descriptionValues){
		var me = this;
		$(titleNode).addClass('chart-title');
		$(titleNode).html(this.replace(this.descriptionTemplate, descriptionValues));
		$.each(descriptionValues.seriesTitles, function(i, title){
			var html = new String(nyc.carto.Chart.SERIES_HTML);
			$(titleNode).append(me.replace(html, {index: i, title: title}));
		});
	},
	/**
	 * @private
	 * @method 
	 * @param {Array<Object>} datasets
	 */
	updateData: function(datasets){
		var dataCol = this.dataColumn,
			labelCol = this.labelColumn,
			labelLookupFunction = this.labelLookupFunction,
			seriesOptions =  this.seriesOptions,
			data = {labels: [], datasets: []};
		$.each(datasets, function(i, rows){
			var labels = [], dataset = seriesOptions[i];
			dataset.data = [];
			$.each(rows, function(_, row){
				if (i == 0){
					data.labels.push(labelLookupFunction(row[labelCol]));
				}
				dataset.data.push(row[dataCol]);
			});
			data.datasets.push(dataset);
		});
		this.currentData = data;
		this.render();
	},
	/**
	 * @private
	 * @method 
	 * @param {Object} tooltip 
	 */
	tip: function(tooltip) {
		var tip = $('#chart-tip');
		if (tooltip){
			var offset = $(tooltip.chart.canvas).offset();        	
			if (!tip.length){
				tip = $('<div id="chart-tip"></div>');
				$('body').append(tip);
			};
			tip.html('<div class="chart-tip-title">' + tooltip.title + '</div>');
			$.each(tooltip.labels, function(i, label){
				tip.append('<div class="chart-tip-' + i + '">' + label + '</div>');
			});
			tip.css({
				left: offset.left + tooltip.x + 'px',
				top: offset.top + tooltip.y - 10 + 'px'
			}).show();
		}else{
			tip.hide();
		}
    },
	/**
	 * @desc Renders the chart or forces a rerendering of the chart
	 * @public
	 * @method 
	 */
	render: function(){
		if (this.currentData){
			var chart = this.canvas.data('chart'), ctx = this.canvas.get(0).getContext('2d');
			if (chart) chart.destroy();
			chart = new Chart(ctx).Bar(this.currentData, this.chartOptions);
			this.canvas.data('chart', chart);
		}
	}	
};

nyc.inherits(nyc.carto.Chart, nyc.carto.SqlTemplate);

/**
 * @desc Object type to hold constructor options for {@link nyc.carto.Chart}
 * @public
 * @typedef {Object}
 * @property {(JQuery|Element|string)} canvas The canvas element for chart rendering
 * @property {cartodb.SQL} cartoSql The object used to query CartoDB data 
 * @property {string} sqlTemplate The template with optional replacement tokens for generating queries for cartoSql
 * @property {string} descriptionTemplate The template with optional replacement tokens for the chart description
 * @property {string} dataColumn The data column for the y-axis chart values
 * @property {string} labelColumn The data column for labeling the x-axis of the chart
 * @property {Object<string, Object<string, string>>} filters The filters object used with the sqlTemplate for generating queries for cartoSql
 * @property {Object=} chartOptions ChartJS options (See: [http://www.chartjs.org/]{@link http://www.chartjs.org/})
 * @property {Array<Object>=} seriesOptions ChartJS options (See: [http://www.chartjs.org/]{@link http://www.chartjs.org/})
 * @property {function(string):string=} labelLookupFunction A function to transform labelColumn column values from the data into readable labels 
 */
nyc.carto.Chart.Options;

/**
 * @private
 * @const
 * @type {string}
 */
nyc.carto.Chart.SERIES_HTML = '<div class="chart-series chart-series-${index}"><div class="chart-series-icon"></div>${title}</div>';