import { v4 as uuidv4 } from "uuid";
import type { Todo as PrismaTodo } from "../../generated/prisma";
import {
  PriorityLevel,
  Todo,
  TodoStatus,
  WorkState,
  priorityLevelToString,
  todoStatusToString,
  workStateToString,
} from "./todo";

/**
 * Creates a Todo instance for testing
 */
export function createTestTodo(props: Partial<Todo> = {}): Todo {
  const id = props.id ?? uuidv4();
  const title = props.title ?? "Test Todo";
  const status = props.status ?? TodoStatus.PENDING;
  const workState = props.workState ?? WorkState.IDLE;
  const totalWorkTime = props.totalWorkTime ?? 0;
  const lastStateChangeAt = props.lastStateChangeAt ?? new Date();
  const createdAt = props.createdAt ?? new Date();
  const updatedAt = props.updatedAt ?? new Date();
  const priority = props.priority ?? PriorityLevel.MEDIUM;
  const projectId = props.projectId;
  const description = props.description;

  return new Todo(
    id,
    title,
    status,
    workState,
    totalWorkTime,
    lastStateChangeAt,
    createdAt,
    updatedAt,
    priority,
    projectId,
    description,
  );
}

/**
 * Creates a mock Prisma Todo for testing
 */
export function createMockPrismaTodo(overrides: Partial<PrismaTodo> = {}): PrismaTodo {
  return {
    id: overrides.id ?? uuidv4(),
    title: overrides.title ?? "Test Todo",
    status: overrides.status ?? "PENDING",
    workState: overrides.workState ?? "IDLE",
    totalWorkTime: overrides.totalWorkTime ?? 0,
    lastStateChangeAt: overrides.lastStateChangeAt ?? new Date(),
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    priority: overrides.priority ?? "MEDIUM",
    projectId: overrides.projectId ?? null,
    description: overrides.description ?? null,
    ...overrides,
  };
}

// Bunテスト環境でjestのタイマー関連関数をモックするためのヘルパー
let originalDateNow: () => number;
let mockedDate: Date | null = null;

type DateArgs = [string | number | Date] | [number, number, number?, number?, number?, number?, number?];

export const jest = {
  useFakeTimers: () => {
    originalDateNow = Date.now;
    // 現在の時刻を固定
    mockedDate = new Date();
    Date.now = () => (mockedDate ? mockedDate.getTime() : originalDateNow());
    global.Date = class extends Date {
      constructor(...args: DateArgs[number][]) {
        if (args.length === 0) {
          super(mockedDate ? mockedDate.getTime() : Date.now());
        } else {
          // @ts-expect-error - args is correctly typed but TypeScript is having trouble with the spread
          super(...args);
        }
      }
    } as DateConstructor;
  },

  useRealTimers: () => {
    if (originalDateNow) {
      Date.now = originalDateNow;
    }
    mockedDate = null;
    global.Date = Date;
  },

  advanceTimersByTime: (ms: number) => {
    if (mockedDate) {
      mockedDate = new Date(mockedDate.getTime() + ms);
    }
  },

  setSystemTime: (date: Date) => {
    mockedDate = date;
  },

  spyOn: <T extends Record<string, unknown>>(obj: T, method: string) => {
    type FunctionType = (...args: unknown[]) => unknown;

    if (typeof obj[method] !== "function") {
      throw new Error(`Method ${method} is not a function`);
    }

    const original = obj[method] as FunctionType;
    const calls: unknown[][] = [];

    // @ts-expect-error - We're dynamically replacing a method
    obj[method] = (...args: unknown[]) => {
      calls.push(args);
      return original.apply(obj, args);
    };

    return {
      mockReturnValue: (value: unknown) => {
        // @ts-expect-error - We're dynamically replacing a method
        obj[method] = (...args: unknown[]) => {
          calls.push(args);
          return value;
        };
        return obj[method];
      },
      mockImplementation: (impl: FunctionType) => {
        // @ts-expect-error - We're dynamically replacing a method
        obj[method] = (...args: unknown[]) => {
          calls.push(args);
          return impl.apply(obj, args);
        };
        return obj[method];
      },
      mockRestore: () => {
        // @ts-expect-error - We're dynamically replacing a method
        obj[method] = original;
      },
      calls: {
        length: () => calls.length,
        all: () => calls,
      },
    };
  },
};

// 必要な関数を再エクスポート
export { priorityLevelToString, todoStatusToString, workStateToString };
