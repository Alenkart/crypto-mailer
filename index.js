const express = require('express');
const app = express();
const port = 3000;

const Cexio = require('./core/lib/cexio');
const PriceJob = require('./core/job/priceJob');
const fixString = require('./core/lib/fixString');

const currencies = require('./core/configs/currencies');

let lastPrices = {};
let emailsLog = [];

app.get('/', (req, res) => {	
	res.send(lastPrices);
});

app.get('/emails', (req, res) => {	
	res.send(emailsLog);
});

app.listen(port, () => {

	const cex = new Cexio();
	
	const job = new PriceJob();

	job.cb = (res) => {

		console.log(`************* Prices updated ************* `);

		res.data.forEach(currency => {

			let { pair, last } = currency;

			if(!currencies[pair]) return; 

			lastPrices[pair] = last;

			console.log(`| ${fixString(pair)} | ${fixString(last)}`);
		});
	};

	cex.onMessage = res => cex.process(res, currencies, lastPrices, (key, price, log) => {
		lastPrices[key] = price;
		emailsLog.push(log);
	});

	cex.send({ "e": "subscribe", "rooms": [ "tickers" ] });

	job.init();

	cex.init();

	console.log('server is running on port 3000');
});


