angular.module('myApp').config(function($routeProvider) {
  $routeProvider
  .when("/:appConfURI?/:dataConfURI?", {
    templateUrl : "htmls/main.html"
  })
  .when("/layers", {
    templateUrl : "htmls/addGroups.html"
  })
});
