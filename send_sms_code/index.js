'use strict';

/**
 * Minimal cloud function for sending SMS code placeholder.
 * Replace the TODO block with your real SMS provider integration.
 *
 * @param {Object} event - Invocation payload. Expecting { phone: string }
 * @returns {Promise<{success:boolean, request_id?:string, message?:string}>}
 */
exports.main = async (event) => {
	try {
		// Support both direct event.phone or JSON body from HTTP proxy
		let phone = '';
		if (event && typeof event === 'object') {
			if (typeof event.phone === 'string') {
				phone = event.phone;
			} else if (typeof event.body === 'string') {
				try {
					const parsed = JSON.parse(event.body);
					if (parsed && typeof parsed.phone === 'string') {
						phone = parsed.phone;
					}
				} catch (_) {
					// ignore body parse error
				}
			}
		}

		phone = String(phone || '').trim();

		// Basic mainland China mobile phone validation
		if (!/^1[3-9]\d{9}$/.test(phone)) {
			return { success: false, message: 'invalid phone' };
		}

		// Generate a request id for tracing; integrate your SMS provider here
		const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

		// TODO: Call your SMS provider SDK/API to actually send the code
		// Example (pseudo):
		// await smsClient.send({ to: phone, templateId: 'xxxx', params: ['123456', '5'] });

		return { success: true, request_id: requestId };
	} catch (error) {
		return { success: false, message: error && error.message ? error.message : 'internal error' };
	}
};


