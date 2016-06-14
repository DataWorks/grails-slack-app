(function(angular) {
	angular.module("slackApp.controllers").controller("SlackCtrl",
		function($scope, $http, $modal, $window, $sce, $interval, SlackService, VisibilityChangeService) {
			$scope.self = {};
			$scope.pageTitle = 'Data Works';
			$scope.currentChannelType = 'channel';
			$scope.currentChannelId = '';
			$scope.currentChannelName = 'general';
			$scope.currentChannelHasMore = false;
			$scope.currentChannelMembers = [];

			$scope.users = {};
			
			$scope.channels = [];
			$scope.ims = [];
			$scope.allMessages = {};
			$scope.messageHistoryRetrieved = {};
			$scope.unconfirmedMessages = {};
			
			$scope.pageVisible = true;
			$scope.unseenMessages = false;
			
			$scope.currentPingId = 0;
			$scope.lastPingId = 0;
			$scope.lastPongId = 0;
			
			var lastReadMessages = {};

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
				msgToSend.ts = $scope.getCurrentTimestamp() + '.' + msgToSendId;
				msgToSend.date = new Date(new Number(msgToSend.ts) * 1000);
				msgToSend.userChange = $scope.isUserChange(msgToSend);
				msgToSend.dayChange = $scope.isDayChange(msgToSend);
				msgToSend.unconfirmed = true;
				$scope.unconfirmedMessages[msgToSendId] = msgToSend;
				$scope.formatMessageHtml(msgToSend);
				$scope.addMessageToChannel(msgToSend);
			};
			
			$scope.getCurrentTimestamp = function() {
				return Math.round(new Date().getTime() / 1000);
			};
			
			$scope.pongsOk = function() {
				return ($scope.lastPongId == $scope.lastPingId || $scope.lastPongId == $scope.currentPingId);
			};
			
			$scope.updatePageTitle = function() {
				var prefix = $scope.unseenMessages ? '* ' : '';
				if (!$scope.pongsOk()) {
					prefix = '!! ' + prefix;
				}
				$scope.pageTitle = prefix + $scope.currentChannelName;
			};
			
			$scope.changeChannel = function(newChannelType, newChannelId, newChannelName) {
				var newChannel = $scope.findChannel(newChannelId);
				
				$scope.currentChannelType = newChannelType;
				$scope.currentChannelId = newChannelId;
				$scope.currentChannelName = newChannelName;
				$scope.currentChannelHasMore = newChannel.hasMore;
				$scope.unseenMessages = $scope.anyUnreadMessages();
				$scope.updatePageTitle();
				$scope.currentChannelMembers = newChannel.members ? newChannel.members.map(function(user) {
					return $scope.users[user].name;
				}) : [];
				$scope.messages = $scope.getChannelMessages($scope.currentChannelId);
				$scope.updateLastReadMessage();
				newChannel.unread_count = 0;
				
				if (!$scope.messageHistoryRetrieved[$scope.currentChannelId]) {
					$scope.clearChannelMessages($scope.currentChannelId);
					SlackService.getChannelHistory($scope.currentChannelType, $scope.currentChannelId);
					$scope.messageHistoryRetrieved[$scope.currentChannelId] = $scope.getCurrentTimestamp();
				}
			};
			
			$scope.getChannelClass = function(channelType, channelName) {
				return $scope.currentChannelType == channelType && 
					$scope.currentChannelName == channelName ? 'current-channel' : '';
			};
			
			$scope.getChannelSymbol = function(channelType) {
				return channelType == 'channel' ? '#' : '~';
			};
			
			$scope.findChannel = function(channelId) {
				var foundChannel;
				
				$scope.iterateChannels(function(channel) {
					if (channelId == channel.id) {
						foundChannel = channel;
						return false;
					}
				});
				
				return foundChannel;
			};
			
			$scope.anyUnreadMessages = function() {
				var anyUnread = false;
				
				$scope.iterateChannels(function(channel) {
					if (channel.id != $scope.currentChannelId && channel.unread_count > 0) {
						anyUnread = true;
					}
				});
				
				return anyUnread;
			}
			
			$scope.iterateChannels = function(callback) {
				for (var j = 0; j < 2; j++) {
					var channelGroup = [$scope.channels, $scope.ims][j];
					for (var i = 0; i < channelGroup.length; i++) {
						if (callback(channelGroup[i]) === false) {
							return;
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
			
			$scope.formatMessageHtml = function(message) {
				message.text = (message.text || '').replace(/(?:\r\n|\r|\n)/g, '<br />');
				message.text = $sce.trustAsHtml(message.text);
			};
			
			$scope.addMessageToChannel = function(message) {
				var messages = $scope.getChannelMessages(message.channel);
				messages.push(message);
			};
			
			$scope.addHistoricalMessagesToChannel = function(channel, messages, hasMore) {
				var channelMessages = $scope.getChannelMessages(channel);
				angular.forEach(messages.reverse(), function(message) {
					channelMessages.unshift(message);
				});
				
				$scope.findChannel(channel).hasMore = hasMore;
				
				if ($scope.currentChannelId == channel) {
					$scope.currentChannelHasMore = hasMore;
					$scope.updateLastReadMessage();
				}
			};
			
			$scope.getLastChannelMessage = function(channelId) {
				var msgs = $scope.getChannelMessages(channelId);
				
				return msgs.length > 0 ? msgs[msgs.length - 1] : null;
			};
			
			$scope.isUserChange = function(newMessage, lastMessage) {
				lastMessage = lastMessage || $scope.getLastChannelMessage(newMessage.channel);
				
				return lastMessage ? (lastMessage.subtype != undefined || (newMessage.user != lastMessage.user) || 
						(newMessage.date - lastMessage.date) > (5 * 60 * 1000)) : true;
			};
			
			$scope.isDayChange = function(newMessage, lastMessage) {
				lastMessage = lastMessage || $scope.getLastChannelMessage(newMessage.channel);
				
				return lastMessage ? lastMessage.date.toDateString() != newMessage.date.toDateString() : true;
			};
			
			$scope.getImUserName = function(im) {
				return $scope.users[im.user].name;
			};
			
			$scope.getUserDeleted = function(user) {
				return $scope.users[user].deleted;
			};
			
			$scope.getImPresenceClass = function(im) {
				return $scope.users[im.user].presence == 'active' ? 'active-user' : '';
			};
			
			$scope.$on('visibilityChange', function(evt, hidden) {
				$scope.pageVisible = !hidden;
				
				if (!hidden) {
					$scope.$apply(function() {
						$scope.unseenMessages = $scope.anyUnreadMessages();
						$scope.updatePageTitle();
						$scope.updateLastReadMessage();
					});
				}
			});
			
			$interval(function() {
				angular.forEach(lastReadMessages, function(readMessageInfo) {
					SlackService.markChannel(readMessageInfo.channelType, readMessageInfo.channelId, 
						readMessageInfo.timestamp);
				});
				
				lastReadMessages = {};
			}, 10 * 1000);
			
			$interval(function() {
				$scope.lastPingId = $scope.currentPingId;
				$scope.currentPingId = SlackService.send({type: 'ping'});
				
				if (!$scope.pongsOk()) {
					$scope.updatePageTitle();
				}
			}, 60 * 1000);
			

			SlackService.receivePong().then(null, null, function(info) {
				$scope.lastPongId = info.reply_to;
			});
			
			var filterIncomingChannels = function(channels, type) {
				var filteredChannels = [];
				
				angular.forEach(channels, function(channel) {
					channel.type = type;
					if (channel.unread_count_display == 0) {
						channel.unread_count = 0;
					}
					if (!channel.is_archived) filteredChannels.push(channel);
				});
				
				return filteredChannels;
			};
			
			SlackService.receiveInitialInfo().then(null, null, function(info) {
				$scope.self = info.self;
				
				$scope.channels = filterIncomingChannels(info.channels, 'channel');
				$scope.channels = $scope.channels.concat(filterIncomingChannels(info.groups, 'group'));
				$scope.ims = filterIncomingChannels(info.ims, 'im');
				
				angular.forEach(info.users, function(user) {
					$scope.users[user.id] = user;
				});
				
				angular.forEach(info.bots, function(bot) {
					$scope.users[bot.id] = bot;
					$scope.users[bot.id].profile = $scope.users[bot.id].icons;
				});
				
				angular.forEach($scope.channels, function(channel) {
					if (channel.name == 'general') {
						$scope.changeChannel('channel', channel.id, 'general');
					}
				});
				
			});
			
			$scope.updateLastReadMessage = function() {
				if ($scope.messages.length > 0) {
					lastReadMessages[$scope.currentChannelId] = {
						channelType: $scope.currentChannelType,
						channelId: $scope.currentChannelId,
						timestamp: $scope.messages[$scope.messages.length - 1].ts
					};
				}
			};
			
			$scope.processMessage = function(message, lastMessage) {
				if (!message.user && message.bot_id) {
					message.user = message.bot_id;
				}
				message.userChange = $scope.isUserChange(message, lastMessage);
				message.dayChange = $scope.isDayChange(message, lastMessage);
				
				if (message.subtype == 'channel_join') {
					message.text = 'joined ' + $scope.findChannel(message.channel).name;
				} else {
					if (!message.text && message.attachments) {
						message.text = '';
						angular.forEach(message.attachments, function(attachment) {
							message.text += attachment.fallback;
						});
					}
					
					message.text = (message.text || '').replace(/<(.*?)>/g, function(wholeMatch, matchText) {
						var linkMatch = /^(#|@|!)([a-zA-Z0-9_^{} ]+)(\|(.+))?/.exec(matchText);
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
				}
				
				$scope.formatMessageHtml(message);
			};
			
			SlackService.receiveHistoricalMessages().then(null, null, function(data) {
				var lastMessage;
				
				angular.forEach(data.messages, function(message) {
					$scope.processMessage(message, lastMessage);
					lastMessage = message;
				});
				$scope.addHistoricalMessagesToChannel(data.channel, data.messages, data.hasMore);
			});
			
			SlackService.receiveMessage().then(null, null, function(message) {
				if (message.type == 'confirmation') {
					$scope.unconfirmedMessages[message.reply_to].unconfirmed = false;
					return;
				}

				var channel = $scope.findChannel(message.channel);
				
				$scope.processMessage(message);
				$scope.addMessageToChannel(message);
				
				if ($scope.currentChannelId != message.channel && message.ts > channel.last_read) {
					channel.unread_count++;
				} else if ($scope.pageVisible) {
					$scope.updateLastReadMessage();
				}
				
				if (!$scope.pageVisible) {
					$scope.unseenMessages = true;
					$scope.updatePageTitle();
				}
			});
			
			SlackService.receivePresenceChange().then(null, null, function(message) {
				var user = $scope.users[message.user];
				user.presence = message.presence;
			});
			
			$scope.showMoreMessages = function() {
				var latestTs = $scope.getChannelMessages($scope.currentChannelId)[0].ts;
				SlackService.getChannelHistory($scope.currentChannelType, $scope.currentChannelId, latestTs);
			};
			
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