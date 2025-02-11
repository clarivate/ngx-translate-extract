import {TranslationCollection, TranslationInterface} from '../utils/translation.collection.js';
import { PostProcessorInterface } from './post-processor.interface.js';

export class KeyAsDefaultValuePostProcessor implements PostProcessorInterface {
	public name: string = 'KeyAsDefaultValue';

	public process(draft: TranslationCollection): TranslationCollection {
		return draft.map((key: string, val: TranslationInterface): TranslationInterface => val.value === '' ? {value: key.replace(/\[CONTEXT\:.*?\](.*)/gis, '$1'), sourceFiles: (val?.sourceFiles || [])} : val);
	}
}
