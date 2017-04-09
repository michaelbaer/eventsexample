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
            return eventContract.amIBooked.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(paid => {
             assert.equal(true, paid);
        }).then(() => {
            return eventContract.myPayment.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(payment => {
            assert.equal(payment.valueOf(), REQUIRED_FEE);
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
            return eventContract.booked.call(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(bookingExists => {
            assert.equal(true, bookingExists);
        }).then(() => {
            return eventContract.payment.call(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(payment => {
            assert.equal(payment, REQUIRED_FEE);
        })
    })

    it('other users can not see participants', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.booked.call(EVENT_ADDRESS, PARTICIPANT, {
                from: PARTICIPANT2
            });
        }).then(function() {
            assert(false, "booked() was supposed to throw but did not");
        }).catch(function(error) {
            if (error.toString().indexOf("invalid JUMP") == -1) {
                assert(false, error.toString());
            }
        }).then(() => {
            return eventContract.payment.call(EVENT_ADDRESS, PARTICIPANT, {
                from: PARTICIPANT2
            });
        }).then(function () {
            assert(false, "payment() was supposed to throw but did not");
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
            return eventContract.amIBooked.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(bookingExists => {
            assert.equal(false, bookingExists);
        }).then(() => {
            return eventContract.myPayment.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(payment => {
            assert.equal(0, payment);
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
            return eventContract.amIBooked.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(bookingExists => {
            assert.equal(false, bookingExists);
        }).then(() => {
            return eventContract.myPayment.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(payment => {
            assert.equal(0, payment);
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
