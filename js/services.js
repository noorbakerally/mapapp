angular.module('myApp').service('SPARQLService', function($http) {		
	this.query = function (url,query){
		return $http.get(url+"?format=html&query="+query);

	};
});