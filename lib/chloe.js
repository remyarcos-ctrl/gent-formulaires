/**
 * Point d'entrée unique pour les prompts de Chloé.
 * Les system prompts ont été extraits dans ./prompts/chloe-system.js pour faciliter la maintenance.
 * Ce fichier re-exporte tout pour ne pas casser les imports existants.
 */
export {
  CHLOE_DEAL_PROMPT,
  CHLOE_INTERVENTION_PROMPT,
  CHLOE_PV_PROMPT,
  CHLOE_ADMIN_PROMPT,
} from './prompts/chloe-system.js'
