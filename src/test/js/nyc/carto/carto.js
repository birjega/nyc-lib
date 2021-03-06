QUnit.module('nyc.carto.Sql', {});

QUnit.test('constructor', function(assert){
	assert.expect(4);

	var sql = new nyc.carto.Sql('my.named.query');
	assert.equal(sql.url, nyc.carto.Sql.DEFAULT_URL);
	assert.equal(sql.namedQuery, 'my.named.query');

	sql = new nyc.carto.Sql('my.other.query', '/my/other/url');
	assert.equal(sql.url, '/my/other/url');
	assert.equal(sql.namedQuery, 'my.other.query');
});

QUnit.test('execute', function(assert){
	assert.expect(4);

	var sql = new nyc.carto.Sql('my.named.query');

	var filterValues = {
		filter1: {param1: 'param1', param2: 'param2'}, 
		filter2: {arg1: 'arg1', arg2: 'arg2'}
	};
	
	var ajaxResponse = 'ajax-response';
	var callback = function(data){
		assert.equal(data, ajaxResponse);
	};
	
	var ajax = $.ajax;
	$.ajax = function(args){
		assert.equal(args.url, sql.url);
		assert.equal(args.data.namedQuery, 'my.named.query');
		assert.deepEqual(args.data.filterValues, filterValues);
		args.success(ajaxResponse);
	};
	
	sql.execute(filterValues, callback);
	
	$.ajax = ajax;
});

QUnit.module('nyc.carto.SqlTemplate', {});

QUnit.test('sql', function(assert){
	assert.expect(3);

	var sql = new nyc.carto.SqlTemplate();
	var template = "SELECT '${something}' AS something FROM everything WHERE ${where}";
	var filters = {
	   col_a: "col_a = '${col_a}'",	
	   col_b: "col_b > ${col_b}",	
	   col_c: "col_c BETWEEN ${col_c_0} AND ${col_c_1}"
	};

	var result = sql.sql(template, {something: {something: 'nothing'}, col_a: {col_a: 'valueA'}}, filters);
	assert.equal(result, "SELECT 'nothing' AS something FROM everything WHERE col_a = 'valueA'");

	result = sql.sql(template, {something: {something: 'nothing'}, col_a: {col_a: 'valueA'}, col_b: {col_b: 100}}, filters);
	assert.equal(result, "SELECT 'nothing' AS something FROM everything WHERE col_a = 'valueA' AND col_b > 100");

	result = sql.sql(template, {something: {something: 'nothing'}, col_a: {col_a: 'valueA'}, col_b: {col_b: 100}, col_c: {col_c_0: 1, col_c_1: 2}}, filters);
	assert.equal(result, "SELECT 'nothing' AS something FROM everything WHERE col_a = 'valueA' AND col_b > 100 AND col_c BETWEEN 1 AND 2");
});