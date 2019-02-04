
'use strict'

class StatementError extends Error {
	static from(error) {
		let instance = new StatementError(error.message)

		instance.previous = error

		return instance
	}
}

// export
module.exports = {
	StatementError
}
