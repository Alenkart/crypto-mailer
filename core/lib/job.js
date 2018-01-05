function job() {

	this.task;

	this.time = this.time || 60 * 60 * 1000;

	this.init = () => {
		
		if(!this.task) {
			throw 'Please define a this.task to be execute';
		}

		this.task();

		this.interval = setInterval(this.task, this.time);
	}

	this.stop = () => clearInterval(this.interval);
}

module.exports = job;