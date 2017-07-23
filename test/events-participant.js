var Events = artifacts.require("./Events.sol");
keccak_256 = require('js-sha3').keccak_256;

let EVENT_ID = 1;
let REQUIRED_FEE = 10;

let SECRET = 'This is top secret';
// need to add '0x' to make it a hex before passing to contract
let HASHED_SECRET = '0x' + keccak_256(SECRET);

// one event before cancellation deadline, one event after
let START_OF_EVENT_IN_20_DAYS = Date.now() / 1000 + 20*24*3600;
let DEADLINE_IN_DAYS = 15;

function createContract(contract, organizer) {
  return contract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
    from: organizer
  });
}

function createBookings(contract, participant1, participant2, fee) {
  return contract.book(EVENT_ID, {
    from: participant1,
    value: fee
  }).then(() => {
    return contract.book(EVENT_ID, {
      from: participant2,
      value: fee
    });
  });
}

describe('Participant', () => {

  describe('#create()', () => {
    contract('Events', accounts => {
      PARTICIPANT = accounts[1];
      it('should be disallowed', () => {
        return Events.deployed().then(contract => {
          return createContract(contract, PARTICIPANT);
        }).then(function() {
          assert(false, "create() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
      it('should not exists', () => {
        return Events.deployed().then(contract => {
          return contract.exists.call(EVENT_ID);
        }).then(exists => {
          assert.equal(false, exists);
        });
      });
    });
  });

  describe('#book()', () => {
    contract('Events, that not exists', (accounts) => {
      let PARTICIPANT = accounts[1];
      it('should not be possible', () => {
        return Events.deployed().then(contract => {
          return contract.book(EVENT_ID, {
            from: PARTICIPANT,
            value: REQUIRED_FEE
          });
        }).then(function() {
          assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });

    contract('Events, that exists', accounts => {
      let ORGANIZER = accounts[0];
      let PARTICIPANT = accounts[1];
      it('should be possible', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract
          return contract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
            from: ORGANIZER
          });
        }).then(()=> {
          return eventContract.book(EVENT_ID, {
            from: PARTICIPANT,
            value: REQUIRED_FEE
          });
        });
      });
      it('should have the user as participant', () => {
        return Events.deployed().then(contract => {
          return contract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT
          });
        }).then(myBooking => {
          assert.equal(true, myBooking[0]);
        });
      });
      it('should have the correct fee payed by the participant', () => {
        return Events.deployed().then(contract => {
          return contract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT
          });
        }).then(myBooking => {
          assert.equal(REQUIRED_FEE, myBooking[1]);
        });
      });
      it('should be not possible to book the event twice', () => {
        return Events.deployed().then(contract => {
          return contract.book(EVENT_ID, {
            from: PARTICIPANT,
            value: REQUIRED_FEE
          });
        }).then(() => {
          assert(false, "book() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });

  describe('#anyBooking()', () => {
    contract('Events', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[0];

      it('should be disallowed to see whether he takes part', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(() => {
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE);
        }).then(() => {
          return eventContract.anyBooking.call(EVENT_ID, PARTICIPANT1, {
            from: PARTICIPANT1
          });
        }).then(function() {
          assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
      it('should be disallowed to see whether another participant takes part', () => {
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(() => {
          return eventContract.anyBooking.call(EVENT_ID, PARTICIPANT2, {
            from: PARTICIPANT1
          });
        }).then(function() {
          assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });

  describe('#refundMeThroughCancellation()', () => {
    contract('Events, sign me off', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should be possible', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(()=> {
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE);
        }).then(()=>{
          return eventContract.refundMeThroughCancellation(EVENT_ID, {
            from: PARTICIPANT1
          });
        }).then(() => {
          return eventContract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT1
          });
        }).then(myBooking => {
          assert.equal(false, myBooking[0]);
          assert.equal(0, myBooking[1]);
        });
      });
      it('should not sign other participants off', () => {
        return Events.deployed().then(contract => {
          return contract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT2
          });
        }).then((myBooking)=>{
          assert.equal(true, myBooking[0]);
          assert.equal(REQUIRED_FEE, myBooking[1]);
        });
      });
    });

    contract('Events, I have not booked', accounts => {
      PARTICIPANT1 = accounts[1];
      it('should not possible', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(()=>{
          return eventContract.refundMeThroughCancellation(EVENT_ID, {
            from: PARTICIPANT1
          });
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });

  describe('#refundParticipantThroughCancellation()', () => {
    contract('Events', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should be disallowed', () => {
        let eventContract
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER)
        }).then(()=>{
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE);
        }).then(()=> {
          return eventContract.refundParticipantThroughCancellation.call(EVENT_ID, PARTICIPANT1, {
            from: PARTICIPANT2
          });
        }).then(function() {
          assert(false, "refundThroughCancellation() was supposed to throw but did not");
        }).catch(function(error) {
          if (error.toString().indexOf("invalid JUMP") == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });

  describe('#refundThroughAttendance()', () => {
    contract('Events', accounts => {
      ORGANIZER = accounts[0];
      PARTICIPANT1 = accounts[1];
      PARTICIPANT2 = accounts[2];
      it('should refund when providing the correct event secret', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return createContract(contract, ORGANIZER);
        }).then(()=>{
          return createBookings(eventContract, PARTICIPANT1, PARTICIPANT2, REQUIRED_FEE)
        }).then(()=> {
          return eventContract.refundThroughAttendance(EVENT_ID, SECRET, {
            from: PARTICIPANT1
          });
        }).then(()=> {
          return eventContract.myBooking.call(EVENT_ID, {
            from: PARTICIPANT1
          });
        }).then((myBooking)=> {
          assert.equal(false, myBooking[0]);
          assert.equal(0, myBooking[1]);
        });
      });
      it('should not refund when providing the wrong event secret', () => {
        let eventContract;
        return Events.deployed().then(contract => {
          eventContract = contract;
          return eventContract.refundThroughAttendance(EVENT_ID, 'wrong', {
            from: PARTICIPANT2
          });
        }).then(()=>{
          assert(false, 'refundThroughAttendance() was supposed to throw but did not');
        }).catch(function(error) {
          if (error.toString().indexOf('invalid JUMP') == -1) {
            assert(false, error.toString());
          }
        });
      });
    });
  });
});
