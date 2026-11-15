// Loaded as a blocking script in <head> so the saved theme is applied before
// the first paint. It is a file rather than an inline script so that the
// Content-Security-Policy can forbid inline scripts entirely.
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}

  // The terminal's phosphor colour and CRT effects (see /terminal).
  try {
    var phosphor = localStorage.getItem('phosphor');
    if (phosphor === 'green' || phosphor === 'mono') root.setAttribute('data-phosphor', phosphor);
    if (localStorage.getItem('crt') === 'off') root.setAttribute('data-crt', 'off');
  } catch (e) {}

  // The terminal intro plays once per session and never under reduced motion.
  // Its lines are hidden from the first paint so they do not flash before
  // being typed. The timeout shows them anyway if the main script never runs.
  try {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && !sessionStorage.getItem('intro-done')) {
      root.classList.add('intro-pending');
      setTimeout(function () {
        root.classList.remove('intro-pending');
      }, 4000);
    }
  } catch (e) {}
})();
