pragma solidity ^0.4.4;

contract Events {
  address public organizer;
  address public participant;
  address[2] public participants;

  function Events() {
    organizer = tx.origin;
  }

  function book() {
    participant = tx.origin;
    participants[1] = tx.origin;
  }


}
