'use strict';

const WebSocket = require('ws');
const request = require('request');
const api = require('./../configs/api');
const Email = require('./../lib/email');
const fixString = require('./../lib/fixString');


function coinMarketCap(name, cb) {
	
	const api = `https://api.coinmarketcap.com/v1/ticker/${name}/`;

	request(api, (err, rRes, body) => {
			
		if(err) {
			cb("Couldn't get CoinMarketCap.com data");
		} else {
			cb(body);
		}

	});

}

function cexio() {

	let open = false;

	let messages = [];

	this.api = api.ws;

	this.ws = new WebSocket(this.api);

	this.email = new Email();

	this.openCb;

	this.onMessage; 

	this.open = (message) => {

		open = true;

		this.sendMessages();

	  	if(typeof this.openCb === 'function') {
	  		this.openCb();	
	  	} else {
	  		console.log(`Connected to ${this.api}`);
	  	}

	}

	this.incoming = (data) => {
	  
		const jsonData = JSON.parse(data);

		if(typeof this.onMessage === 'function') {
	  		this.onMessage(jsonData);	
	  	} else {
	  		console.log(jsonData);
	  	}
	}

	this.send = (message) => {

		const type = typeof message;

		if(type !== 'string' && type !== 'object') {
			throw 'Invalid message type';
		}

		const messageStr = type === 'string' 
			? message 
			: JSON.stringify(message);

		if(!open) {
			messages.push(messageStr);
			console.log(`Added message: ${messageStr}`);
			return;
		}
	  	
	  	this.ws.send(messageStr);
	} 

	this.sendMessages = () => {
		messages.forEach(this.send);
	}

	this.process = (res, currencies, lastPrices, onFire) => {

		if(!res.data) {
			console.log(res);
			return;
		}

		const { symbol1, symbol2, price } = res.data;

		const key = `${symbol1}:${symbol2}`;

		if(!currencies[key] || !lastPrices[key]) {
			return;
		}

		const { max, min } = currencies[key];

		const percent = ( (price - lastPrices[key]) / lastPrices[key] ) * 100;

		const log = this.createLog(percent, key, price);

		if( percent >= max || percent <= min ) {

			if(currencies[key].name) {	
				
				coinMarketCap(currencies[key].name, cmc => {
					this.onSendEmail(log, JSON.stringify(res.data), cmc)}
				);

			} else {

				this.onSendEmail(log, JSON.stringify(res.data), "")
			}
			
			if(typeof onFire === 'function') {
				onFire(key, price, { log: log, date: new Date() });
			} 
		}

		console.log(log);
	}

	this.createLog = (percent, key, price) => {

		const reason = percent > 0 ? "H" : "L";

		return `| ${reason} | ${fixString(key)} | ${fixString(price)} | ${percent.toFixed(2)}%`;
	}

	this.onSendEmail = (subject, cex, coinMarket) => {

		this.email.subject = subject;

		this.email.text = `Time: ${new Date().toString()} \n\n Cexio:${cex} \n\n CoinMarketCap:${coinMarket}`;

		console.log('******************* EMAIL *******************');

		this.email.send();
	}

	this.init = () => {
		this.ws.on('open', this.open);
		this.ws.on('message', this.incoming);
	}
}

module.exports = cexio;