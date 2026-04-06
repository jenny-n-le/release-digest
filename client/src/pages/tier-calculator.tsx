import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Answer = "yes" | "no" | null;

interface TierResult {
  tier: string;
  label: string;
  supportedBy: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const TIER_RESULTS: Record<string, TierResult> = {
  "Tier 0": {
    tier: "Tier 0",
    label: "New Product",
    supportedBy: "Jenny",
    description: "Net new product or monetizable capability still in Beta.",
    examples: ["VideoAI Beta", "Compliance Shield Beta", "Tip Management Beta", "Manager Logbook Beta"],
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  "Tier 1": {
    tier: "Tier 1",
    label: "Large or High-Risk Release",
    supportedBy: "Jonathan",
    description: "High-impact release requiring significant GTM coordination.",
    examples: ["January Minimum Wage Report Release", "CA Know Your Rights Alert", "New Payroll Run Experience", "Identity v2", "HRISv2", "OnboardingV2", "All major migrations"],
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  "Tier 2": {
    tier: "Tier 2",
    label: "Medium Release",
    supportedBy: "Jenny",
    description: "Involves major UI changes, requires changes in sales demo talk track, may require GTM enablement.",
    examples: ["Mobile v3", "Shared Time Clock", "Checkeeper Integration"],
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  "Tier 3": {
    tier: "Tier 3",
    label: "Small Release",
    supportedBy: "RJ / KM team",
    description: "Requires in-app tooltips, pop-ups, or banners.",
    examples: ["Bulk import team members on HR", "Export PDF of Schedule", "VoiceAI Recording Replay"],
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  Untiered: {
    tier: "Untiered",
    label: "X-small Release",
    supportedBy: "No GTM support required",
    description: "PM's release note alone or minor knowledge article updates is sufficient to update knowledge base.",
    examples: ["Filter payroll by first and last name", "Flexible interview durations (5 & 10 min)"],
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

interface ComputeResult {
  tier: TierResult;
  decidedAfter: "q1" | "q2" | "q3" | "q4" | "q5";
}

function computeTier(answers: {
  q1: Answer;
  q2: Answer;
  q3a: Answer;
  q3b: Answer;
  q3c: Answer;
  q4: Answer;
  q5: Answer;
}): ComputeResult | null {
  if (answers.q1 === "yes") return { tier: TIER_RESULTS["Tier 0"], decidedAfter: "q1" };
  if (answers.q1 !== "no") return null;

  if (answers.q2 === "yes") return { tier: TIER_RESULTS["Tier 1"], decidedAfter: "q2" };
  if (answers.q2 !== "no") return null;

  if (answers.q3a === "yes" && answers.q3b === "yes" && answers.q3c === "yes") {
    return { tier: TIER_RESULTS["Tier 1"], decidedAfter: "q3" };
  }

  const q3Answered = answers.q3a !== null && answers.q3b !== null && answers.q3c !== null;
  if (!q3Answered) return null;

  const anyQ3No = answers.q3a === "no" || answers.q3b === "no" || answers.q3c === "no";
  if (!anyQ3No) return null;

  if (answers.q4 === "yes") return { tier: TIER_RESULTS["Tier 2"], decidedAfter: "q4" };
  if (answers.q4 !== "no") return null;

  if (answers.q5 === "yes") return { tier: TIER_RESULTS["Tier 3"], decidedAfter: "q5" };
  if (answers.q5 === "no") return { tier: TIER_RESULTS["Untiered"], decidedAfter: "q5" };

  return null;
}

function YesNoToggle({
  value,
  onChange,
  disabled,
}: {
  value: Answer;
  onChange: (v: Answer) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value === "yes" ? null : "yes")}
        data-testid="button-yes"
        className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all ${
          value === "yes"
            ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
            : disabled
              ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
              : "bg-white text-muted-foreground border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        }`}
      >
        YES
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value === "no" ? null : "no")}
        data-testid="button-no"
        className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all ${
          value === "no"
            ? "bg-rose-100 text-rose-800 border-rose-300 shadow-sm"
            : disabled
              ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
              : "bg-white text-muted-foreground border-border hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
        }`}
      >
        NO
      </button>
    </div>
  );
}

function ResultCard({ result }: { result: TierResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2"
    >
      <Card className={`${result.bgColor} ${result.borderColor} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`text-base px-3 py-1 ${result.bgColor} ${result.color} border ${result.borderColor}`}>
                {result.tier}
              </Badge>
              <CardTitle className={`text-xl font-display ${result.color}`}>
                {result.label}
              </CardTitle>
            </div>
            <span className={`text-sm font-medium ${result.color}`}>
              Supported by {result.supportedBy}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-sm ${result.color} opacity-80`}>{result.description}</p>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${result.color} opacity-60 mb-2`}>
              Examples
            </p>
            <div className="flex flex-wrap gap-2">
              {result.examples.map((ex) => (
                <span
                  key={ex}
                  className={`text-xs px-2.5 py-1 rounded-full border ${result.borderColor} ${result.color} bg-white/60`}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TierCalculator() {
  const [q1, setQ1] = useState<Answer>(null);
  const [q2, setQ2] = useState<Answer>(null);
  const [q3a, setQ3a] = useState<Answer>(null);
  const [q3b, setQ3b] = useState<Answer>(null);
  const [q3c, setQ3c] = useState<Answer>(null);
  const [q4, setQ4] = useState<Answer>(null);
  const [q5, setQ5] = useState<Answer>(null);

  const result = useMemo(
    () => computeTier({ q1, q2, q3a, q3b, q3c, q4, q5 }),
    [q1, q2, q3a, q3b, q3c, q4, q5]
  );

  const isQ2Active = q1 === "no";
  const isQ3Active = q1 === "no" && q2 === "no";
  const q3AllYes = q3a === "yes" && q3b === "yes" && q3c === "yes";
  const q3AnyNo = q3a === "no" || q3b === "no" || q3c === "no";
  const q3AllAnswered = q3a !== null && q3b !== null && q3c !== null;
  const isQ4Active = isQ3Active && q3AllAnswered && q3AnyNo;
  const isQ5Active = isQ4Active && q4 === "no";

  const handleReset = () => {
    setQ1(null);
    setQ2(null);
    setQ3a(null);
    setQ3b(null);
    setQ3c(null);
    setQ4(null);
    setQ5(null);
  };

  const questionIcon = (active: boolean, resolved: boolean) => {
    if (resolved) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (active) return <HelpCircle className="h-5 w-5 text-primary" />;
    return <HelpCircle className="h-5 w-5 text-muted-foreground/30" />;
  };

  return (
    <div className="pb-20">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Release Tier Sizing Calculator
            </h2>
            <p className="text-muted-foreground mt-1">
              Answer the questions below to determine the recommended release tier.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset">
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset
          </Button>
        </div>

        <div className="space-y-4">
          {/* Q1 */}
          <Card className={`transition-all ${q1 !== null ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{questionIcon(true, q1 !== null)}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        Is this a net new product or monetizable capability that is still in Beta?
                      </p>
                    </div>
                    <YesNoToggle value={q1} onChange={setQ1} />
                  </div>
                  {q1 === "yes" && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-md border border-red-100">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Tier 0 (New Product)</span>
                    </div>
                  )}
                  {q1 === "no" && (
                    <div className="text-xs text-muted-foreground italic">Continue to next question...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && result.decidedAfter === "q1" && <ResultCard result={result.tier} />}

          {/* Q2 */}
          <Card className={`transition-all ${!isQ2Active ? "opacity-40" : q2 !== null ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{questionIcon(isQ2Active, isQ2Active && q2 !== null)}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        Does this release impact taxes, deductions, or compliance reporting?
                      </p>
                    </div>
                    <YesNoToggle value={q2} onChange={setQ2} disabled={!isQ2Active} />
                  </div>
                  {isQ2Active && q2 === "yes" && (
                    <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Tier 1 Release</span>
                      <span className="text-orange-500">(Supported by Jonathan)</span>
                    </div>
                  )}
                  {isQ2Active && q2 === "no" && (
                    <div className="text-xs text-muted-foreground italic">Continue to next question...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && result.decidedAfter === "q2" && <ResultCard result={result.tier} />}

          {/* Q3 - Multi-part */}
          <Card className={`transition-all ${!isQ3Active ? "opacity-40" : q3AllAnswered ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{questionIcon(isQ3Active, isQ3Active && q3AllAnswered)}</div>
                <div className="flex-1 space-y-4">
                  <p className="font-medium text-sm">Does this release:</p>

                  <div className="space-y-3 pl-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        a. Carry high risk to customers or spiking # of support tickets (if release fails)?
                      </p>
                      <YesNoToggle value={q3a} onChange={setQ3a} disabled={!isQ3Active} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        b. Require heavy coordination across GTM or phased roll out sequencing?
                      </p>
                      <YesNoToggle value={q3b} onChange={setQ3b} disabled={!isQ3Active} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        c. Impact more than 150 customer accounts?
                      </p>
                      <YesNoToggle value={q3c} onChange={setQ3c} disabled={!isQ3Active} />
                    </div>
                  </div>

                  {isQ3Active && q3AllYes && (
                    <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Tier 1 Release (all criteria met)</span>
                      <span className="text-orange-500">(Supported by Jonathan)</span>
                    </div>
                  )}
                  {isQ3Active && q3AllAnswered && q3AnyNo && (
                    <div className="text-xs text-muted-foreground italic">Not all criteria met — continue to next question...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && result.decidedAfter === "q3" && <ResultCard result={result.tier} />}

          {/* Q4 */}
          <Card className={`transition-all ${!isQ4Active ? "opacity-40" : q4 !== null ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{questionIcon(isQ4Active, isQ4Active && q4 !== null)}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        Does sales need to be trained or refreshed on this release?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        (Involves major UI changes, requires changes in sales demo talk track, may require sales or CIS one-pager)
                      </p>
                    </div>
                    <YesNoToggle value={q4} onChange={setQ4} disabled={!isQ4Active} />
                  </div>
                  {isQ4Active && q4 === "yes" && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Tier 2 Release</span>
                      <span className="text-blue-500">(Supported by Jenny)</span>
                    </div>
                  )}
                  {isQ4Active && q4 === "no" && (
                    <div className="text-xs text-muted-foreground italic">Continue to next question...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && result.decidedAfter === "q4" && <ResultCard result={result.tier} />}

          {/* Q5 */}
          <Card className={`transition-all ${!isQ5Active ? "opacity-40" : q5 !== null ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{questionIcon(isQ5Active, isQ5Active && q5 !== null)}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        Does this release require in-app tooltips, pop-ups, or banners?
                      </p>
                    </div>
                    <YesNoToggle value={q5} onChange={setQ5} disabled={!isQ5Active} />
                  </div>
                  {isQ5Active && q5 === "yes" && (
                    <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Tier 3 Release</span>
                      <span className="text-slate-500">(Supported by RJ / KM team)</span>
                    </div>
                  )}
                  {isQ5Active && q5 === "no" && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-semibold">Untiered</span>
                      <span className="text-gray-400">(No GTM support required)</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && result.decidedAfter === "q5" && <ResultCard result={result.tier} />}
        </div>
      </main>
    </div>
  );
}
