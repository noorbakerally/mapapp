angular.module('myApp').directive('groupViewer', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      templateUrl: 'htmls/groupviewer.html',
  };
});

angular.module('myApp').directive('sparqlViewer', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      templateUrl: 'htmls/sparql.html',
  };
});