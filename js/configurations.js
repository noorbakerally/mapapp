var app = angular.module('myApp');

var configs = {};
		
	layerConfig1 = new models.MarkerLayerConfig();
	layerConfig1.name = "Test1";
	layerConfig1.color = "FE7569";
	layerConfig1.latCol = "caplat";
	layerConfig1.longCol = "caplong";
	layerConfig1.markerDescription = "The latitude and longitude for <country> is <caplat> and <caplong> respectively";
	layerConfig1.description = "Description about Test 1";
	layerConfig1.dataSource = new models.SPARQLDataSource();
	layerConfig1.dataSource.url = "https://dbpedia.org/sparql";
	
	layerConfig1.dataSource.query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
	configs["Test1"] = layerConfig1;
	

	layerConfig2 = new models.MarkerLayerConfig();
	layerConfig2.name = "EGC First 25 Trees";
	layerConfig2.url = "/img/tree/tree-24-32.png";
	layerConfig2.latCol = "lat";
	layerConfig2.longCol = "long";
	layerConfig2.markerDescription = "The latitude and longitude for tree with <code> is <lat> and <long> respectively";
	layerConfig2.description = "Description about Test 2";
	layerConfig2.dataSource = new models.SPARQLDataSource();
	layerConfig2.dataSource.url = "http://data.mondeca.com/egc2017/sparql";
	
	layerConfig2.dataSource.query = `
PREFIX wgs84_pos:<http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?lat ?long ?code
WHERE {
  ?subject rdf:type <http://linkedgeodata.org/ontology/Tree>;
		 wgs84_pos:lat ?lat;
		 wgs84_pos:long ?long;
		 <http://data.lof.com/def/tonto#code> ?code
           
}
LIMIT 25
		`;
	configs["Test2"] = layerConfig2;
	
	
	layerConfig3 = new models.LayerConfig();
	layerConfig3.name = "Test3";
	layerConfig3.dataSource = new models.GeoJSONDataSource();
	layerConfig3.dataSource.url = "https://raw.githubusercontent.com/mledoze/countries/master/data/fra.geo.json";
	layerConfig3.description = "Description about Test 3";
	configs["Test3"] = layerConfig3;














app.rawConfig = configs;