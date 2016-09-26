var app = angular.module('myApp');

models = {};

models.Map = function (latitude,longitude,zoomLevel,mapObj){
	this.latitude = latitude;
	this.longitude = longitude;
	this.zoomLevel = zoomLevel;	
	this.mapObj = mapObj;
}

models.MapBoxMap = function (latitude,longitude,zoomLevel,maxZoom,accessToken,userId){
	models.Map.call(this);
	this.latitude = latitude;
	this.longitude = longitude;
	this.zoomLevel = zoomLevel;	
	this.maxZoom = maxZoom;
	this.tileURL = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}";
	this.accessToken = accessToken;
	this.userId = userId;
}

models.MapBoxMap.prototype = Object.create(models.Map.prototype);
models.MapBoxMap.constructor = models.MapBoxMap;

models.MapBoxMap.prototype.loadMap = function (){
	var mymap = L.map('mapid').setView([this.latitude, this.longitude], this.zoomLevel);
	L.tileLayer(this.tileURL, {
		maxZoom: this.maxZoom,
		accessToken:this.accessToken,
		id: this.userId
	}).addTo(mymap);
	this.mapObj = mymap;
}

models.Map.prototype.loadDataConfig = function (newConfig,SPARQLService,mapObj) {
	var newLayerConfig;
	if (newConfig.type == "LayerConfig"){
		newLayerConfig = new models.LayerConfig();
	} else if (newConfig.type == "MarkerLayerConfig"){
		newLayerConfig = new models.MarkerLayerConfig();
		if (newConfig.color){
			newLayerConfig.color = newConfig.color;
		} else {
			newLayerConfig.url = newConfig.url;
		}
		newLayerConfig.latCol = newConfig.latCol;
		newLayerConfig.longCol = newConfig.longCol;
		newLayerConfig.markerDescription = newConfig.markerDescription;
	}
	
	newLayerConfig.name = newConfig.name;
	newLayerConfig.description = newConfig.description;

	if (newConfig.dataSource.type == "GeoJSONDataSource"){
		newLayerConfig.dataSource = new models.GeoJSONDataSource();
	} else if (newConfig.dataSource.type == "SPARQLDataSource"){
		newLayerConfig.dataSource = new models.SPARQLDataSource();
		newLayerConfig.dataSource.query = newConfig.dataSource.query;
	}
	newLayerConfig.dataSource.url = newConfig.dataSource.url;

	var data = SPARQLService.query(newConfig.dataSource.url,encodeURIComponent(newConfig.dataSource.query));
	newLayerConfig.dataSource.promise = data;
	newLayerConfig.dataSource.promiseResolved = false;
	newLayerConfig.visible = false;

	
	if (newConfig.initialShow){
		newLayerConfig.dataSource.getDataItems(mapObj,newLayerConfig);
		newLayerConfig.visible = true;
	}
	return newLayerConfig;
}


models.GoogleMap = function (mode){
	this.mode = mode;
}

models.GoogleMap.prototype = Object.create(models.Map.prototype);
models.GoogleMap.constructor = models.GoogleMap;

models.GoogleMap.prototype.loadMap = function (){
	var mymap = new L.Map('mapid', {center: new L.LatLng(51.51, -0.11), zoom: 9});
    var googleLayer = new L.Google('ROADMAP');
    mymap.addLayer(googleLayer);
    this.mapObj = mymap;
}

models.LayerConfig = function (name,description,color,url,visible,layerGroup,dataSource){
	this.name = name;
	this.description = description;
	this.color = color;
	this.url = url;
	this.visible = visible;
	this.layerGroup = layerGroup;
	this.dataSource = dataSource;
}

models.MarkerLayerConfig = function (name,description,color,url,visible,layerGroup,latCol,longCol,desc){
	models.LayerConfig.call(this);
	this.latCol = latCol;
	this.longCol = longCol;
	this.markerDescription = desc;
	this.defaultMarkerURL = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|";
}

models.MarkerLayerConfig.prototype = Object.create(models.LayerConfig.prototype);
models.MarkerLayerConfig.constructor = models.MarkerLayerConfig;

