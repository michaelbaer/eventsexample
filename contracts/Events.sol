pragma solidity ^0.4.4;

// TODO: Unbooking by participants can only be done before a certain date
// TODO: Mass unbooking by an organizer to refund all participants who showed up to remove number of messages
// TODO: Deletion of event
// TODO: Send $$$ to organizer
contract Events {

    address public organizer;

    mapping (address => Event) public events;

    struct Participant {
      bool registered;
      uint payment;
    }

    struct Event {
      bool exists;
      uint requiredFee;
      // uint deadline;
      mapping (address => Participant) participants;
    }

    function Events() {
        organizer = tx.origin;
    }

    modifier onlyByOrganizer() {
        if (msg.sender != organizer) throw;
        _;
    }

    modifier eventExists(address eventInstance) {
        if (!events[eventInstance].exists) throw;
        _;
    }

    /// Create a new event instance with a required (minimum)
    /// fee each user must provide to create a booking.
    function create(address eventInstance, uint requiredFee) onlyByOrganizer {
        if (events[eventInstance].exists) throw;
        events[eventInstance] = Event({exists: true, requiredFee: requiredFee});
    }

    // Returns true if an event with a given instance exists
    function exists(address eventInstance) returns (bool) {
        return events[eventInstance].exists;
    }

    // Returns fee of an event
    function fee(address eventInstance) eventExists(eventInstance) returns (uint) {
        return events[eventInstance].requiredFee;
    }

    /// Creates a booking for given event for the message's sender.
    /// The message amount must be equal or higher than the event's fee.
    /// See exists(eventInstance) to get the required fee value.
    function book(address eventInstance) payable eventExists(eventInstance) {
        Event eventToBook = events[eventInstance];
        if (eventToBook.requiredFee > msg.value) throw;
        if (eventToBook.participants[msg.sender].registered) throw;
        eventToBook.participants[msg.sender].payment = msg.value;
        eventToBook.participants[msg.sender].registered = true;
    }

    /// Returns the sender's booking information (subscription status & payment)
    function myBooking(address eventInstance) returns (bool, uint) {
        Participant p = events[eventInstance].participants[msg.sender];
        return (p.registered, p.payment);
    }

    /// Returns booking information (subscription status & payment) for any participant
    function anyBooking(address eventInstance, address participant) onlyByOrganizer returns (bool, uint) {
        Participant p = events[eventInstance].participants[participant];
        return (p.registered, p.payment);
    }

    /// Removes the sender's booking for given event and refunds the provided
    /// fee. Throws an exception if the sender does not have a valid booking
    /// for the event
    function unbookMe(address eventInstance) {
        Event eventToUnbook = events[eventInstance];
        if (!eventToUnbook.participants[msg.sender].registered) throw;
        uint amount = eventToUnbook.participants[msg.sender].payment;
        eventToUnbook.participants[msg.sender].payment = 0;
        eventToUnbook.participants[msg.sender].registered = false;

        if (!msg.sender.send(amount)) {
            throw;
        }
    }

    /// Removes the given participant's booking for given event and refunds the
    /// provided fee. Throws an exception if the sender does not have a valid booking
    /// for the event
    function refund(address eventInstance, address participant) onlyByOrganizer {
        Event eventToRefund = events[eventInstance];
        if (!eventToRefund.participants[participant].registered) throw;
        uint amount = eventToRefund.participants[participant].payment;
        eventToRefund.participants[participant].payment = 0;
        eventToRefund.participants[participant].registered = false;

        if (!participant.send(amount)) {
            throw;
        }
    }
}
