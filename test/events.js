var Events = artifacts.require("./Events.sol");

let assertException = function(error) {
  if (error.toString().indexOf("invalid opcode") == -1) {
    assert(false, error.toString());
  }
}
let createEvent = function(eventContract, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, ORGANIZER) {
    return eventContract.create(REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, {
        from: ORGANIZER
    });
}
contract('Events', function(accounts) {

    let ORGANIZER = accounts[0];
    let PARTICIPANT = accounts[1];

    let EVENT_ID = 1;
    let ZERO_FEE_EVENT_ID = 2;
    let UNKNOWN_EVENT_ID = 3;
    let MISSED_EVENT_ID = 4;

    let REQUIRED_FEE = 10;

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
            return eventContract.create(REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.eventCounter.call();
        }).then(eventId => {
            return eventContract.feeOf.call(eventId);
        }).then(fee => {
            assert.equal(fee, REQUIRED_FEE);
        })
    })

    it('disallows non-organizer to create events', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(REQUIRED_FEE, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, {
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
            return eventContract.create(0, START_OF_EVENT_IN_20_DAYS, DEADLINE_IN_DAYS, {
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
            return eventContract.cancelAttendance(EVENT_ID, {
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
            return eventContract.cancelAttendance(EVENT_ID, {
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

    it('does not refund if cancellation occurs too late', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return createEvent(eventContract, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, ORGANIZER)
        }).then(() => {
            return eventContract.book(MISSED_EVENT_ID, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.cancelAttendance(MISSED_EVENT_ID, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "refundThroughCancellation() was supposed to throw due to the missed deadline but did not");
        }).catch(function(error) {
            assertException(error)
        })
    })

    it('does not allow a participant to verify her attendance', () => {
        let eventContract;
        let eventId;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return createEvent(eventContract, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, ORGANIZER)
        }).then(() => {
            return eventContract.eventCounter.call();
        }).then(id => {
            eventId = id;
            return eventContract.book(eventId, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.verifyAttendance(eventId, PARTICIPANT, {
                from: PARTICIPANT
            });
        }).then(() => {
            assert(false, 'was supposed to throw');
        }).catch(error => {
            assertException(error)
        })
    })

    it('does not allow the organizer to verify the attendance of someone who is not registered', () => {
        let eventContract;
        let eventId;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return createEvent(eventContract, REQUIRED_FEE, START_OF_EVENT_IN_10_DAYS, DEADLINE_IN_DAYS, ORGANIZER)
        }).then(() => {
            return eventContract.eventCounter.call();
        }).then(id => {
            eventId = id;
        }).then(() => {
            return eventContract.verifyAttendance(eventId, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(() => {
            assert(false, 'was supposed to throw');
        }).catch(error => {
            assertException(error)
        })
    })
});
