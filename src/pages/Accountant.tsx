import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Pencil, Check, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuestionSection {
  title: string;
  goal: string;
  questions: string[];
  notes?: string[];
}

const defaultQuestions: QuestionSection[] = [
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

interface SavedSession {
  accountantName: string;
  date: string;
  answers: Record<string, string>;
  questions: QuestionSection[];
}

const Accountant = () => {
  const [questions, setQuestions] = useState<QuestionSection[]>(() => {
    const saved = localStorage.getItem('accountant-questions');
    return saved ? JSON.parse(saved) : defaultQuestions;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<{ sectionIndex: number; questionIndex: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [accountantName, setAccountantName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

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
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    const session: SavedSession = {
      accountantName,
      date: sessionDate,
      answers,
      questions
    };
    localStorage.setItem('accountant-answers', JSON.stringify(session));
    localStorage.setItem('accountant-questions', JSON.stringify(questions));
    setShowSaveDialog(false);
    toast({
      title: "Session Saved",
      description: `Saved session with ${accountantName} on ${sessionDate}`,
    });
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('accountant-answers');
    if (saved) {
      const session: SavedSession = JSON.parse(saved);
      setAnswers(session.answers);
      if (session.questions) {
        setQuestions(session.questions);
      }
      if (session.accountantName) {
        setAccountantName(session.accountantName);
      }
      if (session.date) {
        setSessionDate(session.date);
      }
      toast({
        title: "Session Loaded",
        description: session.accountantName 
          ? `Loaded session with ${session.accountantName} from ${session.date}`
          : "Your saved answers have been loaded.",
      });
    } else {
      toast({
        title: "No Saved Data",
        description: "No previously saved answers found.",
        variant: "destructive"
      });
    }
  };

  const startEditQuestion = (sectionIndex: number, questionIndex: number) => {
    setEditingQuestion({ sectionIndex, questionIndex });
    setEditValue(questions[sectionIndex].questions[questionIndex]);
  };

  const saveEditQuestion = () => {
    if (!editingQuestion) return;
    const { sectionIndex, questionIndex } = editingQuestion;
    const newQuestions = [...questions];
    newQuestions[sectionIndex].questions[questionIndex] = editValue;
    setQuestions(newQuestions);
    localStorage.setItem('accountant-questions', JSON.stringify(newQuestions));
    setEditingQuestion(null);
    setEditValue('');
  };

  const cancelEditQuestion = () => {
    setEditingQuestion(null);
    setEditValue('');
  };

  const addQuestion = (sectionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[sectionIndex].questions.push('New question');
    setQuestions(newQuestions);
    localStorage.setItem('accountant-questions', JSON.stringify(newQuestions));
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[sectionIndex].questions.splice(questionIndex, 1);
    setQuestions(newQuestions);
    localStorage.setItem('accountant-questions', JSON.stringify(newQuestions));
  };

  const handleDragEnd = (result: DropResult, sectionIndex: number) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    const newQuestions = [...questions];
    const sectionQuestions = [...newQuestions[sectionIndex].questions];
    const [removed] = sectionQuestions.splice(sourceIndex, 1);
    sectionQuestions.splice(destIndex, 0, removed);
    newQuestions[sectionIndex].questions = sectionQuestions;
    
    // Also reorder the answers to maintain correct associations
    const newAnswers = { ...answers };
    const tempAnswers: Record<string, string> = {};
    
    // Save answers with new indices
    sectionQuestions.forEach((_, newIndex) => {
      const oldIndex = newIndex === destIndex 
        ? sourceIndex 
        : newIndex < Math.min(sourceIndex, destIndex) || newIndex > Math.max(sourceIndex, destIndex)
          ? newIndex
          : sourceIndex < destIndex
            ? newIndex + 1
            : newIndex - 1;
      
      const oldKey = getQuestionKey(sectionIndex, sourceIndex === newIndex ? sourceIndex : 
        newIndex === destIndex ? sourceIndex :
        newIndex > sourceIndex && newIndex <= destIndex ? newIndex :
        newIndex < sourceIndex && newIndex >= destIndex ? newIndex : newIndex);
    });
    
    // Rebuild answers for this section
    const sectionAnswers: string[] = [];
    for (let i = 0; i < questions[sectionIndex].questions.length; i++) {
      sectionAnswers.push(answers[getQuestionKey(sectionIndex, i)] || '');
    }
    const [removedAnswer] = sectionAnswers.splice(sourceIndex, 1);
    sectionAnswers.splice(destIndex, 0, removedAnswer);
    
    sectionAnswers.forEach((answer, index) => {
      if (answer) {
        newAnswers[getQuestionKey(sectionIndex, index)] = answer;
      } else {
        delete newAnswers[getQuestionKey(sectionIndex, index)];
      }
    });
    
    setAnswers(newAnswers);
    setQuestions(newQuestions);
    localStorage.setItem('accountant-questions', JSON.stringify(newQuestions));
  };

  const resetQuestions = () => {
    setQuestions(defaultQuestions);
    localStorage.setItem('accountant-questions', JSON.stringify(defaultQuestions));
    toast({
      title: "Questions Reset",
      description: "All questions have been reset to defaults.",
    });
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
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={handleSave} variant="default">
                Save Session
              </Button>
              <Button onClick={handleLoad} variant="outline">
                Load Saved Session
              </Button>
              <Button 
                onClick={() => setIsEditMode(!isEditMode)} 
                variant={isEditMode ? "secondary" : "outline"}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isEditMode ? 'Done Editing' : 'Edit Questions'}
              </Button>
              {isEditMode && (
                <Button onClick={resetQuestions} variant="outline" className="text-destructive">
                  Reset to Defaults
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">Goal: {section.goal}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, sectionIndex)}>
                    <Droppable droppableId={`section-${sectionIndex}`}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {section.questions.map((question, questionIndex) => {
                            const key = getQuestionKey(sectionIndex, questionIndex);
                            const isEditing = editingQuestion?.sectionIndex === sectionIndex && 
                                             editingQuestion?.questionIndex === questionIndex;
                            
                            return (
                              <Draggable
                                key={`${sectionIndex}-${questionIndex}`}
                                draggableId={`${sectionIndex}-${questionIndex}`}
                                index={questionIndex}
                                isDragDisabled={!isEditMode}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`space-y-2 ${snapshot.isDragging ? 'bg-muted rounded-lg p-2' : ''}`}
                                  >
                                    {isEditing ? (
                                      <div className="flex gap-2">
                                        <Input
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="flex-1"
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveEditQuestion}>
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={cancelEditQuestion}>
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-2">
                                        {isEditMode && (
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing pt-0.5"
                                          >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                        <Label htmlFor={key} className="text-sm font-medium flex-1">
                                          {question}
                                        </Label>
                                        {isEditMode && (
                                          <div className="flex gap-1">
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-6 w-6"
                                              onClick={() => startEditQuestion(sectionIndex, questionIndex)}
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-6 w-6 text-destructive"
                                              onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <Textarea
                                      id={key}
                                      placeholder="Type your answer here..."
                                      value={answers[key] || ''}
                                      onChange={(e) => handleAnswerChange(key, e.target.value)}
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  {isEditMode && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addQuestion(sectionIndex)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  )}
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

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Session</DialogTitle>
            <DialogDescription>
              Enter the accountant's name and session date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountant-name">Accountant Name</Label>
              <Input
                id="accountant-name"
                placeholder="e.g., John Smith, CPA"
                value={accountantName}
                onChange={(e) => setAccountantName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-date">Session Date</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSave}>
              Save Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default Accountant;
