import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface QuestionSection {
  title: string;
  goal: string;
  questions: string[];
  notes?: string[];
}

const accountantQuestions: QuestionSection[] = [
  {
    title: "1. Business Structure & Big-Picture Strategy",
    goal: "Make sure your entity and setup aren't costing you money.",
    questions: [
      "Is my current business structure (LLC / S-Corp / sole prop, etc.) optimal for minimizing taxes right now?",
      "At what profit level would an S-Corp election make sense for me?",
      "Are there any structural changes you'd recommend in the next 6–12 months?",
      "Should I be doing anything differently because my business is still in its first year?",
      "What mistakes do you most often see new businesses make in their first year?"
    ],
    notes: ["Red flag: If they can't explain why a structure helps or hurts in plain language."]
  },
  {
    title: "2. How to Pay Yourself",
    goal: "Avoid IRS issues and optimize cash flow.",
    questions: [
      "What is the best way for me to pay myself (owner's draw vs payroll)?",
      "If an S-Corp is recommended: What would be considered a \"reasonable salary\" for my role?",
      "How often should payroll run?",
      "How do taxes differ between salary and distributions?",
      "How much should I set aside for taxes each month?",
      "Should I be making estimated quarterly tax payments—and how do we calculate them?"
    ]
  },
  {
    title: "3. Tax Minimization & Deductions",
    goal: "Keep more of what you earn—legally.",
    questions: [
      "What deductions am I currently missing or likely overlooking?",
      "What expenses should I absolutely be tracking from day one?",
      "Can I deduct: Home office?",
      "Can I deduct: Vehicle or mileage?",
      "Can I deduct: Phone, internet, software?",
      "Can I deduct: Meals or travel?",
      "Are there timing strategies (when to spend or invoice) that could reduce taxes?",
      "How should I think about depreciation vs expensing for equipment?"
    ],
    notes: ["Pro tip: Ask them to give 3 examples specific to your business, not hypotheticals."]
  },
  {
    title: "4. Bookkeeping & Records",
    goal: "Clean books now = cheaper taxes later.",
    questions: [
      "What bookkeeping system do you recommend (QuickBooks, Wave, etc.)?",
      "How often should books be reviewed—monthly or quarterly?",
      "Should I reconcile accounts myself or outsource it?",
      "What reports should I review regularly to stay tax-efficient?",
      "How long should I keep receipts and records?"
    ]
  },
  {
    title: "5. Compliance & Risk Management",
    goal: "Avoid penalties, audits, and surprises.",
    questions: [
      "What filings do I need to be aware of (federal, state, local)?",
      "Are there sales tax or use tax obligations I might be missing?",
      "What audit risks apply most to businesses like mine?",
      "How do we make sure I stay compliant as revenue grows?",
      "Will you proactively notify me of tax law changes that affect me?"
    ]
  },
  {
    title: "6. Planning for Growth",
    goal: "Set yourself up, not just survive.",
    questions: [
      "What should I be doing now to prepare for next year's taxes?",
      "How should profit increases change my tax strategy?",
      "When should I start thinking about retirement contributions (SEP IRA, Solo 401k, etc.)?",
      "If I hire employees or contractors, what tax changes should I expect?",
      "Are there cash-flow benchmarks I should aim for?"
    ]
  },
  {
    title: "7. Working Relationship & Expectations",
    goal: "Make sure they're the right fit.",
    questions: [
      "How do you typically work with new businesses?",
      "Do you provide proactive advice or mostly respond to questions?",
      "How often should we check in?",
      "What's included in your fee—and what's extra?",
      "What information do you need from me to do your best work?"
    ]
  },
  {
    title: "Bonus: One Question That Reveals Everything",
    goal: "Ask this near the end.",
    questions: [
      "\"If this were your business, what would you be doing differently over the next 6 months?\""
    ]
  }
];

const Accountant = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionKey: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const getQuestionKey = (sectionIndex: number, questionIndex: number) => {
    return `section-${sectionIndex}-question-${questionIndex}`;
  };

  const handleSave = () => {
    localStorage.setItem('accountant-answers', JSON.stringify(answers));
    toast({
      title: "Answers Saved",
      description: "Your answers have been saved to local storage.",
    });
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('accountant-answers');
    if (saved) {
      setAnswers(JSON.parse(saved));
      toast({
        title: "Answers Loaded",
        description: "Your saved answers have been loaded.",
      });
    } else {
      toast({
        title: "No Saved Data",
        description: "No previously saved answers found.",
        variant: "destructive"
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Accountant Dashboard</h1>
            <p className="text-muted-foreground">
              Questions to ask your accountant and track their answers
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} variant="default">
                Save Answers
              </Button>
              <Button onClick={handleLoad} variant="outline">
                Load Saved Answers
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {accountantQuestions.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">Goal: {section.goal}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.questions.map((question, questionIndex) => {
                    const key = getQuestionKey(sectionIndex, questionIndex);
                    return (
                      <div key={questionIndex} className="space-y-2">
                        <Label htmlFor={key} className="text-sm font-medium">
                          {question}
                        </Label>
                        <Textarea
                          id={key}
                          placeholder="Type your answer here..."
                          value={answers[key] || ''}
                          onChange={(e) => handleAnswerChange(key, e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    );
                  })}
                  {section.notes && section.notes.map((note, noteIndex) => (
                    <p key={noteIndex} className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                      {note}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Accountant;
