import test.TestRole
import test.TestSamlUser
import test.TestUserRole


class BootStrap {

    def init = { servletContext ->
		def user = new TestSamlUser()
		
		user.username = 'joe.schweitzer'
		user.password = 'hi'
		user.enabled = true
		user.accountExpired = false
		user.accountLocked = false
		user.passwordExpired = false
		user.email = 'joe.schweitzer@dataworks-inc.com'
		user.firstName = 'Joe'
		
		user.save(flush: true, failOnError: true)
		
		def role = new TestRole()
		role.authority = 'ADMIN'
		role.save(flush: true, failOnError: true)
		
		def userRole = new TestUserRole()
		userRole.user = user
		userRole.role = role
		userRole.save(flush: true, failOnError: true)
    }
    def destroy = {
    }
}
