import { test } from 'node:test';
import assert from 'node:assert/strict';
import {responseError,monitoringError} from '../lib/api-errors.ts';
test('Non-JSON gateway failures retain actionable HTTP categories',()=>{
 assert.equal(responseError(504,null),'request_timeout');
 assert.equal(responseError(401,null),'session_expired');
 assert.equal(responseError(429,'<html>'),'rate_limited');
 assert.equal(responseError(502,{error:'<html>private internal detail</html>'}),'service_unavailable');
 assert.equal(responseError(503,{error:'server_not_configured'}),'server_not_configured');
});
test('Monitoring failures keep session/limit/network reasons and contextualize unknowns',()=>{
 for(const code of ['session_expired','rate_limited','network_error','request_timeout']) assert.equal(monitoringError(new Error(code)),code);
 assert.equal(monitoringError(new Error('request_failed')),'monitoring_unavailable');
 assert.equal(monitoringError('unknown'),'monitoring_unavailable');
});
