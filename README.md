# Roundcraft

An open-source, kid-friendly Three.js mini game built by dads and kids. Roundcraft is a small round adventure world for learning coding together.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Do not open `index.html` directly as a file. The game uses small JavaScript modules, so the browser needs a local server.

## Project shape

- `index.html`: small page shell
- `src/main.js`: main game loop and world rules
- `src/styles.css`: screen and HUD styling
- `src/sheep.js`: sheep behavior
- `src/tools.js`: Pickaxe, Bow, and arrows
- `src/audio.js`: lava, pickaxe, bow, and dragon sounds

## Controls

- `W`, `A`, `S`, `D`: move
- Mouse: look around
- Space: jump
- `Q`: switch between Pickaxe and Bow
- `I`: open or close the Backpack
- `1` to `8`: use a Hotbar slot
- Hold left mouse button: mine lava crystals
- Hold left mouse button on volcano rock: dig a tunnel through the volcano
- Hold left mouse button on the wooden house: destroy it and collect wood
- With the Bow selected, left mouse shoots visible arrows at the Round Dragon
- Sheep walk on grass. Hit them with the Pickaxe or Bow to collect sheep meat.
- If fewer than two sheep are left, new sheep can appear after 30 seconds.
- The Round Dragon shoots visible fireballs. Only dragon fire can hurt you.
- You can swim in the lake and river.
- After defeating the dragon, Space flies up and Shift flies down
- `E`: eat meat when you have it

## For families

This project is intentionally small and easy to change. The goal is not a perfect game engine. The goal is to build a first playable world together with kids and make it fun to learn by changing real code.
