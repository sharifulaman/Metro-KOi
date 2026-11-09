/**
 * JS run inside the simulation page: choose From/To (station indices 0–15,
 * Uttara North → Motijheel, same order as stations.json) and start the trip
 * by firing the page's own `change` handler. Retries until the page is built.
 */
export function tripScript(fromIdx: number, toIdx: number): string {
  const a = Math.max(0, Math.min(15, Math.round(fromIdx)));
  const b = Math.max(0, Math.min(15, Math.round(toIdx)));
  return `(function(){var n=0;function go(){var a=document.getElementById('selA'),b=document.getElementById('selB');
if(!a||!b||!a.options.length){if(++n<100)setTimeout(go,100);return;}
a.value='${a}';b.value='${b}';b.dispatchEvent(new Event('change'));}
if(document.readyState==='complete')go();else window.addEventListener('load',go);})();true;`;
}

export interface SimulationViewProps {
  /** start station index (0 = Uttara North … 15 = Motijheel) */
  fromIdx: number;
  /** destination station index */
  toIdx: number;
  /** shown if the page cannot load */
  errorText: string;
  testID?: string;
}
