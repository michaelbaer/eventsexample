pragma solidity ^0.4.11;

contract Events {

    address public organizer;

    mapping (uint => Event) public events;

    struct Participant {
      bool registered;
      uint payment;
    }

    struct Event {
      bool exists;
      uint requiredFee;
      uint startOfEvent; // in seconds since the epoch
      uint deadline; // number of days before the event
      mapping (address => Participant) participants;
    }

    function Events() {
        organizer = tx.origin;
    }

    modifier onlyByOrganizer() {
        require(msg.sender == organizer);
        _;
    }

    modifier eventExists(uint eventId) {
        require(events[eventId].exists);
        _;
    }

    function create(uint eventId, uint requiredFee, uint startTime, uint deadline) onlyByOrganizer {
        require(!events[eventId].exists);
        events[eventId] = Event({exists: true, requiredFee: requiredFee, startOfEvent: startTime, deadline: deadline});
    }

    function feeOf(uint eventId) eventExists(eventId) returns (uint) {
        return events[eventId].requiredFee;
    }

    function book(uint eventId) payable eventExists(eventId) {
        Event eventToBook = events[eventId];
        require(eventToBook.requiredFee <= msg.value);
        require(!eventToBook.participants[msg.sender].registered);
        eventToBook.participants[msg.sender].payment = msg.value;
        eventToBook.participants[msg.sender].registered = true;
    }

    function bookingFor(uint eventId, address participant) returns (bool, uint) {
        Participant p = events[eventId].participants[participant];
        return (p.registered, p.payment);
    }

    function cancelAttendance(uint eventId) {
        performRefund(eventId, msg.sender);
    }

    function performRefund(uint eventId, address participant) internal {
        Event eventToRefund = events[eventId];
        require(eventToRefund.participants[participant].registered);
        // refund by cancellation in time
        if (now > eventToRefund.startOfEvent - eventToRefund.deadline * 1 days) throw;
        uint amount = eventToRefund.participants[participant].payment;
        eventToRefund.participants[participant].payment = 0;
        eventToRefund.participants[participant].registered = false;

        participant.transfer(amount);
    }

    function verifyAttendance(uint eventId) {
        performRefund(eventId, msg.sender);
    }
}
