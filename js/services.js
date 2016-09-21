angular.module('myApp').service('SPARQLService', function($http) {		
	this.query = function (url,query){
		return $http.get(url+"?format=application%2Fsparql-results%2Bjson&query="+query);
	};
});


angular.module('myApp').service('Utilities', function($http) {		
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
});