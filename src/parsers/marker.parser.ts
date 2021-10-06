import { tsquery } from '@phenomnomnominal/tsquery';

import { MarkerCustomConfig, ParserInterface } from './parser.interface';
import { TranslationCollection } from '../utils/translation.collection';
import { getNamedImportAlias, findFunctionCallExpressions, getStringsFromExpression } from '../utils/ast-helpers';
import { SourceFile } from 'typescript';

const MARKER_MODULE_NAME = '@biesbjerg/ngx-translate-extract-marker';
const MARKER_IMPORT_NAME = 'marker';

export class MarkerParser implements ParserInterface {
	constructor(private marker?: string, private customConfig?: [MarkerCustomConfig]) {}

	public extract(source: string, filePath: string): TranslationCollection | null {
		const sourceFile = tsquery.ast(source, filePath);

		const markerImportName = this.marker || getNamedImportAlias(sourceFile, MARKER_MODULE_NAME, MARKER_IMPORT_NAME);
		if (!markerImportName && !this.customConfig) {
			return null;
		}

		let collection: TranslationCollection = new TranslationCollection();

		const strings = this.extractKeysFromSourceFile(sourceFile, markerImportName);
		collection = collection.addKeys(strings);

		if (this.customConfig) {
			(this.customConfig).forEach((config) => {
				if (filePath.includes(config.filePath)) {
					config.patterns.forEach((patternElement) => {
						const patternRegex = new RegExp(patternElement.pattern, patternElement.flags);
						const replacedSource = source.replace(patternRegex, config.replace);
						const replacedSourceFile = tsquery.ast(replacedSource, filePath);
						const replacedStrings = this.extractKeysFromSourceFile(replacedSourceFile, config.marker || markerImportName);
						collection = collection.addKeys(replacedStrings);
					});
				}
			});
		}

		return collection;
	}

	private extractKeysFromSourceFile(sourceFile: SourceFile, markerImportName: string): string[] {
		let strings: string[] = [];
		const callExpressions = findFunctionCallExpressions(sourceFile, markerImportName);
		callExpressions.forEach((callExpression) => {
			if (markerImportName === '$filter') {
				if (!callExpression.expression) {
					return;
				}
				// @ts-ignore
				if (!callExpression.expression.expression) {
					return;
				}
				// @ts-ignore
				if (!callExpression.expression.expression.escapedText) {
					return;
				}
				// @ts-ignore
				if (callExpression.expression.expression.escapedText !== markerImportName) {
					return;
				}
				// @ts-ignore
				if (!callExpression.expression.arguments || callExpression.expression.arguments.length === 0) {
					return;
				}
				// @ts-ignore
				if (callExpression.expression.arguments[0].text !== 'translate') {
					return;
				}
			} else {
				if (!callExpression.expression) {
					return;
				}
				// @ts-ignore
				if (callExpression.expression.escapedText !== markerImportName) {
					return;
				}
			}

			const [firstArg] = callExpression.arguments;
			if (!firstArg) {
				return;
			}
			strings = strings.concat(getStringsFromExpression(firstArg));
		});
		return strings;
	}
}
