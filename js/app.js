var app = angular.module('myApp', ['ngRoute','ui.bootstrap']);
app.run(function($rootScope) {
    $rootScope.config = {};
    $rootScope.layers = {};
});

