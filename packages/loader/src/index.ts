// @ts-ignore
import { resolve as tsNodeResolve } from "ts-node/esm";
import { createMatchPathAsync, loadConfig } from "tsconfig-paths";

// @ts-ignore
export { load } from "ts-node/esm";

type ResolveContext = {
  conditions: string[];
  importAssertions: Record<string, unknown>;
  parentURL?: string | undefined;
}

type ResolveResult = {
  format: string | null | undefined;
  url: string;
}

type Resolve = (specifier: string, context: ResolveContext, defaultResolve: Resolve) => Promise<ResolveResult>;

const coreModules = new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  "punycode",
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib",
]);

const configLoaderResult = loadConfig(process.cwd());

const matchPath = configLoaderResult.resultType === "success" && createMatchPathAsync(
  configLoaderResult.absoluteBaseUrl,
  configLoaderResult.paths,
  configLoaderResult.mainFields,
  configLoaderResult.addMatchAll,
);

export async function resolve(specifier: string, context: ResolveContext, defaultResolve: Resolve): Promise<ResolveResult> {
  // https://github.com/dividab/tsconfig-paths/blob/f42003925f4d56458d41daed80013c8ad23c88ea/src/register.ts#L107
  if (matchPath) {
    const isCoreModule = coreModules.has(specifier);
    if (!isCoreModule) {
      const found = await new Promise<string | undefined>((resolve, reject) => {
        matchPath(specifier.replace(/\.js$/, ".ts"), void 0, void 0, [], (err, path) => {
          if (err) {
            return void reject(err);
          }
          return resolve(path);
        });
      });
      if (found) {
        return tsNodeResolve(found, context, defaultResolve);
      }
    }
  }

  return tsNodeResolve(specifier, context, defaultResolve);
}
