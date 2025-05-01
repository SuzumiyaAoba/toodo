export type WorkPeriodId = string;

export interface WorkPeriodCreateInput {
  name: string;
  date?: Date;
  startTime: Date;
  endTime: Date;
}

export class WorkPeriod {
  readonly id: WorkPeriodId;
  readonly name: string;
  readonly date: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly activities: {
    id: string;
    type: string;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];

  constructor(
    id: WorkPeriodId,
    name: string,
    startTime: Date,
    endTime: Date,
    date: Date = new Date(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    activities: {
      id: string;
      type: string;
      note?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[] = [],
  ) {
    if (startTime > endTime) {
      throw new Error("Start time must be before end time");
    }

    this.id = id;
    this.name = name;
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.activities = activities;
  }

  updateName(name: string): WorkPeriod {
    if (this.name === name) return this;
    return new WorkPeriod(
      this.id,
      name,
      this.startTime,
      this.endTime,
      this.date,
      this.createdAt,
      new Date(),
      this.activities,
    );
  }

  updatePeriod(startTime: Date, endTime: Date): WorkPeriod {
    if (startTime > endTime) {
      throw new Error("Start time must be before end time");
    }

    if (this.startTime.getTime() === startTime.getTime() && this.endTime.getTime() === endTime.getTime()) {
      return this;
    }

    return new WorkPeriod(
      this.id,
      this.name,
      startTime,
      endTime,
      this.date,
      this.createdAt,
      new Date(),
      this.activities,
    );
  }

  updateDate(date: Date): WorkPeriod {
    if (this.date.getTime() === date.getTime()) return this;
    return new WorkPeriod(
      this.id,
      this.name,
      this.startTime,
      this.endTime,
      date,
      this.createdAt,
      new Date(),
      this.activities,
    );
  }

  // 稼働時間の期間（ミリ秒）を取得
  getDurationMs(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  // 期間が重なるかをチェック
  overlaps(other: WorkPeriod): boolean {
    return (
      (this.startTime <= other.startTime && other.startTime < this.endTime) ||
      (other.startTime <= this.startTime && this.startTime < other.endTime)
    );
  }

  // 同じ日付かどうかをチェック
  isSameDate(other: WorkPeriod): boolean {
    return (
      this.date.getFullYear() === other.date.getFullYear() &&
      this.date.getMonth() === other.date.getMonth() &&
      this.date.getDate() === other.date.getDate()
    );
  }

  static createNew(
    input: WorkPeriodCreateInput & {
      id: WorkPeriodId;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): WorkPeriod {
    return new WorkPeriod(
      input.id,
      input.name,
      input.startTime,
      input.endTime,
      input.date ?? new Date(),
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date(),
    );
  }
}

type DomainPrismaWorkPeriod = {
  id: string;
  name: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  activities?: {
    id: string;
    type: string;
    note?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }[];
};

export function mapToDomainWorkPeriod(prismaWorkPeriod: DomainPrismaWorkPeriod): WorkPeriod {
  return new WorkPeriod(
    prismaWorkPeriod.id,
    prismaWorkPeriod.name,
    new Date(prismaWorkPeriod.startTime),
    new Date(prismaWorkPeriod.endTime),
    new Date(prismaWorkPeriod.date),
    new Date(prismaWorkPeriod.createdAt),
    new Date(prismaWorkPeriod.updatedAt),
    prismaWorkPeriod.activities?.map((activity) => ({
      id: activity.id,
      type: activity.type,
      note: activity.note,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(activity.updatedAt),
    })) || [],
  );
}
