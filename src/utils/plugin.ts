import {
  isGlobSpecifier,
  createGlobfileManager,
  // @ts-expect-error: forgot to add types
} from "glob-imports";
import path from "pathe";
import type { Plugin } from "rollup";
import { getMonorepoDirpath } from "get-monorepo-root";

export function globImports(): Plugin {
  const watchedGlobs = new Set<string>();
  const { getAbsoluteGlobPattern, getGlobfileContents, getGlobfilePath } =
    createGlobfileManager({
      monorepoDirpath: getMonorepoDirpath(import.meta.url)
    });
  return {
    name: "glob-imports",
    resolveId: {
      order: "pre",
      handler(source: string, importerFilepath: string | undefined) {
        if (importerFilepath === undefined) {
          return null;
        }

        if (isGlobSpecifier(source)) {
          const absoluteGlobPattern = getAbsoluteGlobPattern({
            globfileModuleSpecifier: source,
            importerFilepath,
          });
          if (!watchedGlobs.has(absoluteGlobPattern)) {
            watchedGlobs.add(absoluteGlobPattern);
            this.addWatchFile(absoluteGlobPattern);
          }

          return getGlobfilePath({
            globfileModuleSpecifier: source,
            importerFilepath,
          });
        }
      },
    },
    load(id) {
      if (!path.basename(id).startsWith("__virtual__:")) {
        return null;
      }

      const globfilePath = id;
      const globfileContents = getGlobfileContents({
        globfilePath,
        filepathType: "absolute",
      });

      return globfileContents;
    },
  };
}
