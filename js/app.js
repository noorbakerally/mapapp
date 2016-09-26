var app = angular.module('myApp', ['ngRoute','ui.bootstrap','ngTable']);
app.run(function($rootScope) {
    $rootScope.config = {};
    $rootScope.layers = {};

    //using marker from the Google Chart API
    $rootScope.markerURL = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|";
});

