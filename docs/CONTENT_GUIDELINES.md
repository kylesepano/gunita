# Historical content and imagery

Use documented events and identifiable sources. Never fabricate quotations, people, dates or authoritative explanations. Separate a contemporary record, a later interpretation and a commemorative convention. Treat myths and disputed details as such.

The source link and any editorial caveat appear in the archive and answer reveal. Starting references include the National Historical Commission of the Philippines, National Library of the Philippines, NASA, the National Army Museum, Imperial War Museums, Berlin's official history pages and Encyclopaedia Britannica. Every event has a `source` and supports an optional `note`; relational `event_sources` supports further references and review status.

## Review notes for this collection

- The Cry of Pugad Lawin has disputed dates and sites. The game asks only its year, flags the dispute and names its commemorative map target. The four-stage sequence is a broad narrative.
- Lapulapu's statue is a modern depiction, not a verified contemporary likeness. His exact appearance is not known.
- The Philippine independence declaration did not immediately end foreign rule or bring recognition.
- EDSA's causes are simplified. Avoid portraying a multi-actor movement as the achievement of one person.
- Berlin opened at multiple crossings; Bornholmer Straße is a specific representative target.
- D-Day involved overlapping airborne and seaborne operations and five beaches. The ordered stages are broad phases. Omaha Beach is the representative map target.
- Apollo 11 landed on the Moon; the Earth-map question explicitly asks for its launch site.
- Constantinople's detailed chronology and causal wording remain flagged for editorial review. Do not promote the starter explanations into scholarly authority without additional review.
- Coordinates are approximate targets, particularly for broad battles and mass movements. They are not exact archaeological positions.
- All three clue rows initially share the same text. Difficulty is currently expressed through the mechanics and score modifiers.

Cause distractors are deliberately false options, not claims about other events. Author them per event; blindly borrowing another event's valid cause can accidentally produce a second correct answer.

## Images

The interface is English and the brand is simply Gunita; historical people and places retain their proper names. Neil Armstrong now uses a civilian photograph from 2011, not a spacesuit portrait. Face-focused framing of full-length historical depictions reduces clothing, equipment and inscription clues. Public-domain or licensed depictions cannot always offer a perfectly neutral contemporary headshot.

Images are downloaded to `public/portraits`. `credits.json` and `credits.html` preserve original Commons file pages, author/credit metadata and licenses. Most are public domain; the Lapulapu image is CC BY-SA 4.0 and the Schabowski image is CC BY-SA 3.0 DE. Retain these licenses and attribution if moving to Storage. CSS crops affect presentation only. Do not replace images with unreviewed random URLs.

Before adding a new event: check the source, name uncertainty, choose the map target, identify a primary person and their role, author causes and incorrect options, validate the chronological stages, provide imagery with attribution, and regenerate the SQL seed using `npm run seed:generate`.
