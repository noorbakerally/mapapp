var app = angular.module('myApp');


models = {};
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
models.MarkerLayerConfig.prototype.getLayerGroup = function () {
	var markers = []
	if (this.dataSource.promiseResolved){
		return this.layerGroup;
	} else {
		this.dataSource.getDataItemsWithLatLong();
		for (var dataItemNum in this.dataSource.dataItems){
			var dataItem = this.dataSource.dataItems[dataItemNum];
			var currentMarker = L.marker([dataItem[dataItem.latCol], dataItem[dataItem.longCol]]);
			markers.push(currentMarker);
		}
		this.layerGroup = L.layerGroup(markers);
	}
	
	return this.layerGroup;
}
models.DataItem = function(latCol,longCol){
	this.latCol = latCol;
	this.longCol = longCol;
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

models.SPARQLDataSource = function (url,query,sparqlResult){
	models.DataSource.call(this);
	this.url = url;
	this.query = query;
	this.sparqlResult = sparqlResult;

}
models.SPARQLDataSource.prototype = Object.create(models.DataSource.prototype);
models.SPARQLDataSource.constructor = models.SPARQLDataSource;


models.SPARQLDataSource.prototype.getDataItemsWithLatLong = function(latCol,longCol){
	this.dataItems = [];
	var newDataItem = new models.DataItem();
	newDataItem.latCol = "lat";
	newDataItem.longCol = "long";
	newDataItem.lat = 45;
	newDataItem.long = 5;
	this.dataItems.push(newDataItem);
	/*
	this.promise.then(function (answer){
		this.sparqlResult = answer.data;
		var bindings = answer.data.results.bindings;
		this.promiseResolved = true;
		
		for (var binding in bindings){
			currentBind = bindings[binding];
			var dataItem = new models.DataItem(currentBind[latCol].value,currentBind[longCol].value);
			for (var col in answer.data.vars){
				if (answer.data.vars[col] != latCol && answer.data.vars[col] != longCol ){
					this.dataItems[answer.data.vars[col]] = currentBind[answer.data.vars[col]].value
				}
			}
			this.dataItems.push(dataItem);
		}
	},
	function (error){
	
	});
	*/
	return this.dataItems;
} 


app.models = models;

