var Events = artifacts.require("./Events.sol");

contract('Events', function(accounts) {
    let ORGANIZER = accounts[0];
    let PARTICIPANT = accounts[1];
    let PARTICIPANT2 = accounts[2];
    let EVENT_ADDRESS = accounts[3];
    let REQUIRED_FEE = 10;

    it('sets creator as organizer', () => {
        return Events.deployed().then(eventContract => {
            return eventContract.organizer.call();
        }).then(organizer => {
            assert.equal(organizer, ORGANIZER);
        })
    })

    it('can not create events without required fee', () => {
            let eventContract;
            return Events.deployed().then(contract => {
                eventContract = contract;
                return eventContract.create(EVENT_ADDRESS, 0, {
                    from: ORGANIZER
                });
            }).then(function() {
                assert(false, "create() was supposed to throw but did not");
            }).catch(function(error) {
                if (error.toString().indexOf("invalid JUMP") == -1) {
                    assert(false, error.toString());
                }
            });
        })

    it('allows organizer to create events', () => {
        let eventContract;
        return Events.deployed().then(contract => {
            eventContract = contract;
            return eventContract.create(EVENT_ADDRESS, REQUIRED_FEE, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.exists.call(EVENT_ADDRESS);
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

    it('allows users to participate', () => {
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
        }).then(payed => {
            assert.equal(payed.valueOf(), REQUIRED_FEE);
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
        }).then(payed => {
            assert.equal(payed.valueOf(), REQUIRED_FEE);
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
        });
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
        }).then(payed => {
            assert.equal(payed.valueOf(), 0);

            /* TODO: Check if PARTICIPANT's balance is correclty */
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
            return eventContract.unbook(EVENT_ADDRESS, PARTICIPANT, {
                from: ORGANIZER
            });
        }).then(() => {
            return eventContract.amIBooked.call(EVENT_ADDRESS, {
                from: PARTICIPANT
            });
        }).then(payed => {
            assert.equal(payed.valueOf(), 0);

            /* TODO: Check if PARTICIPANT's balance is correclty */
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
            return eventContract.unbook.call(EVENT_ADDRESS, PARTICIPANT, {
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
});