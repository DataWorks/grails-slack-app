(function(angular, SockJS, Stomp, _, undefined) {
	angular.module("slackApp.services").service("SlackService",
		function($q, $timeout, $http, $modal, $window) {
			var messageId = 1;
			var service = {};
			var messageListener = $q.defer(), 
				historicalMessageListener = $q.defer(), 
				presenceChangeListener = $q.defer(), 
				initialInfoListener = $q.defer();
			var socket = {
				client : null,
				stomp : null
			};

			service.RECONNECT_TIMEOUT = 30000;
			service.SOCKET_URL = $window.location.pathname + "stomp";
			service.CHAT_TOPIC = "/user/topic/slack";
			service.CHAT_BROKER = "/app/slack";

			service.receiveMessage = function() {
				return messageListener.promise;
			};
			
			service.receiveHistoricalMessages = function() {
				return historicalMessageListener.promise;
			}
			
			service.receivePresenceChange = function() {
				return presenceChangeListener.promise;
			};
			
			service.receiveInitialInfo = function() {
				return initialInfoListener.promise;
			};

			service.send = function(message) {
				var headers = {
					priority: 9	
				};
				message.id = messageId++;
				
				socket.stomp.send(service.CHAT_BROKER, headers, JSON.stringify(message));
				
				return message.id;
			};
			
			var processMessage = function(obj) {
				if (!obj.type && obj.reply_to) {
					obj.type = 'confirmation';
				}
				
				if ((obj.type == 'message' && obj.subtype != 'bot_message') || (obj.type == 'confirmation')) {
					obj.date = new Date(new Number(obj.ts) * 1000);
					messageListener.notify(obj);
				} else if (obj.type == 'connect') {
					initialInfoListener.notify(obj);
				} else if (obj.type == 'presence_change') {
					presenceChangeListener.notify(obj);
				}
			};
			
			service.getChannelHistory = function(channelType, channelId, latest) {
				$http.get('slackChannel/listChannelHistory', 
						{params: {channelType: channelType, channel: channelId, latest: latest, limit: 50}}).
				success(function(data, status, headers, config) {
					angular.forEach(data.rows, function(obj) {
						obj.channel = channelId;
						obj.date = new Date(new Number(obj.ts) * 1000);
					});

					if (data.rows.length > 0) {
						historicalMessageListener.notify({channel: channelId, messages: data.rows, hasMore: data.hasMore});
					}
				}).
				error(function(data, status, headers, config) {
					$modal.open({
						template: '<div class="error-window">Sorry, there was an error retrieving channel history.</div>',
						size: 'sm'
					});
				});
			};
			
			service.markChannel = function(channelType, channelId, timestamp) {
				$http.get('slackChannel/markChannel', 
						{params: {channelType: channelType, channel: channelId, timestamp: timestamp}})
			};

			var reconnect = function() {
				$timeout(function() {
					initialize();
				}, this.RECONNECT_TIMEOUT);
			};

			var startListener = function() {
				socket.stomp.subscribe(service.CHAT_TOPIC, function(data) {
					var obj = JSON.parse(data.body);
					processMessage(obj);
				});
				
				service.send({
					type: 'initialInfo'
				});
			};

			var initialize = function() {
				socket.client = new SockJS(service.SOCKET_URL);
				socket.stomp = Stomp.over(socket.client);
				socket.stomp.connect({}, startListener);
				socket.stomp.onclose = reconnect;
			};

			initialize();
			return service;
		}).service('VisibilityChangeService', function($rootScope, $document) {
			var service = {};
			var document = $document[0], features, detectedFeature;
			var isBoolean = function(obj) {
			    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
			};
			
			features = {
				standard : {
					eventName : 'visibilitychange',
					propertyName : 'hidden'
				},
				moz : {
					eventName : 'mozvisibilitychange',
					propertyName : 'mozHidden'
				},
				ms : {
					eventName : 'msvisibilitychange',
					propertyName : 'msHidden'
				},
				webkit : {
					eventName : 'webkitvisibilitychange',
					propertyName : 'webkitHidden'
				}
			};
		
			Object.keys(features).some(function(feature) {
				if (isBoolean(document[features[feature].propertyName])) {
					detectedFeature = features[feature];
					return true;
				}
			});
		
			// Feature doesn't exist in browser.
			if (!detectedFeature) {
				return;
			}
		
			$document.on(detectedFeature.eventName, broadcastChangeEvent);
		
			function broadcastChangeEvent() {
				$rootScope.$broadcast('visibilityChange',
						document[detectedFeature.propertyName]);
			}
			
			return service;
		});
})(angular, SockJS, Stomp, _);