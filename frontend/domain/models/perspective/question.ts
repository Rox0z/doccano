export const QuestionType = {
  OPEN: 'open',
  CLOSED: 'closed'
} as const

export type QuestionTypeValue = typeof QuestionType[keyof typeof QuestionType]

export const DataType = {
  STRING: 'string',
  INTEGER: 'integer'
} as const

export type DataTypeValue = typeof DataType[keyof typeof DataType]

export class QuestionOption {
  constructor(
    readonly id: number,
    readonly text: string,
    readonly order: number
  ) {}
}

export interface QuestionAnswer {
  id: number
  content: string
  created_at: string
}

export class Question {
  constructor(
    readonly id: number,
    readonly text: string,
    readonly questionType: QuestionTypeValue,
    readonly dataType: DataTypeValue | null,
    readonly isRequired: boolean,
    readonly order: number,
    readonly options: QuestionOption[],
    readonly answerCount: number,
    readonly userAnswered: boolean,
    readonly userAnswerId: number | null,
    readonly answers: QuestionAnswer[],
    readonly createdAt: string,
    readonly updatedAt: string
  ) {}

  get isOpen(): boolean {
    return this.questionType === QuestionType.OPEN
  }

  get isClosed(): boolean {
    return this.questionType === QuestionType.CLOSED
  }
}

export class Answer {
  constructor(
    readonly id: number,
    readonly questionId: number,
    readonly textAnswer: string | null,
    readonly selectedOptionId: number | null,
    readonly createdAt: string
  ) {}
}

export class QuestionStats {
  constructor(
    readonly id: number,
    readonly text: string,
    readonly questionType: QuestionTypeValue,
    readonly answerCount: number,
    readonly options: OptionStats[]
  ) {}
}

export class OptionStats {
  constructor(
    readonly id: number,
    readonly text: string,
    readonly answerCount: number
  ) {}
}

export class ProjectStats {
  constructor(
    readonly totalQuestions: number,
    readonly totalAnswers: number,
    readonly questionsWithAnswers: number,
    readonly questions: QuestionStats[]
  ) {}
}
