import { TranslationCollection } from '../utils/translation.collection.js';
import { PostProcessorInterface } from './post-processor.interface.js';

export class SortByKeyPostProcessor implements PostProcessorInterface {
	public name: string = 'SortByKey';

	// More information on sort sensitivity: https://tc39.es/ecma402/#sec-collator-comparestrings
	// Passing undefined will be treated as 'variant' by default: https://tc39.es/ecma402/#sec-intl.collator
	public sortSensitivity: 'base' | 'accent' | 'case' | 'variant' | undefined = undefined;

	constructor(sortSensitivity: string | undefined) {
		if (isOfTypeSortSensitivity(sortSensitivity)) {
			this.sortSensitivity = sortSensitivity;
		} else {
			throw new Error(`Unknown sortSensitivity: ${sortSensitivity}`);
		}
	}

	public process(draft: TranslationCollection): TranslationCollection {
		return draft.sort((obj1, obj2) => {
			for (let i = 0; i < obj1.length; i++) {
				const char1 = obj1[i];
				const char2 = obj2[i];
				if (!char2) {
					return 1;
				}
				if (char1 !== char2) {
					if (char1.toLowerCase() === char2.toLowerCase()) {
						return char1 < char2 ? -1 : 1;
					} else {
						return char1.toLowerCase() < char2.toLowerCase() ? -1 : 1;
					}
				}
			}
			return obj1.length < obj2.length ? -1 : 1;
		});
	}
}

function isOfTypeSortSensitivity(keyInput: string | undefined): keyInput is 'base' | 'accent' | 'case' | 'variant' | undefined {
	return ['base', 'accent', 'case', 'variant'].includes(keyInput) || keyInput === undefined;
}
