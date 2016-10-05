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
					$rootScope.config[newConfig.name] = $rootScope.map.loadLayer(newConfig,SPARQLService);
				}
			});

		} else {
			var newConfigs = JSON.parse($scope.content);
			for (var config in newConfigs){
				var newConfig = newConfigs[config];
				$rootScope.config[newConfig.name] = $rootScope.map.loadLayer(newConfig,SPARQLService);
			}
		}
		$uibModalInstance.dismiss('cancel');
	};

});
angular.module('myApp').controller('DropdownCtrl', function ($scope, $log,$uibModal) {
	$scope.test="test";
  
	$scope.addDataConfiguration = function (){
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
  	$scope.updateVar.selectedObject = null;
});

angular.module('myApp').controller('oneGroupItemsController', function($scope,$rootScope) {
	$scope.applyFilter = function (){
		//columnVal holding the selected values in the selected dropdown lists
		var keys = Object.keys($scope.$parent.updateVar.columnVal);
		for (var dataItemCounter in $scope.$parent.updateVar.selectedObject.dataItems){
			var currentDateItem = $scope.$parent.updateVar.selectedObject.dataItems[dataItemCounter];
			var showItem = true;
			for (var key in keys) {
				var currentColumn = $scope.$parent.updateVar.columnVal[keys[key]];
				//test for all columns
				//if value==none continue testing
				//
				if (currentColumn != "none"){
					if ((currentDateItem[keys[key]] instanceof Array && currentDateItem[keys[key]].indexOf(currentColumn) == -1) || (!(currentDateItem[keys[key]] instanceof Array) && currentDateItem[keys[key]] != currentColumn)){
						showItem = false;
						break;
					} else {
						showItem = true;	
					}

					
					
				} else {
					showItem = true;
				}
			} 
			currentDateItem.show(showItem);
		}
	}

	$scope.clearFilter = function (){
		
		for (var dataItemCounter in $scope.$parent.updateVar.selectedObject.dataItems){
			var currentDateItem = $scope.$parent.updateVar.selectedObject.dataItems[dataItemCounter];
			currentDateItem.show(true);
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
	$scope.$parent.selectedObject = "test2";

	$scope.showDetails = function (groupName){

		if ($scope.$parent.updateVar.selectedObject && $scope.$parent.updateVar.selectedObject.name == groupName){
			$scope.$parent.updateVar.selectedObject = null;
			return;
		}
		$scope.$parent.updateVar.selectedObject = $scope.configs[groupName];
		$scope.$parent.updateVar.columnVal = {};

		if ($scope.$parent.updateVar.selectedObject.cols){
			$scope.$parent.updateVar.cols = Object.keys($scope.$parent.updateVar.selectedObject.cols);
		} else {
			$scope.$parent.updateVar.cols = null;
		}
	};
	
	$scope.show = function(groupName){
		//newConfig.dataSource.getDataItemsWithLatLong(newConfig.latCol,newConfig.longCol);
		var layer = $rootScope.config[groupName];
		if (layer.visible){
			layer.show();
		} else {
			layer.hide();
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

		newConfig = new models.MarkerLayer();
		newConfig.name = $scope.groupname;
		newConfig.latCol = $scope.lat;
		newConfig.longCol = $scope.long;
		newConfig.color = $scope.color;
		newConfig.descriptionMarkUp = $scope.desc;
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
	
	//https://raw.githubusercontent.com/noorbakerally/EGC2017ConfigurationFile/master/conf.js
	//http://localhost:8000/js/conf.js

	// a default appConfURI
	var appConfURI = "https://raw.githubusercontent.com/noorbakerally/EGC2017ConfigurationFile/master/app.conf";
	if ($routeParams.appConfURI){
		appConfURI = $routeParams.appConfURI;
	}

	// for all default dataConfURIs
	var dataConfURIs = ["http://localhost:8000/data2.conf"];
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

		$rootScope.map = mapBox;
		
		var i = 0;
		while (i<dataConfURIs.length){
			var dataConfReq = $http.get(dataConfURIs[i]);
			dataConfReq.then(function (data){
				//processing the data configs
				var configs = data.data;
				for (var config in configs ){
					var newConfig = configs[config];
					$rootScope.config[newConfig.name] = mapBox.loadLayer(newConfig,SPARQLService);
				} 
			});
			i++;
		}
			
	});	
});
