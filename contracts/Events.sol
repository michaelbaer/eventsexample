pragma solidity ^0.4.11;

// TODO: Mass unbooking by an organizer to refund all participants who showed up to remove number of messages
// TODO: Deletion of event
// TODO: Send $$$ to organizer
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
      bytes32 hashedSecret; // keccak256(secret) to be used for attendance verification
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

    /// Create a new event instance with a required (minimum)
    /// fee each user must provide to create a booking.
    function create(uint eventId, uint requiredFee, uint startTime, uint deadline, bytes32 hashedSecret) onlyByOrganizer {
        require(!events[eventId].exists);
        events[eventId] = Event({exists: true, requiredFee: requiredFee, startOfEvent: startTime, deadline: deadline, hashedSecret: hashedSecret});
    }

    function feeOf(uint eventId) eventExists(eventId) returns (uint) {
        return events[eventId].requiredFee;
    }

    /// Creates a booking for given event for the message's sender.
    /// The message amount must be equal or higher than the event's fee.
    /// See exists(eventInstance) to get the required fee value.
    function book(uint eventId) payable eventExists(eventId) {
        Event eventToBook = events[eventId];
        require(eventToBook.requiredFee <= msg.value);
        require(!eventToBook.participants[msg.sender].registered);
        eventToBook.participants[msg.sender].payment = msg.value;
        eventToBook.participants[msg.sender].registered = true;
    }

    /// Returns booking information (subscription status & payment) for any participant
    function bookingFor(uint eventId, address participant) returns (bool, uint) {
        Participant p = events[eventId].participants[participant];
        return (p.registered, p.payment);
    }

    function cancelAttendance(uint eventId) {
        performRefund(eventId, msg.sender, "");
    }

    function performRefund(uint eventId, address participant, string secret) internal {
        Event eventToRefund = events[eventId];
        require(eventToRefund.participants[participant].registered);
        // refund by cancellation in time
        if (bytes(secret).length == 0 && now > eventToRefund.startOfEvent - eventToRefund.deadline * 1 days) throw;
        // refund by knowing the event's secret
        if (bytes(secret).length > 0 && eventToRefund.hashedSecret != keccak256(secret)) throw;
        uint amount = eventToRefund.participants[participant].payment;
        eventToRefund.participants[participant].payment = 0;
        eventToRefund.participants[participant].registered = false;

        participant.transfer(amount);
    }

    function verifyAttendance(uint eventId, string secret) {
        performRefund(eventId, msg.sender, secret);
    }
}
