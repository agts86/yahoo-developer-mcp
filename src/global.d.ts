interface NodeProcessLike {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): void;
}
declare var process: NodeProcessLike;

declare module 'dotenv' {
  interface DotenvExport { config(): void }
  const dotenv: DotenvExport;
  export default dotenv;
}
