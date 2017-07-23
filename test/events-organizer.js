var Events = artifacts.require("./Events.sol");
keccak_256 = require('js-sha3').keccak_256;

let EVENT_ID = 1;
let REQUIRED_FEE = 10;

let SECRET = 'This is top secret';
// need to add '0x' to make it a hex before passing to contract
let HASHED_SECRET = '0x' + keccak_256(SECRET);

// one event before cancellation deadline, one event after
let START_OF_EVENT_IN_20_DAYS = Date.now() / 1000 + 20*24*3600;
let START_OF_EVENT_IN_10_DAYS = Date.now() / 1000 + 10*24*3600;
let DEADLINE_IN_DAYS = 15;

function createContract(contract, organizer) {
  return contract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
    from: organizer
  });
}

function createBookings(contract, fraudUser, participant, fee) {
  return contract.book(EVENT_ID, {
    from: fraudUser,
    value: fee
  }).then(() => {
    return contract.book(EVENT_ID, {
      from: participant,
      value: fee
    });
  });
}

describe('Creator', () => {
  describe('#deployed() on', () => {
    contract('Events', accounts => {
      let ORGANIZER = accounts[0];
      it('should sets the creator as the organizer', () => {
        return Events.deployed().then(eventContract => {
          return eventContract.organizer.call();
        }).then(organizer => {
          assert.equal(organizer, ORGANIZER);
        });
      });
    });
  });
});

describe('Organizer', () => {

  describe('#create()', () => {
    contract('Events, with non zero fee', accounts => {
      let ORGANIZER = accounts[0];
      it('should be possible', () => {
        return Events.deployed().then(contract => {
          return contract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
            from: ORGANIZER
          });
        });
      });
      it('should exists', () => {
        return Events.deployed().then(contract => {
          return contract.exists.call(EVENT_ID);
        }).then(exists => {
          assert.equal(true, exists);
        });
      });
      it('should have the same required fee as set at creation time', () => {
        return Events.deployed().then(contract => {
          return contract.fee.call(EVENT_ID);
        }).then(fee => {
          assert.equal(fee, REQUIRED_FEE);
        });
      });
    });

    contract('Events, with zero fee', (accounts) => {
      let ORGANIZER = accounts[0];
      it('should be possible', () => {
        return Events.deployed().then(contract => {
          return contract.create(EVENT_ID, 0, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
            from: ORGANIZER
          });
        });
      });
      it('should have zero fee', () => {
        return Events.deployed().then(contract => {
          return contract.fee.call(EVENT_ID);
        }).then(fee => {
          assert.equal(0, fee);
        });
      });
    });
  });

  describe('#anyBooking', () => {
    contract('Events', (accounts) => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should see other participants', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return contract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
            from: ORGANIZER
          });
        }).then(()=> {
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE)
        }).then(()=> {
          return eventContract.anyBooking.call(EVENT_ID, PARTICIPANT, {
            from: ORGANIZER
          });
        }).then(booking => {
          assert.equal(true, booking[0]);
          assert.equal(REQUIRED_FEE, booking[1]);
        });
      });
    });
  });

  describe('#refundParticipantThroughCancellation()', () => {
    contract('Events', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should be possible to unbook each participant', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(()=> {
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE);
        }).then(()=>{
          return eventContract.refundParticipantThroughCancellation.call(EVENT_ID, PARTICIPANT1, {
            from: ORGANIZER
          });
        }).then(() => {
          return eventContract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT1
          });
        }).then(myBooking => {
          assert.equal(false, myBooking[0]);
          assert.equal(0, myBooking[1]);
        }).then(()=>{
          return eventContract.refundParticipantThroughCancellation.call(EVENT_ID, PARTICIPANT2, {
            from: ORGANIZER
          });
        }).then(() => {
          return eventContract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT2
          });
        }).then(myBooking => {
          assert.equal(false, myBooking[0]);
          assert.equal(0, myBooking[1]);
        });
      });
    });

    contract('Events, cancellation to late', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should not refund', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return eventContract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
            from: ORGANIZER
          });
        }).then(()=> {
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE)
        }).then(()=> {
          return eventContract.refundParticipantThroughCancellation(EVENT_ID, PARTICIPANT, {
            from: ORGANIZER
          });
        }).then(function() {
          assert(false, "refundThroughCancellation() was supposed to throw due to the missed deadline but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });



});
