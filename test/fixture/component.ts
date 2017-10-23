import './footer.html'
import './footer.scss'
import * as angular from 'angular'

export interface FooterScope extends angular.IScope {
    isLoggedIn(): boolean;
}

angular.module('distribute.components.footer', [])
.directive('footer', () => ({
  templateUrl: 'footer.html',
  controller: 'footerController'
}))
.controller('footerController', function footerController(
  $scope: FooterScope,
  sessionService: any
) {
  $scope.isLoggedIn = <typeof sessionService.isLoggedIn> angular.bind(sessionService, sessionService.isLoggedIn)
})
