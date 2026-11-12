/*
 * SpentIQ event counter adapter. Counts THAT something happened (e.g. "checksistence/result"), never WHAT anyone typed.
 * Sends nothing until a cookieless counter (GoatCounter or Umami) is on the page. Events that happen before the counter
 * has loaded are held and sent once it's ready (checked for up to 15 seconds), so early results aren't lost.
 * Each event is counted at most once per page view.
 */
(function () {
  const seen = new Set(), queue = [];
  function counter() {
    if (window.goatcounter && window.goatcounter.count) return (n) => window.goatcounter.count({ path: "event/" + n, title: n, event: true });
    if (window.umami && window.umami.track) return (n) => window.umami.track(n);
    return null;
  }
  function flush() {
    const send = counter();
    if (!send) return false;
    while (queue.length) { try { send(queue.shift()); } catch (e) { /* counting must never break the page */ } }
    return true;
  }
  window.spentiqTrack = function (name) {
    if (!name || seen.has(name)) return;
    seen.add(name);
    queue.push(name);
    flush();
  };
  let tries = 0;
  const timer = setInterval(() => { if (flush() || ++tries > 30) clearInterval(timer); }, 500);
})();
