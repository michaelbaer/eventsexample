var Events = artifacts.require("./Events.sol");

contract('Events', function(accounts) {
  let ORGANIZER = accounts[0];
  let PARTICIPANT = accounts[1];
  let PARTICIPANT2 = accounts[2];

  xit('sets creator as organizer', () => {
    return Events.deployed().then(eventContract => {
      return eventContract.organizer.call();
    }).then(organizer => {
      assert.equal(organizer, ORGANIZER);
    })
  })

  xit('allows users to participate', () => {
    let eventContract;
    return Events.deployed().then(contract => {
      eventContract = contract;
      return eventContract.book({
        from: PARTICIPANT
      });
    }).then(() => {
      return eventContract.participant.call();
    }).then(participant => {
      assert.equal(participant, PARTICIPANT);
    })
  })

  it('allows multiple users to participate', () => {
    let eventContract;
    return Events.deployed().then(contract => {
      eventContract = contract;
      return eventContract.book({
        from: PARTICIPANT2
      });
    }).then(() => {
      console.log('calling')
      return eventContract.participants.call();
    }).then(participants => {
      console.log('hey')
      console.log(participants.valueOf());
      //assert.equal(participants[1], PARTICIPANT2);
    })
  })

});
