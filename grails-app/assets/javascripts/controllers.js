(function(angular) {
	angular.module("slackApp.controllers").controller("SlackCtrl",
		function($scope, SlackService) {
			$scope.channels = [];
			$scope.messages = [];

			$scope.addMessage = function() {
				var msgToSend = {
					type: 'message',
					channel: 'enter channel here',
					text: $scope.message
				};
				SlackService.send(msgToSend);
				$scope.message = "";
			};

			SlackService.receiveInitialInfo().then(null, null, function(info) {
				$scope.channels = info.channels;
			});
			SlackService.receiveMessage().then(null, null, function(message) {
				$scope.messages.push(message);
			});
		});
})(angular);