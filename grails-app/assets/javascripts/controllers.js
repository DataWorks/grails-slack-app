(function(angular) {
	angular.module("slackApp.controllers").controller("SlackCtrl",
		function($scope, SlackService) {
			$scope.self = {};
			$scope.currentChannelType = 'channel';
			$scope.currentChannelId = '';
			$scope.currentChannelName = 'general';

			$scope.users = {};
			
			$scope.channels = [];
			$scope.ims = [];
			$scope.groups = [];
			$scope.allMessages = {};

			//$scope.allMessages = {'enter test channel here': getAllTestMessages()};
			
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

			$scope.addMessage = function() {
				var msgToSend = {
					type: 'message',
					channel: $scope.currentChannelId,
					text: $scope.message
				};
				var msgToSendId = SlackService.send(msgToSend);
				$scope.message = "";
				
				msgToSend.user = $scope.self.id;
				msgToSend.ts = msgToSendId;
				msgToSend.date = new Date();
				msgToSend.userChange = $scope.isUserChange(msgToSend);
				$scope.addMessageToChannel(msgToSend);
			};
			
			$scope.changeChannel = function(newChannelType, newChannelId, newChannelName) {
				$scope.currentChannelType = newChannelType;
				$scope.currentChannelId = newChannelId;
				$scope.currentChannelName = newChannelName;
				$scope.messages = $scope.getChannelMessages($scope.currentChannelId);
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
			};
			
			$scope.getChannelMessages = function(channelId) {
				if (!$scope.allMessages[channelId]) {
					$scope.allMessages[channelId] = [];
				}
				return $scope.allMessages[channelId];
			};
			
			$scope.addMessageToChannel = function(message) {
				$scope.getChannelMessages(message.channel).push(message);
			};
			
			$scope.getLastChannelMessage = function(channelId) {
				var msgs = $scope.getChannelMessages(channelId);
				
				return msgs.length > 0 ? msgs[msgs.length - 1] : null;
			};
			
			$scope.isUserChange = function(newMessage) {
				var lastMessage = $scope.getLastChannelMessage(newMessage.channel);
				
				return lastMessage ? ((newMessage.user != lastMessage.user) || 
						((new Date()) - lastMessage.date) > (5 * 60 * 1000)) : true;
			};
			
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
				message.userChange = $scope.isUserChange(message);
				$scope.addMessageToChannel(message);
				
				if ($scope.currentChannelId != message.channel) {
					$scope.findChannel(message.channel).unread_count++;
				}
			});
		});
})(angular);