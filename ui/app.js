(function() {
  'use strict'

  let contract;

  var metaMaskIsInstalled = () => {
    return typeof web3 !== 'undefined'
  }

  document.getElementById('create-event').addEventListener('click', () => {
    contract.create(1, 1, Date.now(), 15, web3.sha3('secret'), {
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