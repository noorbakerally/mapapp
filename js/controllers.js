angular.module('myApp').controller('initController', function($scope,$rootScope,SPARQLService,Utilities) {
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
	var newConfig = {};
	newConfig["groupName"] = "Test1";
	newConfig["lat"] = "caplat";
	newConfig["long"] = "caplong";
	newConfig["desc"] = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	newConfig["endpointURL"] = "https://dbpedia.org/sparql";
	newConfig["SPARQLQuery"] = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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


	var data = SPARQLService.query(newConfig["endpointURL"],encodeURIComponent(newConfig["SPARQLQuery"]));
	var bindings;
	data.then(function (answer){
		sparql_result = answer.data;
		bindings = answer.data.results.bindings;

		//creating the markers
		markers = [];
		for (var binding in bindings){
			currentBind = bindings[binding];
			var latitude = currentBind[newConfig["lat"]].value;
			var longitude = currentBind[newConfig["long"]].value;
			var currentMarker = L.marker([latitude, longitude]);
			currentMarker.bindPopup(Utilities.generateDescription(newConfig["desc"],currentBind));

			markers.push(currentMarker);
		}
		$rootScope.config[newConfig["groupName"]] = newConfig;
		$rootScope.layers[newConfig["groupName"]] = L.layerGroup(markers);


	},
	function (error){

	}); 






});

angular.module('myApp').controller('GroupViewerController', function($scope,$rootScope) {
	$scope.configs = $rootScope.config;
	$scope.layers = $rootScope.layers;

	$scope.show = function(groupName){
		console.log($scope.groupShow);
		if ($scope.groupShow){
			$scope.layers[groupName].addTo($rootScope.map);	
		} else {
			$rootScope.map.removeLayer($scope.layers[groupName]);
		}
		
	}
});
angular.module('myApp').controller('OneGroupViewerController', function($scope,$rootScope) {
	$scope.configs = $rootScope.config;
	$scope.layers = $rootScope.layers;
});

angular.module('myApp').controller('mapController', function($scope,$rootScope) {
	var mymap = L.map('mapid').setView([45.1, 5.7], 8);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=sk.eyJ1IjoiYmFrZW5vb3IiLCJhIjoiY2l0YjNjczhpMDAxMzJ1cDc5aXVxeHZ5NiJ9.8YzFSaP-znz8JUeHYybuTg', {
			maxZoom: 18,
			id: 'bakenoor.1eh9o2c2'
		}).addTo(mymap);
	$rootScope.map = mymap;
	var trees = $scope.models.trees;
	var trees_layer = L.layerGroup();
	for (var tree in trees){
		var new_layer = L.marker([trees[tree].y, trees[tree].x]).bindPopup(trees[tree].code);
		trees_layer.addLayer(new_layer)
	}
	trees_layer.addTo(mymap);
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