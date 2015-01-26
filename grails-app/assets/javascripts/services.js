(function(angular, SockJS, Stomp, _, undefined) {
	angular.module("slackApp.services").service("SlackService",
		function($q, $timeout) {
			var messageId = 1;
			var service = {};
			var messageListener = $q.defer(), initialInfoListener = $q.defer();
			var socket = {
				client : null,
				stomp : null
			};
			var messageIds = [];

			service.RECONNECT_TIMEOUT = 30000;
			service.SOCKET_URL = "/grails-slack-app/stomp";
			service.CHAT_TOPIC = "/topic/slack";
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
				
				messageIds.push(id);
				return id;
			};

			var reconnect = function() {
				$timeout(function() {
					initialize();
				}, this.RECONNECT_TIMEOUT);
			};

			var startListener = function() {
				socket.stomp.subscribe(service.CHAT_TOPIC, function(data) {
					var obj = JSON.parse(data.body);
					console.log(obj);
					
					if (obj.type == 'message') {
						obj.date = new Date();
						messageListener.notify(obj);
					} else if (obj.type == 'connect') {
						initialInfoListener.notify(obj);
					}
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
		});
})(angular, SockJS, Stomp, _);