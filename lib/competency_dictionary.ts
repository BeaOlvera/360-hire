/**
 * Competency dictionary. Mirrors the competency library used by the user's
 * 360 Evaluate platform (Zephyron Consulting), reproduced here so 360 Hire
 * can pick from the same vocabulary when configuring jobs and interviews.
 *
 * Both `name` and `behaviours` are the user's own content from the sibling
 * 360 Evaluate codebase.
 */

export type DictCompetency = {
  id: string
  name: string
  behaviours: string[]
}

export const COMPETENCY_DICTIONARY: DictCompetency[] = [
  {
    id: 'results_focus',
    name: 'Results Focus',
    behaviours: [
      'Takes initiative without being asked',
      'Takes decisions within their scope',
      'Perseveres towards objectives despite obstacles',
      'Takes ownership and accountability',
      'Executes with agility and speed',
      'Shows ambition in achieving goals',
      'Pragmatism, finds workable solutions without overcomplicating',
      'Cost-benefit thinking, weighs effort and resources against outcomes',
      'Keeps business outcomes in mind',
    ],
  },
  {
    id: 'commercial_orientation',
    name: 'Commercial Orientation',
    behaviours: [
      'Knows the key metrics of their unit',
      'Meets short-term campaign and sales targets',
      'Applies commercial methodology consistently',
      'Identifies and acts on commercial opportunities',
      'Drives improvements in profitability',
    ],
  },
  {
    id: 'innovation_creativity',
    name: 'Innovation & Creativity',
    behaviours: [
      'Questions and challenges established work processes',
      'Generates creative and innovative ideas',
      'Stays current with market innovations and trends',
      'Adopts and promotes new work tools',
      'Shows constructive self-criticism and critical thinking',
    ],
  },
  {
    id: 'strategic_vision',
    name: 'Strategic Vision',
    behaviours: [
      'Conducts deep and thorough analysis',
      'Able to detect patterns',
      'Plans and prioritises effectively',
      'Defines strategic plan for their area of responsibility',
      'Understands and aligns with organisational strategy',
      'Thinks conceptually and connects the big picture',
      'Communicates complex ideas with clarity and synthesis',
    ],
  },
  {
    id: 'environmental_awareness',
    name: 'Environmental Awareness',
    behaviours: [
      'Knows the competitive landscape',
      'Knows the landscape of their functional speciality',
      'Follows sector trends and developments',
      'Adapts activity based on sector evolution',
      'Applies best practices from their field',
    ],
  },
  {
    id: 'self_knowledge_management',
    name: 'Self-Knowledge & Self-Management',
    behaviours: [
      'Demonstrates self-awareness, knows their strengths and development areas',
      'Tolerates and learns from mistakes',
      'Manages their emotional reactions and impulses effectively',
      'Seeks and acts on feedback',
      'Shows resilience under pressure or uncertainty',
    ],
  },
  {
    id: 'team_leadership',
    name: 'Team Leadership',
    behaviours: [
      'Develops team members professionally',
      'Communicates openly to engage the team in the project',
      'Understands the leader role and manages diversity',
      "Delegates according to each team member's capacity and maturity",
      'Sets clear performance expectations and objectives',
      'Monitors performance and follows through',
      'Manages conflict constructively',
      'Manages low performers, addresses underperformance directly and constructively',
      'Encourages the team to take calculated risks',
      'Listens actively and shows empathy',
      'Gives feedback and gives visibility to team contributions',
    ],
  },
  {
    id: 'cross_functional_collaboration',
    name: 'Cross-functional Collaboration',
    behaviours: [
      'Maintains a positive and constructive attitude in the team',
      'Proactively generates ideas and proposals',
      'Collaborates effectively across departments',
      'Prioritises collective goals over individual ones',
      'Leverages the strengths of different team members',
      'Builds synergies with people across the organisation',
      'Uses synchronous and asynchronous collaboration tools effectively',
      'Shares knowledge with others',
    ],
  },
  {
    id: 'stakeholder_relations',
    name: 'Stakeholder & Client Relations',
    behaviours: [
      'Deeply understands client needs',
      'Acts on client satisfaction levels',
      'Handles client complaints professionally',
      'Builds long-term client loyalty',
      'Manages supplier relationships effectively',
      'Communicates and influences clients and stakeholders',
      'Represents the organisation professionally in external interactions',
    ],
  },
  {
    id: 'change_management',
    name: 'Change Management',
    behaviours: [
      'Creates a vision of change, gives meaning and direction to transformation',
      'Sets the direction of change for their area',
      'Influences and mobilises others to embrace change',
      'Shows optimism and energy in the face of challenges',
      'Acts as a driver of change in their environment',
      'Leverages networks and relationships to drive change',
      'Reacts calmly and effectively to unexpected situations',
      'Manages uncertainty with composure',
    ],
  },
]

export function getDictCompetencyById(id: string): DictCompetency | null {
  return COMPETENCY_DICTIONARY.find((c) => c.id === id) ?? null
}
