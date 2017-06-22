import path from 'path';

import _ from 'lodash';
import fs from 'fs-promise';
import winston from 'winston';

import { create } from '../nodegit/wrapper';
import conf from '../conf';

const logger = winston.loggers.get('GitAsDb');

export async function deleteObject(type, data) {
	try {
		const repositoryPath = path.resolve(conf.work.content, conf.content.branch);
		const repository = await create(repositoryPath);
		const id = data.__id__;
		const objectPath = path.resolve(repositoryPath, type, id);
		if (await fs.existsSync(objectPath)) {
			console.log('ici');
			await fs.remove(objectPath);
			console.log(type);
			const oid = await repository.add(path.join(type, id));
			await repository.commit(oid);
			await repository.push(conf.content.branch);
		}
		return { __id__: id, message: `${type} ${id} was successfully deleted` };
	} catch (error) {
		logger.error(`Gitasdb delete error ${JSON.stringify(error)}`);
		throw error;
	}
}