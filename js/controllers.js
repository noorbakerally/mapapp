angular.module('myApp').controller('mapController', function($scope) {
	var mymap = L.map('mapid').setView([51.505, -0.09], 13);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=sk.eyJ1IjoiYmFrZW5vb3IiLCJhIjoiY2l0YjNjczhpMDAxMzJ1cDc5aXVxeHZ5NiJ9.8YzFSaP-znz8JUeHYybuTg', {

			maxZoom: 18,
			id: 'bakenoor.1eh9o2c2'

		}).addTo(mymap);
});
