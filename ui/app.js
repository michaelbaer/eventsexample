(function() {
  'use strict'

  let contract;

  var metaMaskIsInstalled = () => {
    return typeof web3 !== 'undefined'
  }

  document.getElementById('book-event').addEventListener('click', () => {
    contract.book(1, {
      value: 10000000000000000000,
      from: web3.eth.coinbase
    }, (err, succ) => {
      console.log(err, succ)
    })
  });

  document.getElementById('create-event').addEventListener('click', () => {
    contract.create(1, 10000000000000000000, (Date.now()/1000) + 20 * 24 * 3600, 15, web3.sha3('secret'), {
      from: web3.eth.coinbase
    }, () => {
      document.getElementById('status').innerHTML = 'Event has been created!'
    })
  });

  window.onload = () => {
    if (metaMaskIsInstalled()) {
      contract = web3.eth.contract(__ABI__).at('__ADDRESS__');
    } else {
      document.getElementById('status').innerHTML =
        'Your browser does not support the app. Please install MetaMask'
    }
  }
})()