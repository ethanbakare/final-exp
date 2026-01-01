▲ Next.js 15.5.7
   - Local:        http://localhost:3000
   - Network:      http://127.57.134.204:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 5.4s
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 ✓ Compiled /clipperstream/showcase/clipscreencomponents in 435ms (378 modules)
 GET /clipperstream/showcase/clipscreencomponents 200 in 725ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 793ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 231ms
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
^[[1;2B^[[1;2B^C
~/Documents/projects/final-exp (feature/offline-auto-retry-v2.7.0)  > npm run dev

> final-exp@0.1.0 dev
> next dev

 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /Users/ethan/Documents/projects/package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * /Users/ethan/Documents/projects/final-exp/package-lock.json

   ▲ Next.js 15.5.7
   - Local:        http://localhost:3000
   - Network:      http://127.57.134.204:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 5.5s
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 ○ Compiling /_not-found ...
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
 GET /clipperstream/showcase/clipscreencomponents 500 in 1318ms
 GET /clipperstream/showcase/clipscreencomponents 500 in 1308ms

 ⨯ ./src/projects/clipperstream/services/audioStorage.ts
Error:   × await isn't allowed in non-async function
     ╭─[/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/audioStorage.ts:169:1]
 166 │       // ========================================
 167 │       // DIAGNOSTIC LOGGING: Verify WebM content
 168 │       // ========================================
 169 │       const verifyBuffer = await blob.arrayBuffer();
     ·                            ─────
 170 │       const verifyBytes = new Uint8Array(verifyBuffer);
 171 │       const isValidWebM = verifyBytes.length >= 4 &&
 172 │                          verifyBytes[0] === 0x1A &&
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/projects/clipperstream/services/audioStorage.ts
./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
