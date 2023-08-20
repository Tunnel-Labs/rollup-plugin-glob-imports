import {
	getAbsoluteGlobPattern,
	getGlobfileContents,
	getGlobfilePath,
	isGlobSpecifier
	// @ts-expect-error: forgot to add types
} from 'glob-imports';
import path from 'pathe';
import type { Plugin } from 'rollup';

export function globImports(): Plugin {
	const watchedGlobs = new Set<string>();
	return {
		name: 'glob-imports',
		resolveId: {
			order: 'pre',
			handler(source: string, importerFilePath: string | undefined) {
				if (importerFilePath === undefined) {
					return null;
				}

				if (isGlobSpecifier(source)) {
					const absoluteGlobPattern = getAbsoluteGlobPattern({
						globfileModuleSpecifier: source,
						importerFilePath
					});
					if (!watchedGlobs.has(absoluteGlobPattern)) {
						watchedGlobs.add(absoluteGlobPattern);
						this.addWatchFile(absoluteGlobPattern);
					}

					return getGlobfilePath({
						globfileModuleSpecifier: source,
						importerFilePath
					});
				}
			}
		},
		load(id) {
			if (!path.basename(id).startsWith('__virtual__:')) {
				return null;
			}

			const globfilePath = id;
			const globfileContents = getGlobfileContents({
				globfilePath,
				filepathType: 'absolute'
			});

			return globfileContents;
		}
	};
}
