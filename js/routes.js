angular.module('myApp').config(function($routeProvider) {
  $routeProvider
  .when("/:configURI?", {
    templateUrl : "htmls/main.html"
  })
  .when("/layers", {
    templateUrl : "htmls/addGroups.html"
  })
});
