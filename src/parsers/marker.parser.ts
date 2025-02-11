import { MarkerCustomConfig, ParserInterface } from './parser.interface.js';
import { TranslationCollection } from '../utils/translation.collection.js';
import { getNamedImportAlias, findFunctionCallExpressions, getStringsFromExpression, getAST } from '../utils/ast-helpers.js';
import { SourceFile } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

const MARKER_MODULE_NAME = new RegExp('ngx-translate-extract-marker');
const MARKER_IMPORT_NAME = 'marker';
const NGX_TRANSLATE_MARKER_MODULE_NAME = '@ngx-translate/core';
const NGX_TRANSLATE_MARKER_IMPORT_NAME = '_';

export class MarkerParser implements ParserInterface {
	constructor(private marker?: string, private customConfig?: [MarkerCustomConfig]) {}

	public extract(source: string, filePath: string): TranslationCollection | null {
		const sourceFile = getAST(source, filePath);

		const markerImportName = this.marker || this.getMarkerImportNameFromSource(sourceFile);
		if (!markerImportName && !this.customConfig) {
			return null;
		}

		let collection: TranslationCollection = new TranslationCollection();

		const strings = this.extractKeysFromSourceFile(sourceFile, markerImportName);
		collection = collection.addKeys(strings, source);
		if (this.customConfig) {
			(this.customConfig).forEach((config) => {
				if (filePath.includes(config.filePath)) {
					config.patterns.forEach((patternElement: { pattern: string | RegExp; flags: string }) => {
						const patternRegex = new RegExp(patternElement.pattern, patternElement.flags);
						const replacedSource = source.replace(patternRegex, config.replace);
						const replacedSourceFile = tsquery.ast(replacedSource, filePath);
						const replacedStrings = this.extractKeysFromSourceFile(replacedSourceFile, config.marker || markerImportName);
						collection = collection.addKeys(replacedStrings, source);
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

	private getMarkerImportNameFromSource(sourceFile: SourceFile): string {
		const markerImportName =
			getNamedImportAlias(sourceFile, MARKER_IMPORT_NAME, MARKER_MODULE_NAME) ||
			getNamedImportAlias(sourceFile, NGX_TRANSLATE_MARKER_IMPORT_NAME, NGX_TRANSLATE_MARKER_MODULE_NAME);

		return markerImportName ?? '';
	}
}
