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
				configObj.dataSource.getDataItemsWithLatLong($rootScope.map,configObj);
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
	$scope.query = function (){
		$scope.sparql_status = false;
		var data = SPARQLService.query($scope.url,encodeURIComponent($scope.querystr));
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
		var newConfig = {};
		newConfig["groupName"] = $scope.groupname;
		newConfig["lat"] = $scope.lat;
		newConfig["long"] = $scope.long;
		newConfig["desc"] = $scope.desc;
		newConfig["endpointURL"] = $scope.url;
		newConfig["SPARQLQuery"] = $scope.querystr
		if ($scope.groupname in $rootScope.config){
			$scope.sparql_error = true;
		} else {
			$rootScope.config[$scope.groupname] = newConfig;
			$scope.sparql_error = false;
			$scope.error = "Group name already exists";
			
		}

		//creating the markers
		markers = [];
		for (var binding in bindings){
			currentBind = bindings[binding];
			var latitude = currentBind[$scope.lat].value;
			var longitude = currentBind[$scope.long].value;
			var currentMarker = L.marker([latitude, longitude]);
			if ($scope.desc.length > 0){
				str = $scope.desc;
				ostr = $scope.desc;
				newStr = "";
				i=0;l=0;g=0;
				while (i< ostr.length){
				   l = str.indexOf("<");
				   if (l==-1) {
				     newStr = newStr + str;
				     break;
				   };
				   g = str.indexOf(">");  
				   partStr = str.substring(l+1,g);
				   if (partStr in currentBind){
				   		newStr = newStr + str.substring(0,l) + currentBind[partStr].value;
					   str = str.substring(g+1,str.length);
					   i = g;  
				   } else {
				   		continue;
				   }
				   
				}
				console.log(newStr);
				currentMarker.bindPopup(newStr)

			}
			markers.push(currentMarker);
		}
		$rootScope.layers[$scope.groupname] = L.layerGroup(markers);
		console.log(L.layerGroup(markers));
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
	

	var configs = {};
	

	layerConfig1 = new models.MarkerLayerConfig();
	layerConfig1.name = "Test1";
	layerConfig1.color = "FE7569";
	layerConfig1.latCol = "caplat";
	layerConfig1.longCol = "caplong";
	layerConfig1.markerDescription = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	layerConfig1.description = "Description about Test 1";
	layerConfig1.dataSource = new models.SPARQLDataSource();
	layerConfig1.dataSource.url = "https://dbpedia.org/sparql";
	
	layerConfig1.dataSource.query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
	configs["Test1"] = layerConfig1;


	layerConfig2 = new models.MarkerLayerConfig();
	layerConfig2.name = "Test2";
	layerConfig2.url = "/img/tree/tree-24-32.png";
	layerConfig2.latCol = "caplat";
	layerConfig2.longCol = "caplong";
	layerConfig2.markerDescription = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	layerConfig2.description = "Description about Test 2";
	layerConfig2.dataSource = new models.SPARQLDataSource();
	layerConfig2.dataSource.url = "https://dbpedia.org/sparql";
	
	layerConfig2.dataSource.query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
	configs["Test2"] = layerConfig2;


	for (var config in configs ){
		var newConfig = configs[config];
		var data = SPARQLService.query(newConfig.dataSource.url,encodeURIComponent(newConfig.dataSource.query));
		var bindings;

		newConfig.dataSource.promise = data;
		newConfig.dataSource.promiseResolved = false;
		newConfig.visible = false;


		$rootScope.config[newConfig.name] = newConfig;
	}
	console.log($rootScope.config);
});