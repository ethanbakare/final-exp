GET http://localhost:3000/clipperstream/showcase/clipscreencomponents 500 (Internal Server Error)Understand this error
main.js:1486 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
index.js:646 Uncaught ModuleParseError: Module parse failed: Identifier 'clips' has already been declared (154:10)
File was processed with these loaders:
 * ./node_modules/next/dist/compiled/@next/react-refresh-utils/dist/loader.js
 * ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js
You may need an additional loader to handle the result of these loaders.
|     // v2.7.0: Zustand selector for selectedPendingClips (replaces useState)
|     // Subscribe to clips array and activeHttpClipId from Zustand
>     const clips = useClipStore({
|         "ClipMasterScreen.useClipStore[clips]": (state)=>state.clips
|     }["ClipMasterScreen.useClipStore[clips]"]);
    at <unknown> (File was processed with these loaders:)
    at handleParseError (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/webpack/bundle5.js:29:410378)
    at <unknown> (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/webpack/bundle5.js:29:411994)
    at processResult (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/webpack/bundle5.js:29:407859)
    at <unknown> (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/webpack/bundle5.js:29:408881)
    at <unknown> (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:8727)
    at iterateNormalLoaders (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5565)
    at iterateNormalLoaders (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5650)
    at <unknown> (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5879)
    at r.callback (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:4039)
    at Object.ReactRefreshLoader (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/@next/react-refresh-utils/dist/loader.js:14:10)
    at LOADER_EXECUTION (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:4134)
    at runSyncOrAsync (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:4145)
    at iterateNormalLoaders (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5782)
    at <unknown> (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5142)
    at r.callback (/Users/ethan/Documents/projects/final-exp/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:4039)
getServerError @ node-stack-frames.js:41
eval @ index.js:646
setTimeout
hydrate @ index.js:624
await in hydrate
pageBootstrap @ page-bootstrap.js:28
eval @ next-dev.js:24
Promise.then
eval @ next-dev.js:22
(pages-dir-browser)/./node_modules/next/dist/client/next-dev.js @ main.js:303
options.factory @ webpack.js:1
__webpack_require__ @ webpack.js:1
__webpack_exec__ @ main.js:1601
(anonymous) @ main.js:1602
webpackJsonpCallback @ webpack.js:1
(anonymous) @ main.js:9Understand this error
websocket.js:46 [HMR] connected
pages-dev-overlay-setup.js:77 ./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
Module parse failed: Identifier 'clips' has already been declared (150:10)
|     // v2.7.0: Zustand selector for selectedPendingClips (replaces useState)
|     // Subscribe to clips array and activeHttpClipId from Zustand
>     const clips = useClipStore({
|         "ClipMasterScreen.useClipStore[clips]": (state)=>state.clips
|     }["ClipMasterScreen.useClipStore[clips]"]);

_______________

Build Error


Module parse failed: Identifier 'clips' has already been declared (150:10)

./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx

Module parse failed: Identifier 'clips' has already been declared (150:10)
|     // v2.7.0: Zustand selector for selectedPendingClips (replaces useState)
|     // Subscribe to clips array and activeHttpClipId from Zustand
>     const clips = useClipStore({
|         "ClipMasterScreen.useClipStore[clips]": (state)=>state.clips
|     }["ClipMasterScreen.useClipStore[clips]"]);