models.MarkerLayerConfig.prototype.getIconURL = function (){
	if (this.url){
		return this.url;
	} else {
		return (this.defaultMarkerURL+this.color);
	}
}
models.MarkerLayerConfig.prototype.getLayerGroup = function (map) {
	var markers = []
	if (this.dataSource.promiseResolved){
		return this.layerGroup;
	} else {
		this.dataSource.getDataItemsWithLatLong(map,this);
	}
	
	return this.layerGroup;
}
models.DataItem = function(latCol,longCol){
	this.latCol = latCol;
	this.longCol = longCol;
}
models.DataItem.prototype.getDescription = function(desc){
	if (desc.length > 0){
		str = desc;
		ostr = desc;
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
		   if (partStr in this){
		   		newStr = newStr + str.substring(0,l) + this[partStr];
			   str = str.substring(g+1,str.length);
			   i = g;  
		   } else {
		   		continue;
		   }
		}
	}
	return newStr;
}

models.DataSource = function(url,sourceContent,promise,promiseResolved,dataItems){
	this.url = url;
	this.sourceContent = sourceContent;
	this.promise = promise;
	this.promiseResolved = promiseResolved;
	this.dataItems = dataItems;
}

models.DataSource.prototype.showDetails = function (){
	console.log(this.url);
};


models.GeoJSONDataSource = function (){

}


models.GeoJSONDataSource.prototype = Object.create(models.DataSource.prototype);
models.GeoJSONDataSource.constructor = models.GeoJSONDataSource;




models.GeoJSONDataSource.prototype.getDataItems = function (map,confObj){
	this.promise.then(function (answer){
		var geoJSONObject = answer.data;
		confObj.layerGroup = L.geoJson(geoJSONObject);
		confObj.layerGroup.addTo(map);
	},function (error){});
}


models.SPARQLDataSource = function (url,query,sparqlResult){
	models.DataSource.call(this);
	this.url = url;
	this.query = query;
	this.sparqlResult = sparqlResult;

}

models.SPARQLDataSource.prototype = Object.create(models.DataSource.prototype);
models.SPARQLDataSource.constructor = models.SPARQLDataSource;

models.SPARQLDataSource.prototype.getDataItems = function(map,confObj){
	confObj.dataSource.getDataItemsWithLatLong(map,confObj);
}

models.SPARQLDataSource.prototype.getDataItemsWithLatLong = function(map,confObj){

	this.promise.then(function (answer){
		confObj.dataItems = [];
		confObj.cols = {};
		this.sparqlResult = answer.data;
		console.log(answer);
		var bindings = answer.data.results.bindings;
		this.promiseResolved = true;
		markers = [];
		for (var binding in bindings){
			currentBind = bindings[binding];
			//var dataItem = new models.DataItem(currentBind[confObj.latCol].value,currentBind[confObj.longCol].value);
			var dataItem = new models.DataItem(confObj.latCol,confObj.longCol);
			
			for (var col in answer.data.head.vars){
				if (answer.data.head.vars[col] != confObj.latCol && answer.data.head.vars[col] != confObj.longCol ){
					dataItem[answer.data.head.vars[col]] = currentBind[answer.data.head.vars[col]].value;
					
				}
			}
			dataItem[confObj.latCol] = currentBind[confObj.latCol].value;
			dataItem[confObj.longCol] = currentBind[confObj.longCol].value;
			var currentMarker = L.marker([dataItem[dataItem.latCol], dataItem[dataItem.longCol]]);
			

			var dataItemDescription = dataItem.getDescription(confObj.markerDescription);
			if (dataItemDescription.length > 0){
				currentMarker.bindPopup(dataItemDescription);
			}

			currentMarker.setIcon(L.icon({iconUrl:confObj.getIconURL()}));
			dataItem.marker = currentMarker;
			markers.push(currentMarker);
			confObj.dataItems.push(dataItem); 
		}
		console.log(confObj.dataItems);
		confObj.layerGroup = L.layerGroup(markers);
		confObj.layerGroup.addTo(map);
	},
	function (error){
	
	});
	
	return confObj.dataItems;
} 


app.models = models;

