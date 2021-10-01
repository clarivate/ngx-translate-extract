import { TranslationCollection } from '../utils/translation.collection';
import { PostProcessorInterface } from './post-processor.interface';

export class SortByKeyPostProcessor implements PostProcessorInterface {
	public name: string = 'SortByKey';

	public process(draft: TranslationCollection, extracted: TranslationCollection, existing: TranslationCollection): TranslationCollection {
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
