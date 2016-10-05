angular.module('myApp').service('SPARQLService', function($http) {		
	this.query = function (url,query){
		if (url.indexOf(".json") != -1){
			promise = $http.get("http://ci.emse.fr/jena_service/getjson.php?url="+url);
			return promise;
		}

		return $http.get(url+"?format=application%2Fsparql-results%2Bjson&query="+query);
	};
});


angular.module('myApp').service('Utilities', function($http,$rootScope) {		
	this.generateDescription = function (description,binding){
		if (description.length > 0){
			str = description;
			ostr = description;
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
			   //console.log(binding);
			   if (partStr in binding){
			   		newStr = newStr + str.substring(0,l) + binding[partStr].value;
				   str = str.substring(g+1,str.length);
				   i = g;  
			   } else {
			   		continue;
			   }
			   
			}
		}
		return newStr;
	};

	this.isMarkerInsidePolygon = function (x,y, poly) {
	    var polyPoints = poly.getLatLngs()[0];       
	    var inside = false;
	    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
	        var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
	        var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

	        var intersect = ((yi > y) != (yj > y))
	            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
	        if (intersect) inside = !inside;
	    }
	    return inside;
	};
	this.isPolygonInsidePolygon = function (innerPoly, poly) {
	    var polyPoints = innerPoly.getLatLngs()[0];       
	    for (var i = 0; i < polyPoints.length; i++){
	    	var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
	    	if (!this.isMarkerInsidePolygon(xi,yi,poly)){
	    		return false;
	    	}
	    }
	    
	    return true;



	};


	this.getURLFragment = function (newName){
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
		  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
		  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
		  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
		  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
		  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		if(pattern.test(newName)) {
			if (newName.indexOf("#") != -1){
				newName = newName.substring(newName.indexOf("#")+1, newName.length);
			} else if (newName.indexOf("/") != -1){
				newName = newName.substring(newName.indexOf("/")+1, newName.length);
			}
		}
		return newName;
	};

	this.getHexColor = function (){
		
		if (!$rootScope.hexColor){
			$rootScope.hexColor = [];
		}
		var hexColor = Math.random().toString(16).slice(2, 8).toUpperCase();
		while ($rootScope.hexColor.indexOf(hexColor) != -1){
			hexColor = Math.random().toString(16).slice(2, 8).toUpperCase();
		}
		$rootScope.hexColor.push(hexColor);
		return hexColor;
	}
});