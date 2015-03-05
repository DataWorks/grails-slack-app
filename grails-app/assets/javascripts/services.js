(function(angular, SockJS, Stomp, _, undefined) {
	angular.module("slackApp.services").service("SlackService",
		function($q, $timeout, $http, $modal) {
			var messageId = 1;
			var service = {};
			var messageListener = $q.defer(), initialInfoListener = $q.defer();
			var socket = {
				client : null,
				stomp : null
			};

			service.RECONNECT_TIMEOUT = 30000;
			service.SOCKET_URL = "/grails-slack-app/stomp";
			service.CHAT_TOPIC = "/user/topic/slack";
			service.CHAT_BROKER = "/app/slack";

			service.receiveMessage = function() {
				return messageListener.promise;
			};
			
			service.receiveInitialInfo = function() {
				return initialInfoListener.promise;
			};

			service.send = function(message) {
				var id = messageId++;
				var headers = {
					priority: 9	
				};
				
				socket.stomp.send(service.CHAT_BROKER, headers, JSON.stringify({
					id: id,
					type: message.type,
					channel: message.channel,
					text: message.text,
				}));
				
				return id;
			};
			
			var processMessage = function(obj) {
				if (obj.type == 'message' && obj.subtype != 'bot_message') {
					obj.date = new Date(new Number(obj.ts) * 1000);
					messageListener.notify(obj);
				} else if (obj.type == 'connect') {
					initialInfoListener.notify(obj);
				}
			};
			
			service.getChannelHistory = function(channelType, channelId) {
				$http.get('slackChannel/listChannelHistory', {params: {channelType: channelType, channel: channelId}}).
				success(function(data, status, headers, config) {
					angular.forEach(data.rows, function(obj) {
						obj.channel = channelId;
						processMessage(obj);
					});
				}).
				error(function(data, status, headers, config) {
					$modal.open({
						template: '<div class="error-window">Sorry, there was an error retrieving channel history.</div>',
						size: 'sm'
					});
				});
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