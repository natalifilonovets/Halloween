# Halloween · Dracula’s Monster Check

An illustrated English learning game with eight monster characters.

1. Read a monster name and click to flip the card to its picture. Click again to return to the word.
2. Build the monster names with magic letter bubbles.
3. Rub the secret cards to uncover two facts. Dust disappears only along the eraser path. Cards stay open until the learner chooses the next card; there is no reading timer. An explicit REVEAL button is also available.
4. Solve eight monster riddles. The final screen offers PLAY AGAIN.

Open `index.html`, or serve the folder with `python3 -m http.server 8765`.
The fixed 1600×900 stage scales to fit its window or an embedded iframe.
All artwork and styles are included; no build step is required.

## GitHub Pages

In Settings → Pages, select **Deploy from a branch**, **main**, **/(root)**.
The expected site address is https://natalifilonovets.github.io/Halloween/ once Pages is enabled and deployed.
See `EMBED_GENIALLY.txt` for embedding instructions.

## Checks

`tests/flip-preview.html` checks all eight card flips and the initial word/picture order.
Add `?victory` to check the final screen and replay.
`tests/secret-card-preview.html` checks card text bounds, rubbing, explicit reveal, and the absence of automatic card dismissal.
