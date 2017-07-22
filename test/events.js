var Events = artifacts.require("./Events.sol");
keccak_256 = require('js-sha3').keccak_256;

let assertException = function(error) {
  if (error.toString().indexOf("invalid JUMP") == -1) {
    assert(false, error.toString());
  }
}
contract('Events', function(accounts) {

    let ORGANIZER = accounts[0];
    let PARTICIPANT = accounts[1];
    let PARTICIPANT2 = accounts[2];
    let PARTICIPANT3 = accounts[3];

    let EVENT_ID = 1;
    let ZERO_FEE_EVENT_ID = 2;
    let UNKNOWN_EVENT_ID = 3;
    let MISSED_EVENT_ID = 4;

    let REQUIRED_FEE = 10;

    let SECRET = 'This is top secret';
    // need to add '0x' to make it a hex before passing to contract
    let HASHED_SECRET = '0x' + keccak_256(SECRET);

    // one event before cancellation deadline, one event after
    let START_OF_EVENT_IN_20_DAYS = Date.now() / 1000 + 20*24*3600;
    let START_OF_EVENT_IN_10_DAYS = Date.now() / 1000 + 10*24*3600;
    let DEADLINE_IN_DAYS = 15;

    it('sets creator as organizer', () => {
        return Events.deployed().then(eventContract => {
            return eventContract.organizer.call();
        }).then(organizer => {
            assert.equal(organizer, ORGANIZER);
        })
    })

    it('organizer can create event, event has non-zero fee', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.feeOf.call(EVENT_ID);
        }).then(fee => {
            assert.equal(fee, REQUIRED_FEE);
        })
    })

    it('disallows non-organizer to create events', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "create() was supposed to throw but did not");
        }).catch(function(error) {
            assertException(error)
        });
    })

    it('events can have a zero fee', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(ZERO_FEE_EVENT_ID, 0, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.feeOf.call(ZERO_FEE_EVENT_ID);
        }).then(fee => {
            assert.equal(0, fee);
        })
    })

    it('user can perform a booking with a payment', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.bookingFor.call(EVENT_ID, PARTICIPANT, {
                from: PARTICIPANT
            });
        }).then(booking => {
            assert.equal(true, booking[0]);
            assert.equal(REQUIRED_FEE, booking[1]);
        })
    })

    it('participants can not participate twice', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(function() {
            assert(false, "book() was supposed to throw but did not");
        }).catch(function(error) {
            assertException(error)
        });
    })

    it('users must provide correct minimum fee', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE / 2
            });
        }).then(function() {
            assert(false, "book() was supposed to throw but did not");
        }).catch(function(error) {
            assertException(error)
        });
    })

    it('users can see other participants', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.bookingFor.call(EVENT_ID, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(booking => {
            assert.equal(true, booking[0]);
            assert.equal(REQUIRED_FEE, booking[1]);
        })
    })

    it('participants can unbook', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.refundMeThroughCancellation(EVENT_ID, {
                from: PARTICIPANT
            });
        }).then(() => {
            return eventContract.bookingFor.call(EVENT_ID, PARTICIPANT, {
                from: PARTICIPANT
            });
        }).then(booking => {
            assert.equal(false, booking[0]);
            assert.equal(0, booking[1]);
        })
    })

    it('participants cannot unbook if not booked', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.refundMeThroughCancellation(EVENT_ID, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "unbookMe() was supposed to throw but did not");
        }).catch(function(error) {
            assertException(error)
        });
    })

    it('participants cannot book to events that do not exist', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(UNKNOWN_EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(function() {
            assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
            assertException(error)
        })
    })

    it('do not refund if cancellation occurs too late', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(MISSED_EVENT_ID, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, HASHED_SECRET, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.book(MISSED_EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.refundMeThroughCancellation(MISSED_EVENT_ID, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "refundThroughCancellation() was supposed to throw due to the missed deadline but did not");
        }).catch(function(error) {
            assertException(error)
        })
    })

    it('participants get refund when providing the correct event secret', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ID, {
                from: PARTICIPANT3,
                value: REQUIRED_FEE
            });
        }).then(contract => {
            return eventContract.verifyAttendance(EVENT_ID, SECRET, {
                from: PARTICIPANT3
            });
        }).then(() => {
            return eventContract.bookingFor.call(EVENT_ID, PARTICIPANT3, {
                from: PARTICIPANT3
            });
        }).then(booking => {
            assert.equal(false, booking[0]);
            assert.equal(0, booking[1]);
        })
    })

    it('participants get no refund when providing the wrong event secret', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ID, {
                from: PARTICIPANT3,
                value: REQUIRED_FEE
            });
        }).then(contract => {
            return eventContract.verifyAttendance(EVENT_ID, 'wrong', {
                from: PARTICIPANT3
            });
        }).then(function() {
            assert(false, 'verifyAttendance() was supposed to throw but did not');
        }).catch(function(error) {
            assertException(error)
        })
    })
});
