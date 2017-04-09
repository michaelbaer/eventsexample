var Events = artifacts.require("./Events.sol");

contract('Events', function(accounts) {
    let ORGANIZER = accounts[0];
    let PARTICIPANT = accounts[1];
    let PARTICIPANT2 = accounts[2];
    let EVENT_ADDRESS = accounts[3];
    let ZERO_FEE_EVENT_ADDRESS = accounts[4];
    let UNKNOWN_EVENT_ADDRESS = accounts[3];

    let REQUIRED_FEE = 10;

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
            return eventContract.create(EVENT_ADDRESS, REQUIRED_FEE, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.exists.call(EVENT_ADDRESS);
        }).then(exists => {
          assert.equal(true, exists);
        }).then(() => {
            return eventContract.fee.call(EVENT_ADDRESS);
        }).then(fee => {
            assert.equal(fee, REQUIRED_FEE);
        })
    })

    it('disallows non-organizer to create events', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(EVENT_ADDRESS, REQUIRED_FEE, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "create() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        });
    })

    it('events can have a zero fee', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(ZERO_FEE_EVENT_ADDRESS, 0, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.fee.call(ZERO_FEE_EVENT_ADDRESS);
        }).then(fee => {
            assert.equal(0, fee);
        })
    })

    it('user can perform a booking with a payment', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.myBooking.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(myBooking => {
            assert.equal(true, myBooking[0]);
            assert.equal(REQUIRED_FEE, myBooking[1]);
        })
    })

    it('participants can not participate twice', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(function() {
            assert(false, "book() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        });
    })

    it('users must provide correct minimum fee', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE / 2
            });
        }).then(function() {
            assert(false, "book() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        });
    })

    it('organizer can see other participants', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.anyBooking.call(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(booking => {
            assert.equal(true, booking[0]);
            assert.equal(REQUIRED_FEE, booking[1]);
        })
    })

    it('other users can not see participants', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.anyBooking.call(EVENT_ADDRESS, PARTICIPANT, {
                from: PARTICIPANT2
            });
        }).then(function() {
            assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        })
    })

    it('participants can unbook', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.unbookMe(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(() => {
            return eventContract.myBooking.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(myBooking => {
            assert.equal(false, myBooking[0]);
            assert.equal(0, myBooking[1]);
        })
    })

    it('participants can not unbook if not booked', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.unbookMe(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(function() {
            assert(false, "unbookMe() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        });
    })

    it('organizer can unbook anyone', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.refund(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.myBooking.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(myBooking => {
            assert.equal(false, myBooking[0]);
            assert.equal(0, myBooking[1]);
        })
    })

    it('other users can not unbook anyone', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(() => {
            return eventContract.refund.call(EVENT_ADDRESS, PARTICIPANT, {
                from: PARTICIPANT2
            });
        }).then(() => {
            return eventContract.booked.call(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(function() {
            assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        });
    })

    it('participants cannot book to events that do not exist', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.book(UNKNOWN_EVENT_ADDRESS, {
                from: PARTICIPANT,
                value: REQUIRED_FEE
            });
        }).then(function() {
            assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        })
    })
});
