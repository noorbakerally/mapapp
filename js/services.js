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
});