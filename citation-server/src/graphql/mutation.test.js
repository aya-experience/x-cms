import test from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let readModel;

let mutation;

test.beforeEach(() => {
	readModel = sinon.stub().returns(
		Promise.resolve([
			{
				name: 'Type',
				fields: [
					{
						name: 'field',
						type: ['text']
					}
				]
			}
		])
	);
	mutation = proxyquire('./mutation', {
		'./model': { readModel },
		winston: { loggers: { get: () => ({ debug: () => {}, error: () => {} }) } }
	});
});

test('buildDeleteObject should return a graphQL Object with the given key in the name', t => {
	const type = 'Type';
	const result = mutation.buildDeleteObject(type);
	t.is(result.name, '__DeleteObjectType__');
});

test('buildDeleteObject should return a graphQL Object with an __id__ as a field', t => {
	const type = 'Type';
	const result = mutation.buildDeleteObject(type);
	t.true(Object.keys(result._typeConfig.fields).includes('__id__'));
});

test('buildDeleteObject should return a graphQL Object with a message as a field', t => {
	const type = 'Type';
	const result = mutation.buildDeleteObject(type);
	t.true(Object.keys(result._typeConfig.fields).includes('message'));
});

test('buildMutation should return a graphQL Object with deleteType key', async t => {
	const ObjectTypes = { Type: {} };
	const result = await mutation.buildMutation(ObjectTypes);
	t.true(Object.keys(result._typeConfig.fields()).includes('deleteType'));
});

test('buildMutation should return a graphQL Object with editType key', async t => {
	const ObjectTypes = { Type: {} };
	const result = await mutation.buildMutation(ObjectTypes);
	t.true(Object.keys(result._typeConfig.fields()).includes('editType'));
});