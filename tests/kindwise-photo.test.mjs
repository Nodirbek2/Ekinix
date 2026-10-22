import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindwiseAnalysis } from '../lib/kindwise-photo.ts';
test('Kindwise response retains names but does not prescribe provider treatments',()=>{
 const a=kindwiseAnalysis({result:{crop:{suggestions:[{name:'Tomato',probability:.9}]},disease:{suggestions:[{name:'Early blight',probability:.8,treatment:'unsafe chemical dose'}]}}},'uz');
 assert.equal(a.possibleCauses[0].cause,'Early blight');
 assert.equal(a.urgency,'inspect_soon');
 assert.ok(!JSON.stringify(a).includes('unsafe chemical'));
});
test('Kindwise rejects missing contracts and invalid probabilities',()=>{
 assert.equal(kindwiseAnalysis({error:'unauthorized'},'uz'),null);
 const a=kindwiseAnalysis({result:{crop:{suggestions:[]},disease:{suggestions:[{name:'bad',probability:2}]}}},'uz');
 assert.equal(a.possibleCauses.length,0);
});

test('Non-plant results cannot expose disease suggestions',()=>{
 const a=kindwiseAnalysis({result:{is_plant:{binary:false},crop:{suggestions:[]},disease:{suggestions:[{name:'late blight',probability:.9}]}}},'uz');
 assert.equal(a.imageQuality,'not_crop'); assert.equal(a.possibleCauses.length,0);
});
