import type { JudgedState, MasteryState } from "./contract";

/**
 * The one curated P0 topic (blueprint §2.2): trusted server constants.
 * The model may assess only these node ids; it cannot create, rename, or
 * delete concepts. Slugs are stable and load-bearing across fixtures,
 * progress storage, and tests — never rename them.
 */

export interface CuratedConceptNode {
  id: string; // stable slug
  label: string;
  /** Short educator-authored criteria for each judged state. */
  criteria: Record<JudgedState, string>;
}

export interface ConceptRelationship {
  from: string;
  to: string;
  description: string;
}

export interface CuratedTopic {
  id: string;
  title: string;
  nodes: readonly CuratedConceptNode[];
  relationships: readonly ConceptRelationship[];
}

export const WATER_CYCLE_TOPIC: CuratedTopic = {
  id: "water-cycle",
  title: "The Water Cycle",
  nodes: [
    {
      id: "solar-energy",
      label: "Solar energy",
      criteria: {
        emerging: "Mentions the sun or heat near water without saying what it does.",
        developing:
          "Says the sun heats water but not that this energy drives evaporation and the whole cycle.",
        secure:
          "Explains that energy from the sun heats surface water and powers the water cycle.",
      },
    },
    {
      id: "evaporation",
      label: "Evaporation",
      criteria: {
        emerging: "Names evaporation or 'water goes up' without cause or state change.",
        developing:
          "Links heat to water leaving surfaces but is imprecise about liquid turning to vapour.",
        secure:
          "Explains that heated liquid water becomes invisible water vapour that rises from oceans, lakes, and soil.",
      },
    },
    {
      id: "transpiration",
      label: "Transpiration",
      criteria: {
        emerging: "Mentions plants and water without saying plants release vapour.",
        developing:
          "Says plants give off water but not that vapour exits through leaves into the air.",
        secure:
          "Explains that plants release water vapour to the air through their leaves.",
      },
    },
    {
      id: "condensation",
      label: "Condensation",
      criteria: {
        emerging: "Mentions clouds forming without cooling or state change.",
        developing:
          "Links rising vapour to clouds but is vague about cooling turning vapour into droplets.",
        secure:
          "Explains that rising water vapour cools and condenses into tiny liquid droplets that form clouds.",
      },
    },
    {
      id: "precipitation",
      label: "Precipitation",
      criteria: {
        emerging: "Says rain falls without connecting it to clouds or droplet growth.",
        developing:
          "Says heavy clouds release rain or snow but not why droplets grow too heavy to stay aloft.",
        secure:
          "Explains that cloud droplets merge and grow until gravity pulls them down as rain, snow, or hail.",
      },
    },
    {
      id: "collection-and-surface-runoff",
      label: "Collection and surface runoff",
      criteria: {
        emerging: "Mentions water on the ground without where it flows or gathers.",
        developing:
          "Says water flows downhill or gathers but not that runoff collects in rivers, lakes, and oceans.",
        secure:
          "Explains that fallen water runs off the land downhill and collects in rivers, lakes, and oceans.",
      },
    },
    {
      id: "infiltration-and-groundwater",
      label: "Infiltration and groundwater",
      criteria: {
        emerging: "Mentions water going into the ground without what happens to it there.",
        developing:
          "Says water soaks into soil but not that it becomes stored groundwater that keeps moving.",
        secure:
          "Explains that water soaks into soil and rock, is stored as groundwater, and slowly feeds streams and oceans.",
      },
    },
    {
      id: "cyclic-movement-of-water",
      label: "Cyclic movement of water",
      criteria: {
        emerging: "Calls it a cycle without connecting any stages.",
        developing:
          "Chains some stages together but leaves the loop open or a stage disconnected.",
        secure:
          "Explains that the same water continuously cycles: evaporating, condensing, falling, collecting, and evaporating again.",
      },
    },
  ],
  relationships: [
    { from: "solar-energy", to: "evaporation", description: "Solar energy drives evaporation." },
    { from: "solar-energy", to: "transpiration", description: "Solar energy drives transpiration." },
    { from: "evaporation", to: "condensation", description: "Evaporated vapour condenses as it cools." },
    { from: "transpiration", to: "condensation", description: "Transpired vapour condenses as it cools." },
    { from: "condensation", to: "precipitation", description: "Condensed droplets grow and precipitate." },
    { from: "precipitation", to: "collection-and-surface-runoff", description: "Precipitation feeds runoff and collection." },
    { from: "precipitation", to: "infiltration-and-groundwater", description: "Precipitation infiltrates into groundwater." },
    { from: "collection-and-surface-runoff", to: "cyclic-movement-of-water", description: "Collected surface water re-enters the cycle." },
    { from: "infiltration-and-groundwater", to: "cyclic-movement-of-water", description: "Groundwater re-enters the cycle." },
    { from: "cyclic-movement-of-water", to: "evaporation", description: "The cycle loops back through evaporation." },
  ],
};

export const WATER_CYCLE_NODE_IDS: readonly string[] = WATER_CYCLE_TOPIC.nodes.map(
  (node) => node.id,
);

/** Fresh map with every curated node unassessed. */
export function initialMasteryStates(): Record<string, MasteryState> {
  return Object.fromEntries(WATER_CYCLE_NODE_IDS.map((id) => [id, "unassessed"]));
}
