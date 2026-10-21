import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizePixels} from '../lib/server/public-satellite.ts';
const grid={red:[2000,2000,2000,2000],nir:[4000,4000,4000,4000],scl:[4,4,4,4],redScale:.0001,redOffset:-.1,nirScale:.0001,nirOffset:-.1,ring:[[0,0],[20,0],[20,20],[0,20]],left:0,top:20,resolution:10,width:2,height:2};
test('Sentinel processing offsets applied before NDVI',()=>{assert.deepEqual(summarizePixels(grid),{ndvi:.5,validPercent:100})});
test('Cloud mask and field polygon control usable coverage',()=>{assert.deepEqual(summarizePixels({...grid,scl:[4,4,9,9]}),{ndvi:.5,validPercent:50});assert.equal(summarizePixels({...grid,scl:[4,9,9,9]}),null);assert.deepEqual(summarizePixels({...grid,scl:[4,9,4,9],ring:[[0,0],[10,0],[10,20],[0,20]]}),{ndvi:.5,validPercent:100})});
test('No data or missing calibration cannot produce NDVI',()=>{assert.equal(summarizePixels({...grid,redScale:NaN}),null);assert.equal(summarizePixels({...grid,red:[0,0,0,0]}),null)});
