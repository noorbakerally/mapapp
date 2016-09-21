angular.module('myApp').directive('groupViewer', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      templateUrl: 'htmls/groupviewer.html',
  };
});