var models = angular.module('myApp').models;

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

	$scope.icon = function (obj){
		var url;
		if (obj.iconURL){
			url = obj.iconURL;
		} else {
			url = $rootScope.markerURL+obj.markerColor;
		}
		return url;
	};

	$scope.show = function(groupName){
	
		/*
		if ($scope.groupShow){
			$scope.layers[groupName].addTo($rootScope.map);	
		} else {
			$rootScope.map.removeLayer($scope.layers[groupName]);
		}*/
		/*
			check if promise has been resolved
			if not resolve promise, add layer to layers in rootscope

			if resolved, then based on whether should show or hide, show or hide layer

			have a global array in rootscope which holds which layers are avaliable and which are not
			use it in checkbox expression to show or hide 

		*/

		var configObj = $rootScope.config[groupName];
		$rootScope.layers = {};

		if (configObj.layerShow){
			if (configObj["promiseResolved"]) {
				$rootScope.config[groupName]["layerGroup"].addTo($rootScope.map);
			} else {
				var bindings;
				var data = configObj["promise"];
				data.then(function (answer){
					sparql_result = answer.data;
					bindings = answer.data.results.bindings;
					configObj["promiseResolved"] = true;
					//creating the markers
					markers = [];
					for (var binding in bindings){
						currentBind = bindings[binding];
						var latitude = currentBind[configObj["lat"]].value;
						var longitude = currentBind[configObj["long"]].value;
						var currentMarker = L.marker([latitude, longitude]);
						currentMarker.bindPopup(Utilities.generateDescription(configObj["desc"],currentBind));
						var icon;
						if (configObj.iconURL){
							icon = L.icon({iconUrl:configObj.iconURL});
						} else {
							icon = L.icon({iconUrl:$rootScope.markerURL+configObj.markerColor});
						}
						currentMarker.setIcon(icon);
						markers.push(currentMarker);
					}
					$rootScope.config[groupName]["layerGroup"] = L.layerGroup(markers);
					$rootScope.config[groupName]["layerGroup"].addTo($rootScope.map);
					$rootScope.config[groupName]["layerShow"] = true;
				},
					function (error){
				}); 
			}
		} else {
			console.log($rootScope.config[groupName].layerGroup);
			$rootScope.map.removeLayer($rootScope.config[groupName]["layerGroup"]);
			$rootScope.config[groupName]["layerShow"] = false;
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

	configs["Test1"] = {};
	configs["Test1"]["groupName"] = "Test1";
	configs["Test1"]["lat"] = "caplat";
	configs["Test1"]["long"] = "caplong";
	configs["Test1"]["desc"] = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	configs["Test1"]["layerDesc"] = "Description about Test 1";
	configs["Test1"]["endpointURL"] = "https://dbpedia.org/sparql";
	configs["Test1"]["markerColor"] = "FE7569";
	configs["Test1"]["SPARQLQuery"] = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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


	configs["Test2"] = {};
	configs["Test2"]["groupName"] = "Test2";
	configs["Test2"]["lat"] = "caplat";
	configs["Test2"]["long"] = "caplong";
	configs["Test2"]["desc"] = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	configs["Test2"]["layerDesc"] = "Description about Test 2";
	configs["Test2"]["endpointURL"] = "https://dbpedia.org/sparql";
	configs["Test2"]["iconURL"] ="/img/tree/tree-24-32.png";
	configs["Test2"]["SPARQLQuery"] = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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


	for (var config in configs ){
		var newConfig = configs[config];
		var data = SPARQLService.query(newConfig["endpointURL"],encodeURIComponent(newConfig["SPARQLQuery"]));
		var bindings;

		newConfig["promise"] = data;
		newConfig["promiseResolved"] = false;
		newConfig["layerShow"] = false;
		$rootScope.config[newConfig["groupName"]] = newConfig;

	}
});