/**
 * Schedule C (Form 1040) expense line definitions.
 * Maps line numbers to human-readable categories.
 */
export interface ScheduleCLine {
  line: string;
  label: string;
  description: string;
  mealRule?: boolean;
}

export const SCHEDULE_C_LINES: ScheduleCLine[] = [
  { line: "8", label: "Advertising", description: "Marketing, ads, business cards, website costs" },
  { line: "9", label: "Car & truck expenses", description: "Business miles, gas, repairs, lease payments" },
  { line: "10", label: "Commissions & fees", description: "Sales commissions, platform fees, payment processing" },
  { line: "11", label: "Contract labor", description: "Freelancers, subcontractors (1099 workers)" },
  { line: "13", label: "Depreciation", description: "Section 179 deductions, asset depreciation" },
  { line: "14", label: "Employee benefits", description: "Health insurance, retirement contributions for employees" },
  { line: "15", label: "Insurance", description: "Business liability, E&O, professional insurance" },
  { line: "16a", label: "Interest (mortgage)", description: "Mortgage interest on business property" },
  { line: "16b", label: "Interest (other)", description: "Business loan interest, credit card interest" },
  { line: "17", label: "Legal & professional", description: "Accounting, legal fees, tax preparation" },
  { line: "18", label: "Office expense", description: "Office supplies, postage, software subscriptions" },
  { line: "20a", label: "Rent (vehicles/equipment)", description: "Equipment leases, vehicle rentals" },
  { line: "20b", label: "Rent (other)", description: "Office space, coworking, storage" },
  { line: "21", label: "Repairs & maintenance", description: "Equipment repairs, maintenance costs" },
  { line: "22", label: "Supplies", description: "Materials and supplies consumed in business" },
  { line: "23", label: "Taxes & licenses", description: "Business licenses, state taxes, permits" },
  { line: "24a", label: "Travel", description: "Flights, hotels, transportation for business" },
  { line: "24b", label: "Meals", description: "Business meals (50% deductible)", mealRule: true },
  { line: "25", label: "Utilities", description: "Phone, internet, electricity for business" },
  { line: "27", label: "Other expenses", description: "Education, memberships, bank fees, etc." },
];

export const SCHEDULE_C_LINE_MAP = new Map(
  SCHEDULE_C_LINES.map((l) => [l.line, l])
);

/**
 * Self-employment tax rate constants (2025-2026).
 */
export const SE_TAX_RATE = 0.9235; // 92.35% of net earnings subject to SE tax
export const SOCIAL_SECURITY_RATE = 0.124; // 12.4%
export const MEDICARE_RATE = 0.029; // 2.9%
export const SE_COMBINED_RATE = SOCIAL_SECURITY_RATE + MEDICARE_RATE; // 15.3%
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 176100;

/**
 * Filing types and associated IRS forms.
 */
export interface FilingTypeConfig {
  type: string;
  label: string;
  forms: string[];
  description: string;
}

export const FILING_TYPES: FilingTypeConfig[] = [
  {
    type: "sole_proprietor",
    label: "Sole Proprietor",
    forms: ["Schedule C", "Schedule SE", "Form 1040-ES"],
    description: "Single owner, not incorporated",
  },
  {
    type: "single_llc",
    label: "Single-member LLC",
    forms: ["Schedule C", "Schedule SE", "Form 1040-ES"],
    description: "Disregarded entity, taxed as sole proprietor",
  },
  {
    type: "s_corp",
    label: "S-Corporation",
    forms: ["Form 1120-S", "Schedule K-1", "Form 1040-ES"],
    description: "Pass-through entity, officer compensation required",
  },
  {
    type: "partnership",
    label: "Partnership",
    forms: ["Form 1065", "Schedule K-1", "Form 1040-ES"],
    description: "Multi-member partnership or LLC",
  },
  {
    type: "c_corp",
    label: "C-Corporation",
    forms: ["Form 1120"],
    description: "Standard corporation with double taxation",
  },
];

export function getFilingTypeConfig(type: string | null): FilingTypeConfig {
  return (
    FILING_TYPES.find((f) => f.type === type || f.label === type) ??
    FILING_TYPES[0]
  );
}
