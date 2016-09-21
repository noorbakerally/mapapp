angular.module('myApp').controller('initController', function($scope) {
	
	var trees = [
	{"y": 45.1652431769592, "x": 5.70811860693185, "code":"ESP29897"},
	{"y": 45.1973657781335, "x": 5.73650327568813, "code":"ESP22846"},
	{"y": 45.1632157003004, "x": 5.70689524375785, "code":"ESP29895"},
	{"y": 45.1675250918395, "x": 5.70349725176202, "code":"ESP29893"}];

	$scope.models = {};
	$scope.models["trees"] = trees;


	/*
		- group name
		- item type
		- icon type
		- number of items
		- Options:
			- show 
			- hide
			- edit
		- sparql query
		- description
		- group type

	*/
});

angular.module('myApp').controller('mapController', function($scope) {
	var mymap = L.map('mapid').setView([45.1, 5.7], 8);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=sk.eyJ1IjoiYmFrZW5vb3IiLCJhIjoiY2l0YjNjczhpMDAxMzJ1cDc5aXVxeHZ5NiJ9.8YzFSaP-znz8JUeHYybuTg', {
			maxZoom: 18,
			id: 'bakenoor.1eh9o2c2'
		}).addTo(mymap);

	var trees = $scope.models.trees;
	var trees_layer = L.layerGroup();
	for (var tree in trees){
		var new_layer = L.marker([trees[tree].y, trees[tree].x]).bindPopup(trees[tree].code);
		trees_layer.addLayer(new_layer)
	}
	trees_layer.addTo(mymap);
});


angular.module('myApp').controller('SPARQLQueryController', function($scope,$sce,SPARQLService) {
	
	$scope.url = "https://dbpedia.org/sparql";
	$scope.querystr = "select distinct ?Concept where {[] a ?Concept} LIMIT 100";
	$scope.query = function (){
		var data = SPARQLService.query($scope.url,$scope.querystr);
		data.then(function (answer){
			console.log(answer.data);
			$scope.result = $sce.trustAsHtml(answer.data);
		});
	};

	
});