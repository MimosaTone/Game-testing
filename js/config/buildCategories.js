import { TOWER_TYPES } from './towerTypes.js';
import { FARM_CONFIG } from './farmConfig.js';
import { SUPPORT_TYPES, SUPPORT_BUILD_ORDER } from './supportConfig.js';

/** Hotbar and right-panel build categories. */
export const BUILD_CATEGORIES = {
  towers: {
    id: 'towers',
    name: 'Towers',
    icon: '⚔',
    description: 'All defensive towers',
    items: Object.keys(TOWER_TYPES),
  },
  support: {
    id: 'support',
    name: 'Support',
    icon: '⌂',
    description: 'Passive support structures',
    items: SUPPORT_BUILD_ORDER,
  },
  economy: {
    id: 'economy',
    name: 'Economy',
    icon: '¤',
    description: 'Income and trade buildings',
    items: [
      FARM_CONFIG.id,
      'bank',
      'marketplace',
      'village',
    ],
  },
  magic: {
    id: 'magic',
    name: 'Magic',
    icon: '✧',
    description: 'Arcane towers and research',
    items: ['prism', 'ember', 'gust', 'frost', 'research_lab', 'crystal_extractor'],
  },
  military: {
    id: 'military',
    name: 'Military',
    icon: '◆',
    description: 'Heavy offense and fortification',
    items: ['needle', 'boulder', 'thorn', 'forge', 'repair_station'],
  },
};

export const BUILD_CATEGORY_ORDER = ['towers', 'support', 'economy', 'magic', 'military'];

export function getBuildItemDef(typeId) {
  if (TOWER_TYPES[typeId]) return { ...TOWER_TYPES[typeId], category: 'tower' };
  if (typeId === FARM_CONFIG.id) return { ...FARM_CONFIG, category: 'farm' };
  if (SUPPORT_TYPES[typeId]) return { ...SUPPORT_TYPES[typeId], category: 'support' };
  return null;
}
