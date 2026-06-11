/**
 * An implementation of an Observable to subscribe to updates to a value.
 */
class Observable<T extends object = object> {
	private value: T;
	private subscribers: Array<(value: T) => void> = [];

	constructor(value: T) {
		this.value = value;
	}

	/**
	 * Set the value
	 * @param value
	 */
	setValue(value: T) {
		this.value = value;
		this.subscribers.forEach((callback) => callback({ ...this.value }));
	}

	/**
	 * Get the current value
	 */
	getValue(): T {
		return this.value;
	}

	/**
	 * Subscribe to changes in the value. Returns an "unsubscribe" function to
	 * clean up as necessary.
	 * @param callback
	 */
	onChange(callback: (value: T) => void) {
		this.subscribers.push(callback);

		return () => {
			// Remove the unsubscribing callback — keep all the others. (This
			// was inverted, so unsubscribe dropped every *other* subscriber and
			// left the unmounted one attached, leaking stale setState calls.)
			this.subscribers = this.subscribers.filter(
				(value) => value !== callback
			);
		};
	}
}

export default Observable;
