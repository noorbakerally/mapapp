angular.module('myApp').config(function($routeProvider) {
  $routeProvider
  .when("/", {
    templateUrl : "htmls/main.html"
  })
  .when("/layers", {
    templateUrl : "htmls/addGroups.html"
  })
});
