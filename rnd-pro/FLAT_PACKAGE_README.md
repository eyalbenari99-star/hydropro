# HydroNexis R&D Developer Package — Flat Delivery

Every deliverable is stored directly in this single folder. There are no subfolders and no duplicate delivery copies.

To prevent files with the same original name from overwriting each other, original directory separators are encoded as:

`___DIR___`

Examples:

- `frontend___DIR___src___DIR___rnd-ui___DIR___RNDApp.tsx`
- `backend___DIR___app___DIR___api___DIR___cockpit.py`
- `docs___DIR___DEVELOPER_REVIEW_GUIDE.md`

Open `frontend___DIR___review-preview.html` to view the compiled animated review interface.

Developers who need the normal buildable directory structure can run `RESTORE_ORIGINAL_STRUCTURE.sh`. It creates a separate reconstructed copy and leaves this flat delivery untouched.

