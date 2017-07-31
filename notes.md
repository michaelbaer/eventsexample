# Ziele
* Einstieg in das Thema. Abholen der Teilnehmer.
* Funktionsfaehiger Smart Contract der was sinnvolles tut.

# Langfristige Ziele
* Einblick in die Programmierung bekommen.
* Ablauf eines App-Mit-Smart-Contract-Mob-Programming

# Out of scope
* ist blockchain hier sinnvoll?

# 4 sessions a 25min (programmieren)

# retrospektive
* was war gut was war schlecht
* wie gehts weiter

## Bad

## Good
* learned new things
* have something to do at home

# Notizen

jeder bekommt eigenen QR code (druckt den evtl aus). Am ende scannt der veranstaltert die qrcodes die gekommen sind.

# Erster UseCase

veranstalter erstellt event
interessent meldet sich zu event an

# To discuss

1 Event in einem Contract
x Events in einem Contract?

# 2. 05.04

# Retrospective

## Good
* Focus on one screen
* layman gets insights into programming

## Bad
* took no turns typing
* not enough coding?

## Possible Homework

* leveldb reader von chain zustand (does it work with inmemory chain?) (Axel)
* How does Migration contract in truffle work
* try to hack the events contract
* refund deadline. can't refund after event took place. refunding possibility expires. (Christian)
* support free events
* Refactor event to a struct instead of having mapping inside of mapping
* Find a way to verify participation. Concept? (Jan-Paul)

# 27 Jun

## Expectations

* progress on the project. more programming than usual
* future of the project
* testing

## Review

* focussed
* multiple people typed/used the keyboard.

## Homework

* tests should not be able to depend on each other (split into multiple `contract`)
*     it('organizer can create event, event has non-zero fee', () => { tests two concepts at once
* check out https://truffle-box.github.io/
* after migrate and deploy the tx count is 4. why not 2?
* fix the bug "estimateGas" and explain how it was solved (Axel)
