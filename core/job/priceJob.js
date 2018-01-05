const request = require('request');
const Job = require('./../lib/job');
const api = require('./../configs/api');

function PriceJob() {
	
	Job.apply(this);

	this.api = api.https;

	this.getPrice = (cb) => {

		return request(this.api, (err, res, body) => {

			if(err) {
				console.log(`Couldn't get the new price`);
				console.log(err);
				cb(false);
			} 

			cb(body);

		});
	}

	this.task = () => this.getPrice(res => res && this.cb && this.cb(JSON.parse(res)));
}

module.exports = PriceJob;
