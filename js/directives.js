angular.module('myApp').directive('helloWorld', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      templateUrl: 'htmls/hello.html',
  };
});