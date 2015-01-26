(function(angular) {
	angular.module("slackApp.controllers").controller("SlackCtrl",
		function($scope, SlackService) {
			$scope.self = {};
			$scope.currentChannelType = 'channel';
			$scope.currentChannelId = '';
			$scope.currentChannelName = 'general';
			
			$scope.channels = [];
			$scope.ims = [];
			$scope.groups = [];
			$scope.allMessages = {};
			
			var getTestMessage = function(dateOffset) {
				return {
					text: 'test',
					user: 'enter test user here',
					ts: new Date() - dateOffset,
					date: new Date(new Date() - dateOffset),
					userChange: false
				}
			}
			
			var getAllTestMessages = function() {
				var msgs = [];
				for (var i = 2; i >= 0; i--) {
					msgs.push(getTestMessage(i * 10000));
				}
				return msgs;
			}
			
			$scope.allMessages = {G03EU4C5S: getAllTestMessages()};
			
			$scope.users = {};
			var lastUserId;
			var lastMessageReceived = new Date();
			var userChange = true;

			$scope.addMessage = function() {
				var msgToSend = {
					type: 'message',
					channel: $scope.currentChannelId,
					text: $scope.message
				};
				SlackService.send(msgToSend);
				$scope.message = "";
			};
			
			$scope.changeChannel = function(newChannelType, newChannelId, newChannelName) {
				$scope.currentChannelType = newChannelType;
				$scope.currentChannelId = newChannelId;
				$scope.currentChannelName = newChannelName;
				$scope.messages = $scope.allMessages[($scope.currentChannelId)] || [];
				$scope.findChannel(newChannelId).unread_count = 0;
			};
			
			$scope.getChannelClass = function(channelType, channelName) {
				return $scope.currentChannelType == channelType && 
					$scope.currentChannelName == channelName ? 'current-channel' : '';
			};
			
			$scope.findChannel = function(channelId) {
				for (var j = 0; j < 3; j++) {
					var channelGroup = [$scope.channels, $scope.ims, $scope.groups][j];
					for (var i = 0; i < channelGroup.length; i++) {
						if (channelId == channelGroup[i].id) {
							return channelGroup[i];
						}
					}
				}
			}
			
			SlackService.receiveInitialInfo().then(null, null, function(info) {
				$scope.self = info.self;
				$scope.channels = info.channels;
				$scope.ims = info.ims;
				$scope.groups = info.groups;

				angular.forEach(info.users, function(user) {
					$scope.users[user.id] = user;
				});
			});
			SlackService.receiveMessage().then(null, null, function(message) {
				var now = new Date();
				message.userChange = ((message.user != lastUserId) || (now - lastMessageReceived) > (5 * 60 * 1000));
				lastUserId = message.user;
				lastMessageReceived = now;
				if (!$scope.allMessages[message.channel]) {
					$scope.allMessages[message.channel] = [];
				}
				$scope.allMessages[message.channel].push(message);
				
				if ($scope.currentChannelId != message.channel) {
					$scope.findChannel(message.channel).unread_count++;
				}
			});
		});
})(angular);