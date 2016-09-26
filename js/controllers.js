var models = angular.module('myApp').models;



angular.module('myApp').controller('DataConfModalController', function ($scope, $rootScope,$http,$uibModalInstance,SPARQLService) {
	$scope.test = "tst";

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.loadDataConfig = function () {
		if ($scope.url && $scope.url.length >0){
			var configurationRequest = $http.get($scope.url);
			configurationRequest.then(function (dataConf){
				var newConfigs = dataConf.data;
				for (var config in newConfigs){
					var newConfig = newConfigs[config];
					$rootScope.config[newConfig.name] = $rootScope.mapObj.loadDataConfig(newConfig,SPARQLService,$rootScope.map );
				}
			});

		} else {
			var newConfigs = JSON.parse($scope.content);
			for (var config in newConfigs){
				var newConfig = newConfigs[config];
				$rootScope.config[newConfig.name] = $rootScope.mapObj.loadDataConfig(newConfig,SPARQLService,$rootScope.map );
			}
		}
		$uibModalInstance.dismiss('cancel');
	};

});
angular.module('myApp').controller('DropdownCtrl', function ($scope, $log,$uibModal) {
	$scope.test="test";
  
	$scope.addDataConfiguration = function (){
		console.log("test");
		var modalInstance = $uibModal.open({templateUrl: 'myModalContent.html',controller: 'DataConfModalController'});
	};
  
  $scope.status = {
    isopen: false
  };

  

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };

  $scope.appendToEl = angular.element(document.querySelector('#dropdown-long-content'));
});

angular.module('myApp').controller('GroupViewerController', function($scope,$rootScope,NgTableParams,$filter) {
	$scope.configs = $rootScope.config;
	$scope.layers = $rootScope.layers;
	$scope.updateVar = {};
  	$scope.updateVar.selectedObject = "test"
});

angular.module('myApp').controller('oneGroupItemsController', function($scope,$rootScope) {

});

angular.module('myApp').controller('OneGroupViewerController', function($scope,$rootScope,$location,Utilities) {
	

	$scope.change = function (){
       $scope.$parent.selectedObject = "test2";
  }

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
	$scope.$parent.selectedObject = "test2";

	$scope.showDetails = function (groupName){
		console.log($scope.configs[groupName]);
		$scope.$parent.updateVar.selectedObject = $scope.configs[groupName];
	};
	
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

	/*
	var mymap = L.map('mapid').setView([45.1, 5.7], 3);
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		accessToken:'sk.eyJ1IjoiYmFrZW5vb3IiLCJhIjoiY2l0YjNjczhpMDAxMzJ1cDc5aXVxeHZ5NiJ9.8YzFSaP-znz8JUeHYybuTg',
		id: 'bakenoor.1eh9o2c2'
	}).addTo(mymap);
	$rootScope.map = mymap;
	*/

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

angular.module('myApp').controller('initController', function($scope,$rootScope,$http,$routeParams,SPARQLService,Utilities) {
	
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
	console.log($routeParams);
	
	//https://raw.githubusercontent.com/noorbakerally/EGC2017ConfigurationFile/master/conf.js
	//http://localhost:8000/js/conf.js

	// a default appConfURI
	var appConfURI = "https://raw.githubusercontent.com/noorbakerally/EGC2017ConfigurationFile/master/app.conf";
	if ($routeParams.appConfURI){
		appConfURI = $routeParams.appConfURI;
	}

	// for all default dataConfURIs
	var dataConfURIs = ["https://raw.githubusercontent.com/noorbakerally/EGC2017ConfigurationFile/master/data2.conf"];
	if ($routeParams.dataConfURI && $routeParams.dataConfURI.constructor == Array){
		dataConfURIs = dataConfURIs.concat($routeParams.dataConfURI);
	} else if ($routeParams.dataConfURI){
		dataConfURIs.push($routeParams.dataConfURI);
	}
	

	var configurationRequest = $http.get(appConfURI);
	configurationRequest.then(function (appConf){

		//processing the map configs
		var mapConfig = appConf.data.AppConf.mapConf;
		
		var mapBox = new models.MapBoxMap(mapConfig.mapView.latitude,mapConfig.mapView.longitude,mapConfig.mapView.zoomLevel
			,mapConfig.mapView.maxZoom,mapConfig.mapProvider.MapBox.accessToken,mapConfig.mapProvider.MapBox.userId);
		
		mapBox.loadMap();

		$rootScope.mapObj = mapBox;
		$rootScope.map = mapBox.mapObj;
		
		var i = 0;
		while (i<dataConfURIs.length){
			var dataConfReq = $http.get(dataConfURIs[i]);
			dataConfReq.then(function (data){
				//processing the data configs
				var configs = data.data;
				for (var config in configs ){
					var newConfig = configs[config];
					$rootScope.config[newConfig.name] = mapBox.loadDataConfig(newConfig,SPARQLService,$rootScope.map );
				} 
			});
			i++;
		}
			
	});	
});