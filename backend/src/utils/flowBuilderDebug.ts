/**
 * Logs detalhados do FlowBuilder (loops, destinos, welcome).
 * Ative com DEBUG_FLOWBUILDER=true ou DEBUG_FLOWBUILDER=1 no .env
 */
export function isFlowBuilderDebugEnabled(): boolean {
  const v = process.env.DEBUG_FLOWBUILDER;
  return v === "true" || v === "1";
}
