pragma solidity ^0.4.4;

// TODO: Unbooking by participants can only be done before a certain date
// TODO: Mass unbooking by an organizer to refund all participants who showed up to remove number of messages
// TODO: Deletion of event
// TODO: Send $$$ to organizer
contract Events {
    address public organizer;
    mapping (address => uint) public events;
    mapping (address => mapping (address => uint)) public participants;

    function Events() {
        organizer = tx.origin;
    }




    /// Create a new event instance with a required (minimum)
    /// fee each user must provide to create a booking.
    function create(address eventInstance, uint requiredFee) {
        if (msg.sender != organizer) throw;
        if (events[eventInstance] > 0) throw;
        if (requiredFee == 0) throw;
        events[eventInstance] = requiredFee;
    }

    /// Check if given event exists. Returns the required minimum fee for
    /// the event. If the event does not exist, an exception is thrown
    function exists(address eventInstance) returns (uint) {
        if (events[eventInstance] == 0) throw;
        return events[eventInstance];
    }

    /// Creates a booking for given event for the message's sender.
    /// The message amount must be equal or higher than the event's fee.
    /// See exists(eventInstance) to get the required fee value.
    function book(address eventInstance) payable {
        if (events[eventInstance] == 0) throw;
        if (events[eventInstance] > msg.value) throw;
        if (participants[eventInstance][msg.sender] != 0) throw;
        participants[eventInstance][msg.sender] = msg.value;
    }

    /// Returns the fee payed by the message's sender for the given event.
    /// If the sender does not have a valid booking for the event, 0
    /// is returned
    function amIBooked(address eventInstance) returns (uint) {
        return participants[eventInstance][msg.sender];
    }

    /// Returns the fee payed by the given participant for the given event.
    /// If the participant does not have a valid booking for the event, 0
    /// is returned
    function booked(address eventInstance, address participant) returns (uint) {
        if (msg.sender != organizer) throw;
        return participants[eventInstance][participant];
    }

    /// Removes the sender's booking for given event and refunds the provided
    /// fee. Throws an exception if the sender does not have a valid booking
    /// for the event
    function unbookMe(address eventInstance) {
        if (participants[eventInstance][msg.sender] == 0) throw;
        uint amount = participants[eventInstance][msg.sender];
        participants[eventInstance][msg.sender] = 0;

        if (!msg.sender.send(amount)) {
            participants[eventInstance][msg.sender] = amount;
            throw;
        }
    }

    /// Removes the given participant's booking for given event and refunds the
    /// provided fee. Throws an exception if the sender does not have a valid booking
    /// for the event
    function unbook(address eventInstance, address participant) {
        if (msg.sender != organizer) throw;
        if (participants[eventInstance][participant] == 0) throw;
        uint amount = participants[eventInstance][participant];
        participants[eventInstance][participant] = 0;

        if (!participant.send(amount)) {
            participants[eventInstance][participant] = amount;
            throw;
        }
    }
}
