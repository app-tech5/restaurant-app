const fiberHelpers = `
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && t.type) {
      var inner = t.type;
      return inner.displayName || inner.name || 'Memo';
    }
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }

  function walkAll(fiber, depth, visit) {
    if (!fiber || depth > 700) return;
    visit(fiber, depth);
    walkAll(fiber.child, depth + 1, visit);
    walkAll(fiber.sibling, depth, visit);
  }

  function getRoots(hook) {
    var roots = [];
    hook.renderers.forEach(function(_, rendererID) {
      hook.getFiberRoots(rendererID).forEach(function(root) {
        roots.push(root.current || root);
      });
    });
    return roots;
  }

  function collectNavigations(hook) {
    var candidates = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (props.navigation && typeof props.navigation.navigate === 'function') {
          candidates.push(props.navigation);
        }
      });
    });
    return candidates;
  }

  function findNavWithRoute(hook, routeName) {
    var candidates = collectNavigations(hook);
    for (var i = 0; i < candidates.length; i++) {
      try {
        var names = candidates[i].getState && candidates[i].getState().routeNames;
        if (names && names.indexOf(routeName) >= 0) return candidates[i];
      } catch (e) {}
    }
    for (var j = 0; j < candidates.length; j++) {
      var n = candidates[j];
      for (var d = 0; d < 14 && n; d++) {
        try {
          var rn = n.getState && n.getState().routeNames;
          if (rn && rn.indexOf(routeName) >= 0) return n;
        } catch (e2) {}
        n = n.getParent && n.getParent();
      }
    }
    return null;
  }
`;

function buildNavigateDrawerExpression(screenName) {
  return `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });
  var drawer = findNavWithRoute(hook, 'Dashboard') || findNavWithRoute(hook, 'DrawerNavigator');
  if (!drawer) return JSON.stringify({ error: 'drawer introuvable' });
  try {
    drawer.navigate(${JSON.stringify(screenName)});
    return JSON.stringify({ ok: true, screen: ${JSON.stringify(screenName)} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;
}

module.exports = {
  fiberHelpers,
  buildNavigateDrawerExpression,
};
