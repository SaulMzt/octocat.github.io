import test from "node:test";
import assert from "node:assert/strict";
import { racePlan } from "../js/game.js";
import { participantCount } from "../js/race-settings.js";

const entries = count => Array.from({ length: count }, (_, index) => ({ id: `person-${index}`, name: `Participante ${index}`, enabled: true }));

test("the selected participant is represented at every supported population size", () => {
  for (const total of [1, 5, 20, 50, 100]) {
    for (const limit of [4, 6]) {
      const people = entries(total);
      const spin = { winnerId: people[total - 1].id, visualSeed: 123, total };
      const plan = racePlan(people, spin, limit);
      assert.equal(plan.total, total);
      assert.ok(plan.pack.some(person => person.id === spin.winnerId));
      assert.ok(!plan.catches.some(event => event.id === spin.winnerId));
      assert.ok(plan.pack.length <= limit);
      assert.equal(new Set(plan.pack.map(person => person.id)).size, plan.pack.length);
    }
  }
});

test("a winner does not occupy a fixed starting position", () => {
  const positions = new Set();
  for (let seed = 1; seed <= 120; seed++) {
    const plan = racePlan(entries(100), { winnerId: "person-99", visualSeed: seed, total: 100 }, 6);
    positions.add(plan.pack.findIndex(person => person.id === "person-99"));
  }
  assert.equal(positions.size, 6);
});

test("clients receiving the same spin render the same order and catch sequence", () => {
  const people = entries(50), spin = { winnerId: "person-27", visualSeed: 948131, total: 50 };
  assert.deepEqual(racePlan(people, spin), racePlan(structuredClone(people), structuredClone(spin)));
});

test("retired and disabled participants cannot reappear in the next race", () => {
  const people = entries(5);
  people[0].retired = true;
  people[1].enabled = false;
  const plan = racePlan(people, { winnerId: "person-3", visualSeed: 44 });
  assert.equal(plan.total, 3);
  assert.ok(plan.pack.every(person => !person.retired && person.enabled));
});

test("the previous winner may still be displayed for the result, even after retirement", () => {
  const people = entries(1);
  people[0].enabled = false; people[0].retired = true;
  assert.equal(racePlan(people, { winnerId: people[0].id }).pack.length, 1);
  assert.deepEqual(racePlan(people).pack, []);
  assert.equal(racePlan([]).total, 0);
});

test("the waiting scene restores a group without previous winners", () => {
  const people = entries(20);
  people[3].retired = true;
  people[8].retired = true;
  for (const limit of [4, 6]) {
    const plan = racePlan(people, {}, limit);
    assert.equal(plan.pack.length, limit);
    assert.equal(plan.total, 18);
    assert.ok(plan.pack.every(person => !person.retired));
  }
});

test("participant limits clamp to availability and default to everyone", () => {
  for (const [available, limit, expected] of [[8,3,3],[2,10,2],[0,4,0],[8,0,8],[8,undefined,8],[8,-1,8],[8,1.5,8]]) {
    assert.equal(participantCount(available,limit),expected);
  }
  const plan = racePlan(entries(20), { participantLimit: 3 });
  assert.equal(plan.total,3);
  assert.equal(plan.pack.length,3);
});

test("the shared cohort determines the race, even when the live list changes", () => {
  const participants = entries(3).map(({id,name})=>({id,name}));
  const spin = { participants, winnerId: participants[1].id, total:3, visualSeed:22 };
  const plan = racePlan([],spin);
  assert.equal(plan.total,3);
  assert.equal(plan.pack.length,3);
  assert.deepEqual(new Set(plan.pack.map(p=>p.id)),new Set(participants.map(p=>p.id)));
  assert.ok(!plan.catches.some(p=>p.id===spin.winnerId));
});
