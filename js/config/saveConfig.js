/** Save file configuration. */
export const SAVE_CONFIG = {
  storageKey: 'meadow-defense-save',
  version: 6,

  /** Save code prefix — identifies Meadow Defense export strings. */
  saveCodePrefix: 'MDSAVE:',

  /** Payload format identifier inside decoded JSON. */
  saveCodeFormat: 'meadow-defense-save-code',

  /** Legacy keys migrated on first load. */
  legacyPrestigeKey: 'meadow-defense-prestige',
  legacySettingsKey: 'meadow-defense-settings',
};
