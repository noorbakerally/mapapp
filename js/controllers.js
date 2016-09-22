var models = angular.module('myApp').models;

angular.module('myApp').controller('GroupViewerController', function($scope,$rootScope) {
	$scope.configs = $rootScope.config;
	$scope.layers = $rootScope.layers;
});
angular.module('myApp').controller('OneGroupViewerController', function($scope,$rootScope,$location,Utilities) {
	

	//showing or hiding the checkbox for showing the layers on the map
	// let it be true for now
	$scope.showhide = true;
	/*
	$scope.showhide = false;
	
	if ($location.url() == "/"){
		$scope.showhide = true;
	}
	*/

	$scope.configs = $rootScope.config;
	$scope.layers = $rootScope.layers;

	
	$scope.show = function(groupName){
		//newConfig.dataSource.getDataItemsWithLatLong(newConfig.latCol,newConfig.longCol);
		var configObj = $rootScope.config[groupName];
		if (configObj.visible){
			if (configObj.dataSource.promiseResolved) {
				configObj.layerGroup.addTo($rootScope.map);
			} else {
				configObj.dataSource.getDataItems($rootScope.map,configObj);
			}
		} else {
			$rootScope.map.removeLayer(configObj.layerGroup);
			configObj.visible = false;
		}

	}

});

angular.module('myApp').controller('mapController', function($scope,$rootScope) {
	var mymap = L.map('mapid').setView([45.1, 5.7], 3);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=sk.eyJ1IjoiYmFrZW5vb3IiLCJhIjoiY2l0YjNjczhpMDAxMzJ1cDc5aXVxeHZ5NiJ9.8YzFSaP-znz8JUeHYybuTg', {
			maxZoom: 18,
			id: 'bakenoor.1eh9o2c2'
		}).addTo(mymap);
	$rootScope.map = mymap;
	
});


angular.module('myApp').controller('SPARQLQueryController', function($scope,$rootScope,$sce,SPARQLService) {
	
	$scope.url = "https://dbpedia.org/sparql";
	$scope.querystr = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT distinct ?country ?capital ?caplat ?caplong
WHERE {
  ?country rdf:type dbo:Country .
  ?country  dbo:capital ?capital .
  ?capital geo:lat ?caplat ;
     geo:long ?caplong .
  
}
ORDER BY ?country
LIMIT 10
	`;
	$scope.sparql_error = false;
	var sparql_result;
	var bindings;
	var data;
	$scope.query = function (){
		$scope.sparql_status = false;
		data = SPARQLService.query($scope.url,encodeURIComponent($scope.querystr));
		data.then(function (answer){
			console.log(answer);
			sparql_result = answer.data;
			$scope.columns = answer.data.head.vars;
			bindings = answer.data.results.bindings;
			$scope.sparql_status = true;
			$scope.numResults = answer.data.results.bindings.length;
			$scope.sparql_error = false;
		},
		function (error){
			$scope.sparql_error = true;
			$scope.error = "Invalid SPARQL Query"
			$scope.sparql_status = false;
			$scope.columns = [];
		}
		); 
	};
	$scope.addGroup = function (){

		newConfig = new models.MarkerLayerConfig();
		newConfig.name = $scope.groupname;
		newConfig.latCol = $scope.lat;
		newConfig.longCol = $scope.long;
		newConfig.color = $scope.color;
		newConfig.markerDescription = $scope.desc;
		newConfig.dataSource = new models.SPARQLDataSource();
		newConfig.dataSource.url = $scope.url;
		newConfig.dataSource.query = newConfig.dataSource
		newConfig.dataSource.promise = data;
		newConfig.dataSource.promiseResolved = false;

		if ($scope.groupname in $rootScope.config){
			$scope.sparql_error = true;
		} else {
			$rootScope.config[$scope.groupname] = newConfig;
			$scope.sparql_error = false;
			$scope.error = "Group name already exists, choose a different group name";	
		}
	};
});

angular.module('myApp').controller('initController', function($scope,$rootScope,SPARQLService,Utilities) {
	
	/*
		- group name
		- item type
		- icon type
		- color
		- number of items
		- Options:
			- show 
			- hide
			- edit
		- sparql query
		- description
		- group type

	*/
	

	var configs = {
	    "Test3": {
	        "type": "LayerConfig",
	        "name": "Test3",
	        "description": "Description about Test 3",
	        "dataSource": {
	            "type": "GeoJSONDataSource",
	            "url": "https://raw.githubusercontent.com/mledoze/countries/master/data/fra.geo.json"
	        }
	    }
	};
	
	
	
	

	for (var config in configs ){
		var newConfig = configs[config];
		var newLayerConfig;

		if (newConfig.type == "LayerConfig"){
			newLayerConfig = new models.LayerConfig();
		}

		newLayerConfig.name = newConfig.name;
		newLayerConfig.description = newConfig.description;

		if (newConfig.dataSource.type == "GeoJSONDataSource"){
			newLayerConfig.dataSource = new models.GeoJSONDataSource();
		}
		newLayerConfig.dataSource.url = newConfig.dataSource.url;

		var data = SPARQLService.query(newConfig.dataSource.url,encodeURIComponent(newConfig.dataSource.query));
		newLayerConfig.dataSource.promise = data;
		newLayerConfig.dataSource.promiseResolved = false;
		newLayerConfig.visible = false;


		$rootScope.config[newConfig.name] = newLayerConfig;
	}
	console.log($rootScope.config);
});