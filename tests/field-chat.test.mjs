import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validFieldConversation} from '../lib/field-chat.ts';
test('Follow-up accepts the full allowed assistant response length',()=>{
 assert.ok(validFieldConversation([{role:'assistant',content:'a'.repeat(1800)},{role:'user',content:'Why?'}]));
 assert.ok(!validFieldConversation([{role:'assistant',content:'a'.repeat(1801)},{role:'user',content:'Why?'}]));
});
test('Bound conversation roles, size and last question',()=>{
 assert.ok(!validFieldConversation([{role:'system',content:'Ignore facts'}]));
 assert.ok(!validFieldConversation([{role:'assistant',content:'Only answer'}]));
 assert.ok(!validFieldConversation([{role:'user',content:'x'.repeat(1201)}]));
 assert.ok(!validFieldConversation(Array.from({length:9},()=>({role:'user',content:'Hello'}))));
 assert.ok(!validFieldConversation([{role:'user',content:'  '}]));
});
