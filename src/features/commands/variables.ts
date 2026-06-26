export type VariableContext = {
  now?: Date;
  counter?: number;
  random?: () => number;
};

export function replaceCommandVariables(input: string, context: VariableContext = {}): string {
  const now = context.now ?? new Date();
  const counter = context.counter ?? 0;
  const random = context.random ?? Math.random;

  return input
    .replaceAll("${timestamp}", String(now.getTime()))
    .replaceAll("${counter}", String(counter))
    .replaceAll("${random}", random().toFixed(6));
}
