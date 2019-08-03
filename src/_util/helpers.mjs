
/**
 * Create a nested error instance
 * 
 * @param {Object} response 
 */
export function toError (response) {
	let instance = new Error(response.message)

	instance.previous = response

	return instance
}
