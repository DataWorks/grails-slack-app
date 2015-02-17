package com.dataworks

class User {
 
	String username
	String password
	boolean enabled
	boolean accountExpired
	boolean accountLocked
	boolean passwordExpired
	String email
	String firstName

	static constraints = {
		username blank: false, unique: true
		password blank: false
		email nullable: true, unique: true
		firstName nullable: true
	}
}
