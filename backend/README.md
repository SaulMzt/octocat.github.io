# Backend de producción

GitHub Pages can host the interface, but it cannot store secrets or securely authorize administrative operations. For a production deployment:

1. Enable Firebase Authentication for administrators.
2. Create callable functions: `createRound`, `updateRound`, `importGoogleSheet` and `startSpin`.
3. In `startSpin`, validate the round state and admin claim, choose the winner with server-side randomness, and write the `spin` event.
4. Update Firestore rules so guests only read rounds and update their own presence document. Options, history and round state should be written by Functions.
5. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` as Functions environment secrets. OAuth and private sheets must not run in GitHub Pages.

The current interface already consumes a central spin event, so moving the winner calculation from `round-service.js` to a Function does not require redesigning the screens.
