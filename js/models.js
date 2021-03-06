var app = angular.module('myApp');
var Utilities = angular.injector(["myApp"]).get("Utilities");
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

models.Map.prototype.loadLayer = function (newConfig,SPARQLService) {
	var newLayerConfig;

	if (newConfig.type == "VectorLayerConfig"){
		newLayerConfig = new models.VectorLayer();
		if (newConfig.vectorLayerOptions){
			newLayerConfig.vectorLayerOptions = newConfig.vectorLayerOptions;
		}
	} else if (newConfig.type == "MarkerLayerConfig"){
		newLayerConfig = new models.MarkerLayer();
		if (newConfig.color){
			newLayerConfig.color = newConfig.color;
		} else {
			newLayerConfig.url = newConfig.url;
		}
	} else {
		newLayerConfig = new models.MarkerLayer();
	}

	//add if if error
	newLayerConfig.latCol = newConfig.latCol;
	newLayerConfig.longCol = newConfig.longCol;
	newLayerConfig.itemDescription = newConfig.itemDescription;
	//====
	newLayerConfig.name = newConfig.name;
	newLayerConfig.description = newConfig.description;


	if (newConfig.dataSource.type == "GeoJSONDataSource"){
		newLayerConfig.dataSource = new models.GeoJSONDataSource();
	} else if (newConfig.dataSource.type == "SPARQLDataSource"){
		newLayerConfig.dataSource = new models.SPARQLDataSource();
		newLayerConfig.dataSource.query = newConfig.dataSource.query;
	} else if (newConfig.dataSource.type == "RDFDataSource"){
		newLayerConfig.dataSource = new models.RDFDataSource();
		newConfig.dataSource.url = "http://ci.emse.fr/jena_service/run.php?dataset=" + newConfig.dataSource.url;
		//newConfig.dataSource.url = "http://localhost:8000/test.json";
	}

	//setting data source options
	newLayerConfig.dataSource.url = newConfig.dataSource.url;
	newLayerConfig.dataSource.filterDescription = newConfig.dataSource.filterDescription;

	var data = SPARQLService.query(newConfig.dataSource.url,encodeURIComponent(newConfig.dataSource.query));
	newLayerConfig.dataSource.promise = data;
	newLayerConfig.dataSource.promiseResolved = false;
	newLayerConfig.visible = false;

	
	if (newConfig.initialShow){
		newLayerConfig.dataSource.getDataItems(this,newLayerConfig);
		newLayerConfig.visible = true;
	}

	if (newConfig.useAs){
		if (newConfig.useAs == "AreaRestrictor"){
			if (!this.areaRestrictor){
				this.areaRestrictor = [];
			}
			this.areaRestrictor.push(newLayerConfig);
		}

	}
	if (newConfig.constraints){
		newLayerConfig.constraints = newConfig.constraints;
	}
	
	if (newConfig.options){
		newLayerConfig.options = newConfig.options;
	}
	
	newLayerConfig.map = this;
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

models.Layer = function (name,description,color,url,visible,layerGroup,dataSource){
	this.name = name;
	this.description = description;
	this.color = color;
	this.url = url;
	this.visible = visible;
	this.layerGroup = layerGroup;
	this.dataSource = dataSource;
}
models.Layer.prototype.addDataItem = function (dataItem) {
	if (!this.dataItems){
		this.dataItems = [];
	}
	this.dataItems.push(dataItem);
	dataItem.layerGroup = this;
	dataItem.loadOptions();
};


models.Layer.prototype.getColumnName = function (originalName) {
		
	if (!this.dataSource.filterDescription){
		return Utilities.getURLFragment(originalName);
	}
	var filters = this.dataSource.filterDescription.filters;
	var labels = this.dataSource.filterDescription.labels;
	if (filters && filters.indexOf(originalName) == -1){
		return null;
	} else if (labels[originalName]) {
		return labels[originalName];
	}
	return Utilities.getURLFragment(originalName);
};
models.Layer.prototype.show = function (flag) {
	this.itemsVisible = [];
	this.loading = true;
	if (this.dataSource.promiseResolved) {
		if (this.map.areaRestrictor && this.map.areaRestrictor.length > 0 && this.constraints && this.constraints.indexOf("AreaRestrictor") != -1 ){
			var areaRestrictors = this.map.areaRestrictor;
			//if the layer being show in inside the arearestrictors
			//does not perform constraints validation and show
			if (areaRestrictors.indexOf(this) != -1){
				this.layerGroup.addTo(this.map.mapObj);
				this.loading = false;
				return;
			}

			var markers = [];

			//Layers LOOP
			for(var layerDataItemCounter in this.dataItems){
				var layerDataItem = this.dataItems[layerDataItemCounter];
				var areaRestrictors = this.map.areaRestrictor;
				
				//RESTRICTORS LOOP
				for (var aRCounter in areaRestrictors){
					var show = true ;
					var areaRestrictor = areaRestrictors[aRCounter];
					if (!areaRestrictor.dataItems) continue;
					if (!areaRestrictor.visible) continue;

					//RESTRICTOR ITEMS LOOP
					for (var dataItemCounter in areaRestrictor.dataItems){

						var dataItem = areaRestrictor.dataItems[dataItemCounter];
						if (!dataItem.visible) continue;
						//get marker latitude longitude var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
						if (Utilities.isMarkerInsidePolygon(layerDataItem.getLat(),layerDataItem.getLong(),dataItem.layer)){
							console.log("show");
							if (flag && flag==2){
								if (layerDataItem.visible){
									show = true;
									break;
								}
							} else {
								show = true;
								layerDataItem.visible = true;
								break;
							}
						} else {
							console.log("not show");
							show = false;
							continue;
						}
						
					} //END OF RESTRICTOR ITEMS LOOP
					if (!show){
						break;
					}
				
				} //END OF RESTRICTORS LOOP

				layerDataItem.visible = show;
				if (show){
					markers.push(layerDataItem.layer);
				}
				//decide whether to show or not here
			} //END OF LAYERS LOOP
			this.map.mapObj.removeLayer(this.layerGroup);
			this.layerGroup = L.layerGroup(markers);
			this.layerGroup.addTo(this.map.mapObj);
			this.visible = true;
		}
		else {
			var markers = [];
			angular.forEach(this.dataItems,function(dataItem){
			    if (flag == 1){
			    	dataItem.visible = true;
			   		markers.push(dataItem.layer);
			    } else if (flag == 2){
			    	if (dataItem.visible){
	               		markers.push(dataItem.layer);
	        	    }
			    } 
			    else {
				   	if (dataItem.visible){
	               		markers.push(dataItem.layer);
	        	    }
			    }
            });
            this.hide();
            this.layerGroup = L.layerGroup(markers);
			this.layerGroup.addTo(this.map.mapObj);
			this.itemsVisible = this.dataItems;
			this.visible = true;
            

		}
		this.loading = false;
	} else {
		this.dataSource.getDataItems(this.map,this);
	}
};

models.Layer.prototype.hide = function () {
	this.map.mapObj.removeLayer(this.layerGroup);
	if (this.itemsVisible){
		angular.forEach(this.itemsVisible,function(dataItem){
			dataItem.visible = false;
		});
	}
	this.itemsVisible = [];
	this.visible = false;
	
};

models.Layer.prototype.getGraphics = function () {
	var obj = {};
	if (this.getIconURL){
		this.getIconURL();
	}
	if (this.url){
		obj.img = true;
		obj.url = this.url;
	} else {
		obj.img = false;
		if (this.vectorLayerOptions && this.vectorLayerOptions.fillColor){
			obj.fillColor = this.vectorLayerOptions.fillColor;
		}
		if (this.vectorLayerOptions && this.vectorLayerOptions.color){
			obj.color = this.vectorLayerOptions.color;
		}
	}
	return obj;
};

models.MarkerLayer = function (name,description,color,url,visible,layerGroup,latCol,longCol,desc){
	models.Layer.call(this);
	this.latCol = latCol;
	this.longCol = longCol;
	this.itemDescription = desc;
	this.defaultMarkerURL = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|";
}

models.MarkerLayer.prototype = Object.create(models.Layer.prototype);
models.MarkerLayer.constructor = models.MarkerLayer;

models.MarkerLayer.prototype.getIconURL = function (){
	if (!this.url && !this.color){
		this.color = Utilities.getHexColor();
		this.url = this.defaultMarkerURL+this.color;
	} else if (!this.url){
		this.color = this.color.replace("#","");
		this.url = this.defaultMarkerURL+this.color;
	}
	return this.url;
}
models.MarkerLayer.prototype.getLayerGroup = function (map) {
	var markers = []
	if (this.dataSource.promiseResolved){
		return this.layerGroup;
	} else {
		this.dataSource.getDataItemsWithLatLong(map,this);
	}
	
	return this.layerGroup;
}

models.VectorLayer = function (){
	this.vectorLayerOptions = {};
	this.vectorLayerOptions.fillColor = "#"+Utilities.getHexColor();
	this.vectorLayerOptions.color = "#"+Utilities.getHexColor();

}
models.VectorLayer.prototype = Object.create(models.Layer.prototype);
models.VectorLayer.constructor = models.VectorLayer;


models.DataItem = function(){
}


models.MarkerDataItem = function(latCol,longCol){
	this.latCol = latCol;
	this.longCol = longCol;
}
models.MarkerDataItem.prototype = Object.create(models.DataItem.prototype);
models.MarkerDataItem.constructor = models.MarkerDataItem;

models.MarkerDataItem.prototype.getLat = function(){
	var point = this.layer.getLatLng();
	return point.lat
}
models.MarkerDataItem.prototype.getLong = function(){
	var point = this.layer.getLatLng();
	return point.lng
}


models.DataItem.prototype.show = function (visible){
	if (visible){
		this.map.mapObj.addLayer(this.layer);
		this.visible = true;
	} else {
		this.map.mapObj.removeLayer(this.layer);
		this.visible = false;
	}
}
models.DataItem.prototype.setIconURL = function (iconURL){
        this.layer.setIcon(L.icon({iconUrl:iconURL}));
};
models.DataItem.prototype.loadOptions = function (){
    try {
        eval(this.layerGroup.options.itemOptions.codesBefore);
        if (this.layerGroup.options.itemOptions.conditions){
            for (var condCounter in this.layerGroup.options.itemOptions.conditions){
                var condition = this.layerGroup.options.itemOptions.conditions[condCounter];
                if (eval(condition.condition)){
                    if (condition.action.iconURL){
                            this.setIconURL(condition.action.iconURL);
                    }
                }
            }
        }
    } catch (err) {

    }
    
    
    var dataItemDescription = this.getDescription(this.layerGroup.itemDescription);
    if (dataItemDescription.length > 0){
            this.layer.bindPopup(dataItemDescription);
    }
    

};
models.DataItem.prototype.getDescription = function(desc){
	if (desc == "none"){
            return null;
        } else if (!desc || desc == "default"){
            var objectKeys = Object.keys(this);
            var excludeKeys = ["layer","layerGroup","latCol","longCol","map",this.latCol,this.longCol,"visible"];
            var strDescription = "";

            var labels;
            try {
                    labels = this.layerGroup.dataSource.filterDescription.labels;
            } catch  (err){

            }
            strDescription = "<table border=1>"
            for (var keyCounter in objectKeys){
                    var currentKey = objectKeys[keyCounter];
                    if (excludeKeys.indexOf(currentKey) != -1) continue;
                    if (!this[currentKey]) continue;
                    currentKeyStr = currentKey;
                    if (labels && labels[currentKey]){
                            currentKeyStr = labels[currentKey];
                    }
                    currentKeyStr = Utilities.getURLFragment(currentKeyStr);
                    value = Utilities.getURLFragment(this[currentKey]);
                    strDescription = strDescription + "<tr><td style='font-weight:bold'>" +currentKeyStr+"</td><td>"+value+"<td/><tr/>";
            }
            strDescription = strDescription + "</table>"
            return strDescription;
        } else {
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
        }
        return newStr;
}

models.VectorDataItem = function(){
	
}
models.VectorDataItem.prototype = Object.create(models.DataItem.prototype);
models.VectorDataItem.constructor = models.VectorDataItem;


models.DataSource = function(url,sourceContent,promise,promiseResolved,dataItems){
	this.url = url;
	this.sourceContent = sourceContent;
	this.promise = promise;
	this.promiseResolved = promiseResolved;
	this.dataItems = dataItems;
}

models.DataSource.prototype.showDetails = function (){
	
};


models.GeoJSONDataSource = function (){

}


models.GeoJSONDataSource.prototype = Object.create(models.DataSource.prototype);
models.GeoJSONDataSource.constructor = models.GeoJSONDataSource;




models.GeoJSONDataSource.prototype.getDataItems = function (map,confObj){
	this.promise.then(function (answer){
		var geoJSONObject = answer.data;
		confObj.dataItems = [];
		confObj.cols = {};
		var options = {};
		confObj.dataSource.promiseResolved = true;
		if (confObj.vectorLayerOptions){
			options = confObj.vectorLayerOptions;
		}

		
		options.onEachFeature = function (feature, layer) {
			var dataItem;
			if (confObj instanceof models.MarkerLayer){
				dataItem = new models.MarkerDataItem();
			} else {
				dataItem = new models.VectorDataItem();
			}
			
			var properties = feature.properties;
			var keys = Object.keys(properties);
			for (var k in keys){
				var key = keys[k];
				dataItem[key] = properties[key];
				//skipping the item if that item is not in filters
				if (confObj.dataSource.filterDescription && confObj.dataSource.filterDescription.filters && confObj.dataSource.filterDescription.filters.indexOf(key) == -1) {
					continue;
				}

				if (!confObj.cols[key]){
					confObj.cols[key] = []
				}
				if (confObj.cols[key].indexOf(properties[key]) == -1){
					confObj.cols[key].push(properties[key]);
				}
			}
			dataItem.map = map;
			if (layer.setIcon && confObj.getIconURL) {
				layer.setIcon(L.icon({iconUrl:confObj.getIconURL()}));
			}
			dataItem.layer = layer;
			dataItem.visible = true;
			confObj.addDataItem(dataItem);

		}

		confObj.layerGroup = L.geoJson(geoJSONObject,options);
		confObj.dataSource.promiseResolved = true;
		confObj.show(1);
	},function (error){});
}


models.RDFDataSource = function (url){
	models.DataSource.call(this);
	this.url = url;
}

models.RDFDataSource.prototype = Object.create(models.DataSource.prototype);
models.RDFDataSource.constructor = models.RDFDataSource;
models.RDFDataSource.prototype.getDataItems = function(map,confObj){
	confObj.dataItems = [];
	confObj.cols = {};
	this.promiseResolved = true;
	var markers = [];
	this.promise.then(function (answer){

		var bindings = answer.data.results.bindings;
		var latitudesPredicates = ["http://www.w3.org/2003/01/geo/wgs84_pos#lat"];
		var longitudePredicates = ["http://www.w3.org/2003/01/geo/wgs84_pos#long"];

		dataItems = {};

		for (var binding in bindings){
			var currentBinding = bindings[binding];
			var subject = currentBinding.subject.value;
			var predicate = currentBinding.predicate.value;
			var value = currentBinding.value.value;

			var dataItem = dataItems[subject];
			if (!dataItem){
				dataItem = new models.MarkerDataItem();
			}

			if (latitudesPredicates.indexOf(predicate) != -1){
				dataItem.latCol = predicate;
			} else if (longitudePredicates.indexOf(predicate) != -1){
				dataItem.longCol = predicate;
			}
			//adding the predicate value as an array
			if (dataItem[predicate]){
				dataItem[predicate].push(value);
			} else {
				dataItem[predicate] = [value];
			}

			if (!confObj.cols[predicate]){
				confObj.cols[predicate] = [];			
			}
			if (confObj.cols[predicate].indexOf(value) == -1){
				confObj.cols[predicate].push(value);
			}

			dataItems[subject] = dataItem;
		}

		//to verify !! why this second loop
		for (var dataItemCounter in dataItems){
			var dataItem = dataItems[dataItemCounter];
			var currentMarker = L.marker([dataItem[dataItem.latCol][0], dataItem[dataItem.longCol][0]]);
			currentMarker.setIcon(L.icon({iconUrl:confObj.getIconURL()}));
			dataItem.layer = currentMarker;
			dataItem.map = map;
			markers.push(currentMarker);
			confObj.addDataItem(dataItem);
		}

		confObj.layerGroup = L.layerGroup(markers);
		confObj.dataSource.promiseResolved = true;
		confObj.show(1);


	});
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
		//console.log(answer);
		confObj.cols = {};
		this.sparqlResult = answer.data;
		var bindings = answer.data.results.bindings;
		this.promiseResolved = true;
		markers = [];
		for (var binding in bindings){
			currentBind = bindings[binding];
			var dataItem = new models.MarkerDataItem(confObj.latCol,confObj.longCol);
			
			for (var col in answer.data.head.vars){
				if (answer.data.head.vars[col] != confObj.latCol && answer.data.head.vars[col] != confObj.longCol ){
					if (!currentBind[answer.data.head.vars[col]]) {continue;}
					dataItem[answer.data.head.vars[col]] = currentBind[answer.data.head.vars[col]].value;

					//to change here losing one value
					if (confObj.cols[answer.data.head.vars[col]]){
						if (confObj.cols[answer.data.head.vars[col]].indexOf(currentBind[answer.data.head.vars[col]].value) == -1){
							confObj.cols[answer.data.head.vars[col]].push(currentBind[answer.data.head.vars[col]].value);
						}
					} else {
						confObj.cols[answer.data.head.vars[col]] = [];
					}

					if (!confObj.cols[answer.data.head.vars[col]]){
                        confObj.cols[answer.data.head.vars[col]] = [];
                    }
                    if (confObj.cols[answer.data.head.vars[col]].indexOf(currentBind[answer.data.head.vars[col]].value) == -1){
                    	confObj.cols[answer.data.head.vars[col]].push(currentBind[answer.data.head.vars[col]].value);
                    }

				}
			}
			dataItem[confObj.latCol] = currentBind[confObj.latCol].value;
			dataItem[confObj.longCol] = currentBind[confObj.longCol].value;
			var currentMarker = L.marker([dataItem[dataItem.latCol], dataItem[dataItem.longCol]]);     
            currentMarker.setIcon(L.icon({iconUrl:confObj.getIconURL()}));
            dataItem.layer = currentMarker;
			dataItem.map = map;
			markers.push(currentMarker);
			confObj.addDataItem(dataItem); 
		}
		confObj.layerGroup = L.layerGroup(markers);
		confObj.dataSource.promiseResolved = true;
		confObj.show(1);
	},
	function (error){
	
	});
	
	return confObj.dataItems;
} 


app.models = models;

