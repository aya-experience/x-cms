/* eslint no-use-before-define: 0 */

import { isString, fromPairs } from 'lodash';
import {
	GraphQLObjectType,
	GraphQLInputObjectType,
	GraphQLID,
	GraphQLList,
	GraphQLString
} from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import winston from 'winston';

import { writeEntry } from '../gitasdb/write';
import { deleteEntry } from '../gitasdb/delete';
import { readModel, writeModel } from '../gitasdb/model';

const logger = winston.loggers.get('GraphQL');

export const LinkDataInputType = new GraphQLInputObjectType({
	name: 'LinkDataInput',
	fields: () => ({
		type: { type: GraphQLString },
		id: { type: GraphQLID }
	})
});

export const LinkInputType = new GraphQLInputObjectType({
	name: 'LinkInput',
	fields: () => ({
		_role_: { type: GraphQLString },
		link: { type: LinkDataInputType }
	})
});

export const LinksInputType = new GraphQLInputObjectType({
	name: 'LinksInput',
	fields: () => ({
		_role_: { type: GraphQLString },
		links: { type: new GraphQLList(LinkDataInputType) }
	})
});

export const MapInputType = new GraphQLInputObjectType({
	name: 'MapInput',
	fields: () => ({
		_role_: { type: GraphQLString },
		map: { type: GraphQLJSON }
	})
});

export const FieldType = new GraphQLInputObjectType({
	name: 'FieldType',
	fields: () => ({
		name: { type: GraphQLString },
		type: { type: new GraphQLList(GraphQLString) }
	})
});

export const SchemaType = new GraphQLInputObjectType({
	name: 'SchemaType',
	fields: () => ({
		name: { type: GraphQLString },
		fields: { type: new GraphQLList(FieldType) }
	})
});

function buildSchemaInput() {
	return new GraphQLInputObjectType({
		name: 'SchemaInput',
		fields: () => ({
			types: { type: new GraphQLList(SchemaType) }
		})
	});
}

const buildInput = field => {
	if (isString(field.type)) {
		field.type = [field.type];
	}
	switch (field.type[0]) {
		case 'link':
			return { type: LinkInputType };
		case 'links':
			return { type: LinksInputType };
		case 'map':
			return { type: MapInputType };
		case 'json':
			return { type: GraphQLJSON };
		default:
			return { type: GraphQLString };
	}
};

async function buildInputs() {
	const InputType = {};
	const model = await readModel();
	for (const structure of model) {
		InputType[structure.name] = new GraphQLInputObjectType({
			name: `${structure.name}Input`,
			fields: () => {
				const resultFields = {
					_id_: { type: GraphQLID },
					_newId_: { type: GraphQLID }
				};

				if (structure.type) {
					resultFields._value_ = buildInput(structure);
				} else {
					Object.assign(
						resultFields,
						fromPairs(structure.fields.map(field => [field.name, buildInput(field)]))
					);
				}
				return resultFields;
			}
		});
	}
	InputType.Schema = buildSchemaInput();
	return InputType;
}

export const buildDeleteObject = key =>
	new GraphQLObjectType({
		name: `_DeleteObject${key}_`,
		fields: {
			_id_: { type: GraphQLID },
			message: { type: GraphQLString }
		}
	});

export async function buildMutation(ObjectTypes) {
	const InputType = await buildInputs();
	const MutationObjects = {};
	const mutation = new GraphQLObjectType({
		name: 'Mutation',
		fields: () => {
			Object.keys(InputType).forEach(key => {
				const inputs = {};
				inputs[key.toLowerCase()] = { type: InputType[key] };
				MutationObjects[`edit${key}`] = {
					type: ObjectTypes[key],
					args: { ...inputs },
					resolve: async (root, params) => {
						logger.debug('mutation', params);
						try {
							if (key === 'Schema') {
								return await writeModel(params);
							}
							return await writeEntry(key, params[key.toLowerCase()]);
						} catch (error) {
							throw error;
						}
					}
				};
				MutationObjects[`delete${key}`] = {
					type: buildDeleteObject(key),
					args: { ...inputs },
					resolve: async (root, params) => {
						logger.debug(`delete mutation ${params}`);
						try {
							return await deleteEntry(key, params[key.toLowerCase()]);
						} catch (error) {
							throw error;
						}
					}
				};
			});
			return MutationObjects;
		}
	});
	return mutation;
}
