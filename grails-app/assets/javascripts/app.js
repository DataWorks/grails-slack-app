(function(angular) {
	angular.module('slackApp', ['ngSanitize', 'ui.bootstrap', 'luegg.directives',
            'slackApp.controllers', 'slackApp.services', 'slackApp.filters']);
	
	angular.module('slackApp.controllers', []);
	angular.module('slackApp.services', []);
	angular.module('slackApp.filters', []);
})(angular);