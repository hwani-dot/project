/**
 * OPENAI_API_KEY가 없거나 짧을 때 데모 모드로 동작
 */

let demoModeLogged = false;

export function isDemoMode(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !key || typeof key !== "string" || key.length < 10;
}

export function logDemoModeOnce(): void {
  if (!demoModeLogged) {
    demoModeLogged = true;
    console.log("DEMO MODE: using fallback data");
  }
}
