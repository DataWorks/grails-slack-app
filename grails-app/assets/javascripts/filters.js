(function(angular) {
	angular.module("slackApp.filters").filter("removeDeleted", function() {
		return function(input, isDeletedFn) {
			var ret = [];
			
			angular.forEach(input, function(v) {
				if (!v.is_user_deleted && !isDeletedFn(v.user)) {
					ret.push(v);
				}
			});
			
			return ret;
		}
	})
})(angular);