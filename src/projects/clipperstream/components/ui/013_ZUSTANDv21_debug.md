CONSOLE

pages-dev-overlay-setup.js:77 The result of getServerSnapshot should be cached to avoid an infinite loop
nextJsHandleConsoleError	@	pages-dev-overlay-setup.js:77

pages-dev-overlay-setup.js:77 Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at getRootForUpdatedFiber (react-dom-client.development.js:3802:11)
    at enqueueConcurrentRenderForLane (react-dom-client.development.js:3768:14)
    at forceStoreRerender (react-dom-client.development.js:6349:18)
    at updateStoreInstance (react-dom-client.development.js:6331:39)
    at react-stack-bottom-frame (react-dom-client.development.js:22510:20)
    at runWithFiberInDEV (react-dom-client.development.js:544:16)
    at commitHookEffectListMount (react-dom-client.development.js:10759:29)
    at commitHookPassiveMountEffects (react-dom-client.development.js:10879:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12654:13)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12756:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)
    at commitPassiveMountOnFiber (react-dom-client.development.js:12647:11)
    at recursivelyTraversePassiveMountEffects (react-dom-client.development.js:12628:11)

The above error occurred in the <ClipMasterScreen> component.

React will try to recreate this component tree from scratch using the error boundary you provided, PagesDevOverlayErrorBoundary.
__________________
Runtime Error


Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.

Call Stack
50

Hide 50 ignore-listed frame(s)
getRootForUpdatedFiber
node_modules/react-dom/cjs/react-dom-client.development.js (3801:1)
enqueueConcurrentRenderForLane
node_modules/react-dom/cjs/react-dom-client.development.js (3767:1)
forceStoreRerender
node_modules/react-dom/cjs/react-dom-client.development.js (6348:1)
updateStoreInstance
node_modules/react-dom/cjs/react-dom-client.development.js (6330:1)
react-stack-bottom-frame
node_modules/react-dom/cjs/react-dom-client.development.js (22509:1)
runWithFiberInDEV
node_modules/react-dom/cjs/react-dom-client.development.js (543:1)
commitHookEffectListMount
node_modules/react-dom/cjs/react-dom-client.development.js (10758:1)
commitHookPassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (10878:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12653:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12755:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)
commitPassiveMountOnFiber
node_modules/react-dom/cjs/react-dom-client.development.js (12646:1)
recursivelyTraversePassiveMountEffects
node_modules/react-dom/cjs/react-dom-client.development.js (12627:1)