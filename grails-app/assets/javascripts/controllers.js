(function(angular) {
	angular.module("slackApp.controllers").controller("SlackCtrl",
		function($scope, $http, $modal, $window, $sce, SlackService) {
			$scope.self = {};
			$scope.currentChannelType = 'channel';
			$scope.currentChannelId = '';
			$scope.currentChannelName = 'general';
			$scope.currentChannelMembers = [];

			$scope.users = {};
			
			$scope.channels = [];
			$scope.ims = [];
			$scope.groups = [];
			$scope.allMessages = {};
			$scope.messageHistoryRetrieved = {};

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
				msgToSend.dayChange = $scope.isDayChange(msgToSend);
				$scope.addMessageToChannel(msgToSend);
			};
			
			$scope.changeChannel = function(newChannelType, newChannelId, newChannelName) {
				var newChannel = $scope.findChannel(newChannelId);
				
				$scope.currentChannelType = newChannelType;
				$scope.currentChannelId = newChannelId;
				$scope.currentChannelName = newChannelName;
				$scope.currentChannelMembers = newChannel.members ? newChannel.members.map(function(user) {
					return $scope.users[user].name;
				}) : [];
				$scope.messages = $scope.getChannelMessages($scope.currentChannelId);
				newChannel.unread_count = 0;
				
				if (!$scope.messageHistoryRetrieved[$scope.currentChannelId]) {
					$scope.clearChannelMessages($scope.currentChannelId);
					SlackService.getChannelHistory($scope.currentChannelType, $scope.currentChannelId);
					$scope.messageHistoryRetrieved[$scope.currentChannelId] = true;
				}
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

			$scope.clearChannelMessages = function(channelId) {
				var messages = $scope.allMessages[channelId];
				messages.splice(0, messages.length);
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
				
				return lastMessage ? (lastMessage.subtype != undefined || (newMessage.user != lastMessage.user) || 
						(newMessage.date - lastMessage.date) > (5 * 60 * 1000)) : true;
			};
			
			$scope.isDayChange = function(newMessage) {
				var lastMessage = $scope.getLastChannelMessage(newMessage.channel);
				
				return lastMessage ? lastMessage.date.toDateString() != newMessage.date.toDateString() : true;
			};
			
			$scope.getImUserName = function(im) {
				return $scope.users[im.user].name;
			}
			
			SlackService.receiveInitialInfo().then(null, null, function(info) {
				$scope.self = info.self;
				$scope.channels = info.channels;
				$scope.ims = info.ims;
				$scope.groups = info.groups;
				
				angular.forEach(info.users, function(user) {
					$scope.users[user.id] = user;
				});
				
				angular.forEach(info.channels, function(channel) {
					if (channel.name == 'general') {
						$scope.changeChannel('channel', channel.id, 'general');
					}
				});
				
			});
			
			SlackService.receiveMessage().then(null, null, function(message) {
				message.userChange = $scope.isUserChange(message);
				message.dayChange = $scope.isDayChange(message);
				
				if (message.subtype == 'channel_join') {
					message.text = 'joined ' + $scope.findChannel(message.channel).name;
				} else {
					message.text = message.text.replace(/<(.*?)>/g, function(wholeMatch, matchText) {
						var linkMatch = /^(#|@)(\w+)(\|(.+))?/.exec(matchText);
						if (linkMatch) {
							var textToDisplay = linkMatch[0];
							
							if (linkMatch[4]) {
								textToDisplay = linkMatch[4];
							} else if (linkMatch[1] == '#') {
								var channel = $scope.findChannel(linkMatch[2]);
								
								if (channel) {
									textToDisplay = channel.name;
								}
							} else if (linkMatch[1] == '@') {
								var user = $scope.users[linkMatch[2]];
								
								if (user) {
									textToDisplay = user.name;
								}
							}
							
							return textToDisplay;
						} else {
							return '<a href="' + matchText + '">' + matchText + '</a>';
						}
					});
			
					message.text = message.text.replace(/(?:\r\n|\r|\n)/g, '<br />');
					message.text = $sce.trustAsHtml(message.text);
				}
				
				$scope.addMessageToChannel(message);
				
				if ($scope.currentChannelId != message.channel) {
					$scope.findChannel(message.channel).unread_count++;
				}
			});
			
			$scope.showCurrentMembers = function() {
				var modalInstance = $modal.open({
					templateUrl: 'templates/currentMembersModal.tpl.html',
					scope: $scope,
					controller: 'ModalInstanceCtrl',
					size: 'sm',
					backdrop: 'static'
				});
			};
			
			$scope.showTokenModal = function() {
				var modalInstance = $modal.open({
					templateUrl: 'templates/tokenModal.tpl.html',
					controller: 'ModalInstanceCtrl',
					size: 'md',
					backdrop: 'static'
				});

				modalInstance.result.then(function(token) {
					$http.post('slackToken/updateCurrentToken', {token: token}).
						success(function() {
							$window.location.reload();
						}).
						error(function() {
							$modal.open({
								template: '<div class="error-window">Sorry, there was an error using this token.  Please refresh and try again.</div>',
								size: 'sm'
							});
						})
				});
			};
			
			$http.get('slackToken/currentTokenStatus').
				success(function(data, status, headers, config) {
				}).
				error(function(data, status, headers, config) {
					$scope.showTokenModal();
				});
		}
	).controller('ModalInstanceCtrl', function ($scope, $modalInstance) {
			$scope.token = '';
			
			$scope.submit = function () {
				$modalInstance.close($scope.token);
			};
	
			$scope.cancel = function () {
				$modalInstance.dismiss();
			};
		}
	);
})(angular);