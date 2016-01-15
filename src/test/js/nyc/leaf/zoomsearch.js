QUnit.module('nyc.leaf.ZoomSearch', {
	beforeEach: function(assert){
		setup(assert, this);
		$('body').append('<div><div id="test-map"></div></div>');
		this.MOCK_MAP = {
			zoom: 0,
			getZoom: function(){
				return this.zoom;
			},
			setZoom: function(z){
				return this.zoom = z;
			},
			getContainer: function(){
				return $('#test-map');
			},
			getMaxZoom: function(){
				return nyc.leaf.ZoomSearch.MAX_ZOOM;
			}
		};
	},
	afterEach: function(assert){
		teardown(assert, this);
		$('#test-map').parent().remove();
	}
});

QUnit.test('zoom', function(assert){
	assert.expect(4);

	var control = new nyc.leaf.ZoomSearch(this.MOCK_MAP);
	
	var zoom = this.MOCK_MAP.getZoom();
	$('#btn-z-in').trigger('click');
	assert.equal(this.MOCK_MAP.getZoom(), zoom + 1);
	
	$('#btn-z-out').trigger('click');
	assert.equal(this.MOCK_MAP.getZoom(), zoom);
	
	this.MOCK_MAP.zoom = 0;
	$('#btn-z-out').trigger('click');
	assert.equal(this.MOCK_MAP.getZoom(), 0);
	
	this.MOCK_MAP.zoom = nyc.leaf.ZoomSearch.MAX_ZOOM;
	$('#btn-z-in').trigger('click');
	assert.equal(this.MOCK_MAP.getZoom(), nyc.leaf.ZoomSearch.MAX_ZOOM);
	
});

QUnit.test('container', function(assert){
	assert.expect(1);

	var control = new nyc.leaf.ZoomSearch(this.MOCK_MAP);
	assert.deepEqual(control.container(), $('#test-map'));
});
