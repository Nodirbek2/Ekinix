import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planningWindows} from '../lib/irrigation-context.ts';
const base=Date.parse('2026-10-23T00:00:00Z'); // 05:00 Uzbekistan
const hour=(offset,extra={})=>({time:base+offset*3600000,temperature:20,rain:0,probability:10,wind:5,...extra});
test('Plans only contiguous future weather windows and one per local day',()=>{
 const slots=planningWindows([hour(0),hour(1),hour(2),hour(24),hour(25)],'drip',base-1000);
 assert.equal(slots.length,2);assert.equal(slots[0].end-slots[0].start,7200000);
 assert.ok(slots.every(s=>s.start>base-1000));
});
test('Unknown, windy, wet, cold or past weather cannot create a window',()=>{
 for(const extra of [{temperature:null},{rain:1},{probability:80},{wind:40},{temperature:0}]) assert.deepEqual(planningWindows([hour(0,extra),hour(1)],'drip',base-1000),[]);
 assert.deepEqual(planningWindows([hour(0),hour(2)],'drip',base-1000),[]);
 assert.deepEqual(planningWindows([hour(0),hour(1)],'drip',base+7200000),[]);
});
test('Sprinkler windows have stricter wind selection and input order is not mutated',()=>{
 const hours=[hour(1,{wind:15}),hour(0,{wind:15})];
 assert.equal(planningWindows(hours,'drip',base-1000).length,1);
 assert.equal(planningWindows(hours,'sprinkler',base-1000).length,0);
 assert.equal(hours[0].time,base+3600000);
});
