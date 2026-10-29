# tjarkbehrens.github.io

My personal website: one HTML page, a stylesheet, and a data file. No build step, no framework.

## Editing

| What | Where |
|---|---|
| Experience, news, publications, collaborators’ homepages | `data.js` |
| Bio, profile links, the note for students | `index.html` |
| Photo | `assets/tjark-behrens.jpg` (square) |
| Paper teasers | `assets/teasers/` (4:3, about 480×360) |
| Colours and type | `style.css` |

To add a paper, copy one of the blocks in `PUBLICATIONS` in `data.js` and edit it. Its co-authors show up under Collaborators automatically; add someone’s homepage to `PEOPLE` to turn their name into a link.

## Testing

**On your computer.** In this folder, run

    python3 -m http.server 8000

and open http://localhost:8000.

## Details

- The font is Schibsted Grotesk, served from this repository (SIL Open Font License, see `assets/fonts/OFL.txt`), so visitors’ browsers make no requests to Google.
- `main.js` assembles the email address, so it doesn’t appear in the HTML for simple scrapers.
- The contour lines around the photo come from `tools/make_contours.py` (needs numpy and scikit-image). Run it with another `--seed` for a different terrain, or delete `assets/topo.js` and its `<script>` tag to remove them.
- Layout inspired by Jon Barron’s website.
