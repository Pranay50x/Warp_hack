"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuizInterfaceProps {
  quiz: {
    quiz_id: string;
    topic: string;
    questions: QuizQuestion[];
    total_questions: number;
  };
  onSubmit: (quizId: string, answers: string[]) => void;
  isLoading: boolean;
}

export function QuizInterface({ quiz, onSubmit, isLoading }: QuizInterfaceProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(quiz.questions.length).fill(''));
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (answers.every(answer => answer !== '')) {
      onSubmit(quiz.quiz_id, answers);
    }
  };

  const isAnswered = (questionIndex: number) => answers[questionIndex] !== '';
  const allAnswered = answers.every(answer => answer !== '');

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            📝 Quiz: {quiz.topic}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Question Navigation */}
        <div className="flex justify-center space-x-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                index === currentQuestion
                  ? 'bg-blue-500 text-white'
                  : isAnswered(index)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {isAnswered(index) ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <Card className="p-4 bg-white dark:bg-gray-800">
          <h4 className="text-lg font-medium mb-4">
            {quiz.questions[currentQuestion]?.question}
          </h4>
          
          <RadioGroup
            value={answers[currentQuestion] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
            className="space-y-3"
          >
            {quiz.questions[currentQuestion]?.options.map((option, optionIndex) => {
              const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
              return (
                <div key={optionIndex} className="flex items-center space-x-3">
                  <RadioGroupItem value={optionLetter} id={`option-${optionIndex}`} />
                  <Label 
                    htmlFor={`option-${optionIndex}`} 
                    className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="font-medium">{optionLetter}.</span> {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentQuestion < quiz.questions.length - 1 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Answer Status */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {answers.filter(a => a !== '').length} of {quiz.questions.length} questions answered
          {!allAnswered && (
            <p className="text-orange-600 dark:text-orange-400 mt-1">
              Please answer all questions before submitting
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}