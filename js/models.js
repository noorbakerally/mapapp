var app = angular.module('myApp');


models = {};
models.LayerConfig = function (name,description,color,url,visible,layerGroup){
	this.name = name;
	this.description = description;
	this.color = color;
	this.url = url;
	this.visible = visible;
	this.layerGroup = layerGroup;
}

models.DataSource = function(url){
	this.url = url;
}
models.DataSource.prototype.showDetails = function (){
	console.log(this.url);
};

models.SPARQLDataSource = function (url,query){
	models.DataSource.call(this);
	this.url = url;
	this.query = query;
}
models.SPARQLDataSource.prototype = Object.create(models.DataSource.prototype);
models.SPARQLDataSource.constructor = models.SPARQLDataSource;

models.SPARQLDataSource.prototype.showDetails = function (){
	console.log(this.url+" "+this.query);
};

app.models = models;

