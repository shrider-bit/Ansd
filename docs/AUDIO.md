# Audio

## Sound effects
All sound effects are **synthesised in code** with the Web Audio API
(`src/game/audio.ts`): footsteps, creaking floors, doors, wardrobe, thunder, wind,
whispers, electrical hum, heartbeat, chase music, Granny's cackle and the jump scare.
There are no audio files to license. Positional sounds use 3D panning plus a muffling
filter when there is a wall in between, so you can tell where Granny is.

## Granny's voice (placeholder)
Right now Granny speaks with the device's **built-in speech synthesiser**, pitched down
and slowed (free, works offline, no paid text-to-speech API). Quality depends on the
device: Windows and Android include English voices; an Arabic voice is only used if the
device has one installed. Every line is also shown as a subtitle.

### Replace it with recorded files
1. Record or generate the lines in `src/shared/voiceLines.ts` (5 per child, per language),
   with rights you're allowed to use. A family member doing a creepy granny voice works great.
2. Save them as MP3 using this naming scheme (line numbers start at 1):

   ```
   public/audio/voice/en/ahmed_1.mp3 ... ahmed_5.mp3
   public/audio/voice/en/miral_1.mp3 ... miral_5.mp3
   public/audio/voice/ar/ahmed_1.mp3 ... ahmed_5.mp3
   public/audio/voice/ar/miral_1.mp3 ... miral_5.mp3
   ```
3. List each file in `public/audio/voice/manifest.json`, e.g.
   `{ "files": ["en/ahmed_1.mp3", "en/ahmed_2.mp3"] }`.

Listed files are played instead of the speech synthesiser. The game speeds or slows them
using the **Voice pitch** setting. Lines without a file still fall back to speech.
Echo, reverb and 3D positioning of recorded lines are planned for Phase 4.
